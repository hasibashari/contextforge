import { Injectable, Logger } from '@nestjs/common';
import type { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket as WsClient, RawData } from 'ws';
import {
  AndroidBridgeRequestMessage,
  AndroidBridgeResponseMessage,
} from '../android-bridge.types';

export interface ExtendedWsClient extends WsClient {
  isAlive?: boolean;
  deviceId?: string;
}

export type ConnectionCallback = (
  ws: WsClient,
  deviceId: string,
  clientIp: string,
) => void;
export type MessageCallback = (ws: WsClient, rawData: RawData) => void;
export type DisconnectCallback = (ws: WsClient, deviceId: string) => void;
export type HeartbeatTickCallback = (deviceId: string) => void;

@Injectable()
export class AndroidWsTransportService {
  private readonly logger = new Logger(AndroidWsTransportService.name);
  private wss: WebSocketServer | null = null;
  private readonly activeClients: Set<WsClient> = new Set();
  private readonly deviceSockets: Map<string, WsClient> = new Map();
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private readonly HEARTBEAT_INTERVAL_MS = 30000;
  private readonly CLIENT_TIMEOUT_MS = 60000;
  private bridgeEnabled = true;

  public setBridgeEnabled(enabled: boolean): void {
    this.bridgeEnabled = enabled;
    this.logger.log(
      `📱 [Android WebSocket Bridge] Bridge enabled set to: ${enabled}`,
    );
  }

  public isBridgeEnabled(): boolean {
    return this.bridgeEnabled;
  }

  public getSocketForDevice(deviceId?: string): WsClient | undefined {
    if (deviceId && this.deviceSockets.has(deviceId)) {
      return this.deviceSockets.get(deviceId);
    }
    return this.activeClients.size > 0
      ? Array.from(this.activeClients)[0]
      : undefined;
  }

  public hasOpenSocket(): boolean {
    for (const ws of this.activeClients) {
      if (ws.readyState === WsClient.OPEN) {
        return true;
      }
    }
    return false;
  }

  /**
   * Safe frame transmission to WebSocket client
   */
  sendToClient(
    ws: WsClient,
    message:
      | Record<string, unknown>
      | AndroidBridgeRequestMessage
      | AndroidBridgeResponseMessage,
  ): boolean {
    try {
      if (ws.readyState === WsClient.OPEN) {
        ws.send(JSON.stringify(message));
        return true;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Failed to send frame to WebSocket client: ${msg}`);
    }
    return false;
  }

  /**
   * Attaches WebSocket server to HTTP server and handles upgrade routing
   */
  attachHttpServer(
    server: HttpServer,
    onConnection: ConnectionCallback,
    onMessage: MessageCallback,
    onDisconnect: DisconnectCallback,
    onHeartbeatTick: HeartbeatTickCallback,
  ): void {
    if (this.wss) return;

    try {
      this.wss = new WebSocketServer({ noServer: true });

      server.on('upgrade', (request, socket, head) => {
        try {
          const pathname = (request.url || '').split('?')[0];
          if (pathname === '/api/android-bridge/ws') {
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
        const rawUrl = req.url || '';
        const urlParams = new URL(rawUrl, 'http://localhost').searchParams;
        const deviceId =
          urlParams.get('deviceId') ||
          urlParams.get('id') ||
          'default-android-device';

        // Reject connection if user explicitly disconnected from Desktop
        if (!this.bridgeEnabled) {
          this.logger.warn(
            `🚫 [Android WebSocket Bridge] Connection from ${clientIp} rejected: Bridge disabled from Desktop.`,
          );
          try {
            ws.send(
              JSON.stringify({
                type: 'server_disconnect',
                action: 'disconnect',
                requireRePairing: true,
                unpair: true,
                reason:
                  'Bridge is disconnected on Desktop. Please scan QR code in Web UI to re-pair.',
                timestamp: Date.now(),
              }),
            );
            ws.close(1000, 'Bridge disabled on Desktop');
          } catch {
            // safe ignore
          }
          return;
        }

        const extWs = ws as ExtendedWsClient;
        extWs.isAlive = true;
        extWs.deviceId = deviceId;

        this.logger.log(
          `📱 [Android WebSocket Bridge] Device connection accepted from ${clientIp} (deviceId: ${deviceId})`,
        );

        // Prune stale or closed sockets
        for (const existingWs of this.activeClients) {
          if (existingWs.readyState !== WsClient.OPEN) {
            this.activeClients.delete(existingWs);
          }
        }
        this.activeClients.add(ws);
        this.deviceSockets.set(deviceId, ws);

        onConnection(ws, deviceId, clientIp);

        ws.on('pong', () => {
          extWs.isAlive = true;
          onHeartbeatTick(deviceId);
        });

        ws.on('message', (rawData: RawData) => {
          extWs.isAlive = true;
          onMessage(ws, rawData);
        });

        ws.on('close', () => {
          this.logger.log(
            `📱 [Android WebSocket Bridge] Device disconnected (deviceId: ${deviceId})`,
          );
          this.removeClient(ws, onDisconnect);
        });

        ws.on('error', (err: Error) => {
          this.logger.warn(
            `Android WebSocket bridge client error: ${err.message}`,
          );
          this.removeClient(ws, onDisconnect);
        });

        // Request initial handshake probe from newly connected phone
        this.sendToClient(ws, {
          id: `init-${Date.now()}`,
          type: 'mcp_bridge_request',
          action: 'get_device_status',
          payload: {},
          timestamp: Date.now(),
        });
      });

      this.startHeartbeatDaemon(onDisconnect);

      this.logger.log(
        '🚀 [Android Bridge Gateway] WebSocket server listening on path: /api/android-bridge/ws',
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Failed to initialize Android WebSocket Bridge server: ${msg}`,
      );
    }
  }

