import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
  Optional,
} from '@nestjs/common';
import type { Server as HttpServer } from 'http';
import { RawData, WebSocket as WsClient } from 'ws';
import { PostgresPubSubService } from '../../../common/database/postgres-pubsub.service';
import { AndroidDeviceInfo } from './android-bridge.types';
import {
  AndroidWsTransportService,
  ExtendedWsClient,
} from './services/android-ws-transport.service';
import { AndroidSessionService } from './services/android-session.service';
import {
  AndroidRpcDispatcherService,
  DistributedBridgeRequestPayload,
} from './services/android-rpc-dispatcher.service';
import { AndroidProtocolService } from './services/android-protocol.service';

@Injectable()
export class AndroidBridgeGatewayService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(AndroidBridgeGatewayService.name);
  private readonly instanceId = `instance-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  private unsubscribeReq?: () => void;
  private unsubscribeRes?: () => void;

  private activeDeviceInfo: AndroidDeviceInfo = {
    connected: false,
    deviceName: 'Android Mobile Device',
  };

  private deviceConnectedListeners: Array<(info: AndroidDeviceInfo) => void> =
    [];
  private deviceDisconnectedListeners: Array<() => void> = [];

  constructor(
    private readonly transport: AndroidWsTransportService,
    private readonly sessionService: AndroidSessionService,
    private readonly rpcDispatcher: AndroidRpcDispatcherService,
    private readonly protocol: AndroidProtocolService,
    @Optional() private readonly pubSub?: PostgresPubSubService,
  ) {}

  async onModuleInit() {
    this.logger.log(
      `📱 AndroidBridgeGatewayService initialized on instance: ${this.instanceId}`,
    );

    // Subscribe to distributed cross-instance pub/sub channels
    if (this.pubSub) {
      try {
        this.unsubscribeReq = await this.pubSub.subscribe(
          'android_bridge_req',
          (raw) => this.handleDistributedRequest(raw),
        );
        this.unsubscribeRes = await this.pubSub.subscribe(
          'android_bridge_res',
          (raw) => this.rpcDispatcher.handleDistributedResponse(raw),
        );
      } catch (err: unknown) {
        this.logger.warn(
          `Failed to bind PostgreSQL pub/sub channels: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
  }

  onModuleDestroy() {
    if (this.unsubscribeReq) this.unsubscribeReq();
    if (this.unsubscribeRes) this.unsubscribeRes();
    this.rpcDispatcher.cleanup();
    this.transport.cleanup();
  }

  public onDeviceConnected(listener: (info: AndroidDeviceInfo) => void) {
    this.deviceConnectedListeners.push(listener);
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

  public setBridgeEnabled(enabled: boolean): void {
    this.transport.setBridgeEnabled(enabled);
  }

  public isBridgeEnabled(): boolean {
    return this.transport.isBridgeEnabled();
  }

  public disconnectAllClients(reason = 'User disconnected from Desktop') {
    this.transport.disconnectAll(reason, (deviceId) => {
      void this.sessionService.markOffline(deviceId, this.instanceId);
    });
    this.activeDeviceInfo = {
      connected: false,
      deviceName: 'Android Mobile Device',
    };
    this.deviceDisconnectedListeners.forEach((fn) => fn());
  }

  /**
   * Attaches WebSocket server to main NestJS HTTP Server
   */
  attachHttpServer(server: HttpServer) {
    this.transport.attachHttpServer(
      server,
      (ws, deviceId, clientIp) => this.handleConnection(ws, deviceId, clientIp),
      (ws, rawData) => this.handleClientMessage(ws, rawData),
      (_ws, deviceId) => this.handleDisconnect(deviceId),
      (deviceId) => {
        this.activeDeviceInfo.lastPingAt = Date.now();
        void this.sessionService.updateHeartbeat(deviceId, this.instanceId);
      },
    );
  }

  private handleConnection(_ws: WsClient, deviceId: string, clientIp: string) {
    this.activeDeviceInfo = {
      connected: true,
      deviceId,
      deviceName: 'Android Mobile Device',
      clientIp,
      connectedAt: Date.now(),
      lastPingAt: Date.now(),
    };

    void this.sessionService.upsertSession(
      this.activeDeviceInfo,
      this.instanceId,
    );
    this.deviceConnectedListeners.forEach((fn) => fn(this.activeDeviceInfo));
  }

  private handleDisconnect(deviceId: string) {
    this.activeDeviceInfo.connected = false;
    void this.sessionService.markOffline(deviceId, this.instanceId);
    this.deviceDisconnectedListeners.forEach((fn) => fn());
  }

  private handleClientMessage(ws: WsClient, rawData: RawData) {
    const message = this.protocol.parseRawMessage(rawData);
    if (!message) return;

    const extWs = ws as ExtendedWsClient;
    const deviceId = extWs.deviceId || 'default-android-device';

    // 1. Handle RPC Response for active tool calls
    const rpcEval = this.protocol.evaluateRpcResponse(message);
    if (rpcEval.isResponse && rpcEval.reqId) {
      this.rpcDispatcher.handleResponse(
        rpcEval.reqId,
        rpcEval.responseData,
        rpcEval.errorMessage,
        rpcEval.hasExplicitError,
      );
      return;
    }

    // 2. Handshake / Device Status Report
    if (this.protocol.isDeviceReport(message)) {
      this.activeDeviceInfo = this.protocol.extractDeviceInfo(
        message,
        this.activeDeviceInfo,
        'unknown',
        deviceId,
      );
      this.logger.log(
        `📱 [Android Bridge] Handshake received: Device="${this.activeDeviceInfo.deviceName}" OS="${this.activeDeviceInfo.androidVersion || 'N/A'}" Battery=${this.activeDeviceInfo.batteryLevel !== undefined ? this.activeDeviceInfo.batteryLevel + '%' : 'N/A'}`,
      );

      void this.sessionService.upsertSession(
        this.activeDeviceInfo,
        this.instanceId,
      );
      this.deviceConnectedListeners.forEach((fn) => fn(this.activeDeviceInfo));

      this.transport.sendToClient(ws, {
        id: `ack-${Date.now()}`,
        type: 'mcp_bridge_response',
        success: true,
        data: {
          status: 'connected',
          serverInstance: this.instanceId,
          timestamp: Date.now(),
        },
        timestamp: Date.now(),
      });
      return;
    }

    // 3. Heartbeat Ping
    if (this.protocol.isPing(message)) {
      this.activeDeviceInfo.lastPingAt = Date.now();
      void this.sessionService.updateHeartbeat(deviceId, this.instanceId);
      const pongId =
        typeof message.id === 'string' || typeof message.id === 'number'
          ? String(message.id)
          : `pong-${Date.now()}`;
      this.transport.sendToClient(ws, {
        id: pongId,
        type: 'mcp_bridge_response',
        success: true,
        data: { status: 'pong', timestamp: Date.now() },
        timestamp: Date.now(),
      });
    }
  }

  private handleDistributedRequest(raw: string) {
    try {
      const parsed = JSON.parse(raw) as DistributedBridgeRequestPayload;
      if (!parsed.requestId || !parsed.action) return;

      const targetWs = this.transport.getSocketForDevice(parsed.deviceId);
      if (targetWs) {
        this.logger.log(
          `📡 [Bridge PubSub] Relaying distributed request "${parsed.action}" (id: ${parsed.requestId}) to local socket`,
        );
        this.transport.sendToClient(targetWs, {
          id: parsed.requestId,
          type: 'mcp_bridge_request',
          action: parsed.action,
          payload: parsed.payload,
          timestamp: Date.now(),
        });
      }
    } catch (err: unknown) {
      this.logger.warn(`Distributed request relay error: ${String(err)}`);
    }
  }

  isBridgeConnected(): boolean {
    return this.transport.hasOpenSocket() || this.activeDeviceInfo.connected;
  }

  async isBridgeConnectedDistributed(): Promise<boolean> {
    return this.sessionService.isOnlineDistributed(this.isBridgeConnected());
  }

  isDeviceConnected(): boolean {
    return this.isBridgeConnected();
  }

  getDeviceInfo(): AndroidDeviceInfo {
    return {
      ...this.activeDeviceInfo,
      connected: this.isBridgeConnected(),
    };
  }

  getActiveDeviceInfo(): AndroidDeviceInfo {
    return this.getDeviceInfo();
  }

  /**
   * Dispatches a tool request locally or via distributed PostgreSQL PubSub
   */
  async dispatchBridgeRequest<T = unknown>(
    action: string,
    payload: Record<string, unknown> = {},
    timeoutMs = 15000,
    targetDeviceId?: string,
  ): Promise<T> {
    const deviceId = targetDeviceId || 'default-android-device';
    const targetWs = this.transport.getSocketForDevice(deviceId);
    const isLocalOpen = !!targetWs;

    return this.rpcDispatcher.dispatchRequest<T>(
      action,
      payload,
      timeoutMs,
      deviceId,
      this.instanceId,
      (reqMsg) =>
        targetWs ? this.transport.sendToClient(targetWs, reqMsg) : false,
      isLocalOpen,
    );
  }
}
