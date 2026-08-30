import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import type { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket as WsClient, RawData } from 'ws';

export interface AndroidDeviceInfo {
  connected: boolean;
  deviceName: string;
  androidVersion?: string;
  batteryLevel?: number;
  clientIp?: string;
  connectedAt?: number;
  lastPingAt?: number;
}

export interface AndroidBridgeRequestMessage {
  id: string;
  type: 'mcp_bridge_request';
  action: string;
  payload: Record<string, unknown>;
  timestamp: number;
}

export interface AndroidBridgeResponseMessage {
  id: string;
  type: 'mcp_bridge_response';
  success: boolean;
  data?: unknown;
  error?: string;
  timestamp: number;
}

interface ExtendedWsClient extends WsClient {
  isAlive?: boolean;
}

interface PendingRpcRequest {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
  timer: NodeJS.Timeout;
  action: string;
}

@Injectable()
export class AndroidBridgeGatewayService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(AndroidBridgeGatewayService.name);
  private wss: WebSocketServer | null = null;
  private activeClients: Set<WsClient> = new Set();
  private pendingRequests: Map<string, PendingRpcRequest> = new Map();
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private readonly HEARTBEAT_INTERVAL_MS = 30000;
  private readonly CLIENT_TIMEOUT_MS = 60000;

  private activeDeviceInfo: AndroidDeviceInfo = {
    connected: false,
    deviceName: 'Android Mobile Device',
  };

  private deviceConnectedListeners: Array<(info: AndroidDeviceInfo) => void> =
    [];
  private deviceDisconnectedListeners: Array<() => void> = [];

  public onDeviceConnected(listener: (info: AndroidDeviceInfo) => void) {
    this.deviceConnectedListeners.push(listener);
    // If device is already connected, notify immediately
    if (this.activeDeviceInfo.connected) {
      try {
        listener(this.activeDeviceInfo);
      } catch (e) {
        this.logger.warn(`Immediate device listener error: ${String(e)}`);
      }
    }
  }

  public onDeviceDisconnected(listener: () => void) {
    this.deviceDisconnectedListeners.push(listener);
  }

  private notifyConnected(info: AndroidDeviceInfo) {
    this.deviceConnectedListeners.forEach((fn) => {
      try {
        fn(info);
      } catch (e) {
        this.logger.warn(`Device connected listener error: ${String(e)}`);
      }
    });
  }

  private notifyDisconnected() {
    this.deviceDisconnectedListeners.forEach((fn) => {
      try {
        fn();
      } catch (e) {
        this.logger.warn(`Device disconnected listener error: ${String(e)}`);
      }
    });
  }

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

  /**
   * Explicitly disconnects and unpairs all active Android clients
   */
  public disconnectAllClients(reason = 'User disconnected from Desktop') {
    this.bridgeEnabled = false;
    const hasActiveClients = this.activeClients.size > 0;
    const wasConnected = this.activeDeviceInfo.connected;

    if (!hasActiveClients && !wasConnected) {
      return;
    }

    this.logger.log(
      `🔌 Disconnecting and unpairing Android clients: ${reason}`,
    );

    for (const ws of this.activeClients) {
      try {
        if (ws.readyState === WsClient.OPEN) {
          // Send explicit unpair & disconnect message to trigger reset on Android companion app
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

    this.activeClients.clear();
    this.activeDeviceInfo = {
      connected: false,
      deviceName: 'Android Mobile Device',
    };
    if (wasConnected) {
      this.notifyDisconnected();
    }
  }

  onModuleInit() {
    this.logger.log('AndroidBridgeGatewayService initialized.');
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

        // Auto-enable bridge on any incoming device connection attempt
        this.bridgeEnabled = true;

        const extWs = ws as ExtendedWsClient;
        extWs.isAlive = true;

        this.logger.log(
          `📱 [Android WebSocket Bridge] Device connection accepted from ${clientIp}`,
        );
        this.activeClients.add(ws);

        this.activeDeviceInfo = {
          connected: true,
          deviceName: 'Android Mobile Device',
          clientIp,
          connectedAt: Date.now(),
          lastPingAt: Date.now(),
        };

        // Notify modules immediately so Web UI instantly shows Connected
        this.notifyConnected(this.activeDeviceInfo);

        ws.on('pong', () => {
          extWs.isAlive = true;
          this.activeDeviceInfo.lastPingAt = Date.now();
        });

        ws.on('message', (rawData: RawData) => {
          extWs.isAlive = true;
          this.handleClientMessage(ws, rawData);
        });

        ws.on('close', () => {
          this.logger.log('📱 [Android WebSocket Bridge] Device disconnected');
          this.activeClients.delete(ws);
          if (
            this.activeClients.size === 0 &&
            this.activeDeviceInfo.connected
          ) {
            this.activeDeviceInfo.connected = false;
            this.notifyDisconnected();
          }
        });

        ws.on('error', (err: Error) => {
          this.logger.warn(
            `Android WebSocket bridge client error: ${err.message}`,
          );
          this.activeClients.delete(ws);
          if (
            this.activeClients.size === 0 &&
            this.activeDeviceInfo.connected
          ) {
            this.activeDeviceInfo.connected = false;
            this.notifyDisconnected();
          }
        });

        // Request initial handshake/device-info from newly connected phone
        this.sendToClient(ws, {
          id: `init-${Date.now()}`,
          type: 'mcp_bridge_request',
          action: 'get_device_status',
          payload: {},
          timestamp: Date.now(),
        });
      });

      this.startHeartbeatDaemon();

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

  /**
   * Proactively pings active clients every 30s to detect dead peer sockets (with 60s grace timeout)
   */
  private startHeartbeatDaemon() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(() => {
      const now = Date.now();
      for (const ws of this.activeClients) {
        const extWs = ws as ExtendedWsClient;
        const lastPing = this.activeDeviceInfo.lastPingAt || 0;
        const isTimeOut = now - lastPing > this.CLIENT_TIMEOUT_MS;

        if (extWs.isAlive === false && isTimeOut) {
          this.logger.warn(
            '🔌 [Android Bridge Gateway] Dead peer detected (missed heartbeat for >60s). Terminating socket...',
          );
          this.activeClients.delete(ws);
          try {
            ws.terminate();
          } catch {
            // Ignore safe
          }
          if (
            this.activeClients.size === 0 &&
            this.activeDeviceInfo.connected
          ) {
            this.activeDeviceInfo.connected = false;
            this.notifyDisconnected();
          }
          continue;
        }

        extWs.isAlive = false;
        try {
          if (ws.readyState === WsClient.OPEN) {
            ws.ping();
          }
        } catch {
          this.activeClients.delete(ws);
        }
      }
    }, this.HEARTBEAT_INTERVAL_MS);
  }

  private handleClientMessage(ws: WsClient, rawData: RawData) {
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

      const message = JSON.parse(text) as Record<string, unknown>;

      const _logType = String(message.type);
      const _logId =
        typeof message.id === 'string' || typeof message.id === 'number'
          ? String(message.id)
          : '-';
      const _logAction =
        typeof message.action === 'string' ? message.action : '-';
      const _logSuccess =
        typeof message.success === 'boolean' ? String(message.success) : '-';
      this.logger.log(
        `📥 [Bridge RPC] Received from device: type="${_logType}" id="${_logId}" action="${_logAction}" success=${_logSuccess}`,
      );

      // ─────────────────────────────────────────────────────────────────────
      // IMPORTANT: RPC response detection supports TWO wire formats:
      //
      // Standard (original):  { id, type: "mcp_bridge_response", success: true/false, data }
      // Android companion app: { id, action: "...", status: "success"|"ok"|"error", data }
      //
      // Android format does NOT have a `type` field — the only reliable
      // identifier is the presence of `id` matching a pending request.
      // We check pending requests first so we never miss a real RPC response.
      // ─────────────────────────────────────────────────────────────────────

      // 1. Handle RPC response for dispatched tool calls (highest priority)
      if (message.id) {
        const rawId = message.id;
        const reqId =
          typeof rawId === 'string'
            ? rawId
            : typeof rawId === 'number'
              ? String(rawId)
              : null;
        const pending = reqId ? this.pendingRequests.get(reqId) : undefined;

        if (pending) {
          // Matches a live pending request — this IS a tool-call response.
          const isStandardFormat = message.type === 'mcp_bridge_response';
          const isAndroidFormat =
            typeof message.action === 'string' && message.status !== undefined;

          if (isStandardFormat || isAndroidFormat) {
            clearTimeout(pending.timer);
            this.pendingRequests.delete(reqId!);

            // Normalize success flag:
            // Standard format: success boolean
            // Android format:  status string "success" | "ok" | "error" | ...
            const statusStr =
              typeof message.status === 'string'
                ? message.status.toLowerCase()
                : '';
            const isSuccess =
              message.success === true ||
              statusStr === 'success' ||
              statusStr === 'ok';

            if (isSuccess) {
              pending.resolve(message.data);
            } else {
              const errMsg =
                (typeof message.error === 'string' ? message.error : '') ||
                (typeof message.message === 'string' ? message.message : '') ||
                `Bridge RPC error for action ${pending.action} (status: ${statusStr || String(message.success)})`;
              pending.reject(new Error(errMsg));
            }
            return;
          }
        }

        // No pending request for this id — fall through to handshake check.
        // Handles Android replying to the initial get_device_status probe
        // (sent on connect without a pendingRequests entry).
      }

      // 2. Handshake or Device Info report from Android app
      if (
        message.type === 'android_handshake' ||
        message.type === 'device_status' ||
        message.type === 'handshake' ||
        message.type === 'client_hello' ||
        message.type === 'register_device' ||
        message.action === 'handshake' ||
        message.action === 'get_device_status' ||
        (message.type === 'mcp_bridge_response' &&
          typeof message.data === 'object' &&
          message.data !== null &&
          'deviceName' in (message.data as Record<string, unknown>))
      ) {
        // Android companion app wraps device info inside `data` field.
        // Standard format may also use `data`. Extract accordingly.
        const hasNestedData =
          typeof message.data === 'object' && message.data !== null;
        const payload = hasNestedData
          ? (message.data as Record<string, unknown>)
          : message;

        const devName =
          (payload.deviceName as string) ||
          (payload.device as string) ||
          (payload.name as string) ||
          (payload.model as string) ||
          'Android Mobile Device';

        const androidVer =
          (payload.androidVersion as string) ||
          (payload.osVersion as string) ||
          (payload.version as string) ||
          undefined;

        let battery: number | undefined;
        if (typeof payload.batteryLevel === 'number') {
          battery = payload.batteryLevel;
        } else if (typeof payload.battery === 'number') {
          battery = payload.battery;
        } else if (typeof payload.batteryLevel === 'string') {
          const parsed = parseInt(payload.batteryLevel, 10);
          if (!isNaN(parsed)) battery = parsed;
        }

        this.activeDeviceInfo = {
          connected: true,
          deviceName: devName,
          androidVersion: androidVer,
          batteryLevel: battery,
          clientIp: this.activeDeviceInfo.clientIp,
          connectedAt: this.activeDeviceInfo.connectedAt || Date.now(),
          lastPingAt: Date.now(),
        };

        this.logger.log(
          `✨ [Android WebSocket Bridge] Handshake verified for device: "${this.activeDeviceInfo.deviceName}" (Android ${this.activeDeviceInfo.androidVersion || 'Native'}, Battery: ${this.activeDeviceInfo.batteryLevel ?? 100}%)`,
        );

        // Acknowledge handshake
        try {
          ws.send(
            JSON.stringify({
              type: 'handshake_ack',
              success: true,
              message: 'Connected to ContextForge MCP Bridge',
              timestamp: Date.now(),
            }),
          );
        } catch {
          // Ignore send errors
        }

        // Notify all registered modules/services with rich device metadata
        this.notifyConnected(this.activeDeviceInfo);
        return;
      }

      // 3. Heartbeat / Ping from Android
      if (message.type === 'ping' || message.type === 'heartbeat') {
        this.activeDeviceInfo.lastPingAt = Date.now();
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        return;
      }

      // 4. Unrecognized message — log for Android-side debugging
      this.logger.debug(
        `[Android Bridge] Unrecognized message from device (type: "${String(message.type)}", action: "${String(message.action)}"). Full: ${JSON.stringify(message).slice(0, 200)}`,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `Failed to process Android bridge socket message: ${msg}`,
      );
    }
  }

  private sendToClient(
    ws: WsClient,
    message: AndroidBridgeRequestMessage,
  ): boolean {
    if (ws.readyState === WsClient.OPEN) {
      ws.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  /**
   * Check if at least one Android mobile device is actively connected via WebSocket
   */
  isBridgeConnected(): boolean {
    for (const ws of this.activeClients) {
      if (ws.readyState === WsClient.OPEN) {
        return true;
      }
    }
    return false;
  }

  isDeviceConnected(): boolean {
    return this.isBridgeConnected();
  }

  /**
   * Returns current active Android device information
   */
  getDeviceInfo(): AndroidDeviceInfo {
    const isConnected = this.isBridgeConnected();
    return {
      ...this.activeDeviceInfo,
      connected: isConnected,
    };
  }

  getActiveDeviceInfo(): AndroidDeviceInfo {
    return this.getDeviceInfo();
  }

  /**
   * Dispatches a tool request to the connected Android device via WebSocket and awaits the result
   */
  async dispatchBridgeRequest<T = unknown>(
    action: string,
    payload: Record<string, unknown> = {},
    timeoutMs = 12000,
  ): Promise<T> {
    const activeWs = Array.from(this.activeClients).find(
      (ws) => ws.readyState === WsClient.OPEN,
    );

    if (!activeWs) {
      throw new Error(
        `Android device is not connected via WebSocket. Please open the Android MCP Bridge app on your phone to connect.`,
      );
    }

    const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const requestMessage: AndroidBridgeRequestMessage = {
      id: requestId,
      type: 'mcp_bridge_request',
      action,
      payload,
      timestamp: Date.now(),
    };

    this.logger.log(
      `📤 [Bridge RPC] Sending "${action}" to device | id=${requestId} | payload=${JSON.stringify(payload).slice(0, 120)}`,
    );

    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        this.logger.error(
          `⏱️ [Bridge RPC] Timeout waiting for "${action}" response | id=${requestId} | No mcp_bridge_response received from device within ${timeoutMs}ms. Check Android app logs — ensure the app is sending back { id: "${requestId}", type: "mcp_bridge_response", success: true/false, data: {...} }`,
        );
        reject(
          new Error(
            `Timeout: Android device request for "${action}" exceeded ${timeoutMs}ms without response.`,
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
            `Failed to transmit request "${action}" to Android device socket.`,
          ),
        );
      }
    });
  }

  private cleanup() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    for (const pending of this.pendingRequests.values()) {
      clearTimeout(pending.timer);
      pending.reject(new Error('Android Bridge Gateway is shutting down.'));
    }
    this.pendingRequests.clear();

    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
    this.activeClients.clear();
  }
}