  private startHeartbeatDaemon(onDisconnect: DisconnectCallback): void {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(() => {
      for (const ws of this.activeClients) {
        const extWs = ws as ExtendedWsClient;
        if (extWs.isAlive === false) {
          this.logger.warn(
            '🔌 [Android Bridge Gateway] Dead peer detected (missed heartbeat). Terminating socket...',
          );
          this.removeClient(ws, onDisconnect);
          continue;
        }

        extWs.isAlive = false;
        try {
          if (ws.readyState === WsClient.OPEN) {
            ws.ping();
          }
        } catch {
          this.removeClient(ws, onDisconnect);
        }
      }
    }, this.HEARTBEAT_INTERVAL_MS);
  }

  private removeClient(ws: WsClient, onDisconnect?: DisconnectCallback): void {
    const extWs = ws as ExtendedWsClient;
    const deviceId = extWs.deviceId || 'default-android-device';

    this.activeClients.delete(ws);
    if (this.deviceSockets.get(deviceId) === ws) {
      this.deviceSockets.delete(deviceId);
    }

    try {
      if (
        ws.readyState === WsClient.OPEN ||
        ws.readyState === WsClient.CLOSING
      ) {
        ws.terminate();
      }
    } catch {
      // safe ignore
    }

    if (onDisconnect) {
      onDisconnect(ws, deviceId);
    }
  }

  /**
   * Disconnects and unpairs all active clients
   */
  disconnectAll(
    reason: string,
    onDisconnect: (deviceId: string) => void,
  ): void {
    this.bridgeEnabled = false;
    for (const ws of this.activeClients) {
      try {
        if (ws.readyState === WsClient.OPEN) {
          ws.send(
            JSON.stringify({
              type: 'server_disconnect',
              action: 'disconnect',
              requireRePairing: true,
              unpair: true,
              reason,
              timestamp: Date.now(),
            }),
          );
          ws.close(1000, reason);
        }
      } catch (err: unknown) {
        this.logger.warn(`Error closing client socket: ${String(err)}`);
      }
    }

    const deviceIds = Array.from(this.deviceSockets.keys());
    this.activeClients.clear();
    this.deviceSockets.clear();

    for (const id of deviceIds) {
      onDisconnect(id);
    }
  }

  cleanup(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
    this.activeClients.clear();
    this.deviceSockets.clear();
  }
}
