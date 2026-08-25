import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import type { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket as WsClient, RawData } from 'ws';

export interface BridgeVaultInfo {
  connected: boolean;
  vaultName: string;
  subfolderScope?: string;
  permissionGranted: boolean;
  foldersCount?: number;
  filesCount?: number;
  lastSyncedAt?: string;
}

export interface BridgeRequestMessage {
  id: string;
  type: 'mcp_bridge_request';
  action: string;
  payload: Record<string, unknown>;
  timestamp: number;
}

export interface BridgeResponseMessage {
  id: string;
  type: 'mcp_bridge_response';
  success: boolean;
  data?: unknown;
  error?: string;
  timestamp: number;
}

export interface BridgeHeartbeatMessage {
  type: 'mcp_bridge_heartbeat' | 'mcp_bridge_sync_vault';
  vaultInfo?: BridgeVaultInfo;
  folders?: string[];
}

interface ClientIncomingMessage {
  type?: string;
  id?: string;
  success?: boolean;
  data?: unknown;
  error?: string;
  vaultInfo?: BridgeVaultInfo;
  folders?: string[];
}

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
  timer: NodeJS.Timeout;
  action: string;
}

@Injectable()
export class ObsidianBridgeGatewayService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(ObsidianBridgeGatewayService.name);
  private wss: WebSocketServer | null = null;
  private activeClients: Set<WsClient> = new Set();
  private pendingRequests: Map<string, PendingRequest> = new Map();

  // Cached state reported by active browser client
  private activeVaultInfo: BridgeVaultInfo = {
    connected: false,
    vaultName: '',
    permissionGranted: false,
  };
  private cachedFolders: string[] = [];

  onModuleInit() {
    this.logger.log('ObsidianBridgeGatewayService initialized.');
  }

  onModuleDestroy() {
    this.cleanup();
  }

  /**
   * Attaches WebSocket server to the main NestJS HTTP Server
   */
  attachHttpServer(server: HttpServer) {
    if (this.wss) return;

    try {
      this.wss = new WebSocketServer({
        noServer: true,
      });

      server.on('upgrade', (request, socket, head) => {
        try {
          const pathname = (request.url || '').split('?')[0];
          if (pathname === '/api/obsidian-bridge/ws') {
            this.wss?.handleUpgrade(request, socket, head, (ws) => {
              this.wss?.emit('connection', ws, request);
            });
          }
        } catch (err: unknown) {
          this.logger.warn(`Upgrade routing error: ${String(err)}`);
        }
      });

      this.wss.on('connection', (ws: WsClient, req) => {
        const clientIp = req.socket.remoteAddress || 'unknown';
        this.logger.log(
          `🔌 [Browser Bridge] Client connected from ${clientIp}`,
        );
        this.activeClients.add(ws);

        ws.on('message', (rawData: RawData) => {
          this.handleClientMessage(ws, rawData);
        });

        ws.on('close', () => {
          this.logger.log('🔌 [Browser Bridge] Client disconnected');
          this.activeClients.delete(ws);
        });

        ws.on('error', (err: Error) => {
          this.logger.warn(`Browser bridge client error: ${err.message}`);
          this.activeClients.delete(ws);
        });

        // Request initial vault sync from newly connected client
        this.sendToClient(ws, {
          id: `init-${Date.now()}`,
          type: 'mcp_bridge_request',
          action: 'get_vault_info',
          payload: {},
          timestamp: Date.now(),
        });
      });

      this.logger.log(
        '🚀 [Obsidian Bridge Gateway] WebSocket server listening on path: /api/obsidian-bridge/ws',
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to initialize WebSocket Bridge server: ${msg}`);
    }
  }

  private handleClientMessage(_ws: WsClient, rawData: RawData) {
    try {
      let text: string;
      if (typeof rawData === 'string') {
        text = rawData;
      } else if (Buffer.isBuffer(rawData)) {
        text = rawData.toString('utf-8');
      } else if (Array.isArray(rawData)) {
        text = Buffer.concat(rawData).toString('utf-8');
      } else if (rawData instanceof ArrayBuffer) {
        text = Buffer.from(rawData).toString('utf-8');
      } else {
        text = Buffer.from(rawData).toString('utf-8');
      }
      const message = JSON.parse(text) as ClientIncomingMessage;

      // Handle RPC response
      if (message.type === 'mcp_bridge_response' && message.id) {
        const pending = this.pendingRequests.get(message.id);
        if (pending) {
          clearTimeout(pending.timer);
          this.pendingRequests.delete(message.id);

          if (message.success) {
            pending.resolve(message.data);
          } else {
            pending.reject(
              new Error(
                message.error ||
                  `Bridge RPC error for action ${pending.action}`,
              ),
            );
          }
        }
        return;
      }

      // Handle periodic sync or heartbeat from browser
      if (message.type === 'mcp_bridge_sync_vault') {
        if (message.vaultInfo) {
          this.activeVaultInfo = {
            ...this.activeVaultInfo,
            ...message.vaultInfo,
            connected: Boolean(message.vaultInfo.connected),
            lastSyncedAt: new Date().toISOString(),
          };
        }
        if (Array.isArray(message.folders)) {
          this.cachedFolders = message.folders;
        }
        if (this.activeVaultInfo.connected && this.activeVaultInfo.vaultName) {
          this.logger.log(
            `📁 [Browser Bridge] Vault state synchronized: "${this.activeVaultInfo.vaultName}" (${this.cachedFolders.length} folders indexed)`,
          );
        } else {
          this.logger.debug(
            `🔌 [Browser Bridge] Vault status: Disconnected / Not paired`,
          );
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Failed to process bridge client message: ${msg}`);
    }
  }

  private sendToClient(ws: WsClient, message: BridgeRequestMessage): boolean {
    if (ws.readyState === WsClient.OPEN) {
      ws.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  /**
   * Check if at least one browser bridge client is connected
   */
  isBridgeConnected(): boolean {
    for (const ws of this.activeClients) {
      if (ws.readyState === WsClient.OPEN) {
        return true;
      }
    }
    return false;
  }

  /**
   * Returns current active vault status
   */
  getVaultInfo(): BridgeVaultInfo {
    const isConnected = this.isBridgeConnected();
    return {
      ...this.activeVaultInfo,
      connected: isConnected && this.activeVaultInfo.permissionGranted,
    };
  }

  /**
   * Returns locally cached folder hierarchy for rapid prompts
   */
  getCachedFolders(): string[] {
    return this.cachedFolders;
  }

  /**
   * Updates cached folders
   */
  setCachedFolders(folders: string[]) {
    this.cachedFolders = folders;
  }

  /**
   * Core RPC Dispatcher: Dispatches a command to the Browser Bridge and awaits the result
   */
  async dispatchBridgeRequest<T = unknown>(
    action: string,
    payload: Record<string, unknown> = {},
    timeoutMs = 15000,
  ): Promise<T> {
    const activeWs = Array.from(this.activeClients).find(
      (ws) => ws.readyState === WsClient.OPEN,
    );

    if (!activeWs) {
      throw new Error(
        `Obsidian Browser Bridge is not connected. Please open ContextForge in your web browser and pair your local Obsidian vault via the Integrations panel.`,
      );
    }

    const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const requestMessage: BridgeRequestMessage = {
      id: requestId,
      type: 'mcp_bridge_request',
      action,
      payload,
      timestamp: Date.now(),
    };

    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(
          new Error(
            `Timeout: Browser Bridge request for "${action}" exceeded ${timeoutMs}ms without response.`,
          ),
        );
      }, timeoutMs);

      this.pendingRequests.set(requestId, {
        resolve: (val: unknown) => resolve(val as T),
        reject,
        timer,
        action,
      });

      const sent = this.sendToClient(activeWs, requestMessage);
      if (!sent) {
        clearTimeout(timer);
        this.pendingRequests.delete(requestId);
        reject(
          new Error(
            `Failed to transmit request "${action}" to browser bridge socket.`,
          ),
        );
      }
    });
  }

  private cleanup() {
    for (const pending of this.pendingRequests.values()) {
      clearTimeout(pending.timer);
      pending.reject(new Error('Obsidian Bridge Gateway is shutting down.'));
    }
    this.pendingRequests.clear();

    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
    this.activeClients.clear();
  }
}
