import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import type { Response } from 'express';

export interface IntegrationStatusEvent {
  type: 'integration_status_changed';
  integrationId: string;
  status: 'connected' | 'disconnected' | 'error';
  payload?: unknown;
  timestamp: number;
}

export interface PairingSessionEvent {
  type: 'pairing_status_changed';
  sessionId: string;
  status: 'waiting' | 'confirmed' | 'expired';
  deviceInfo?: unknown;
  timestamp: number;
}

export type EcosystemRealtimeEvent =
  | IntegrationStatusEvent
  | PairingSessionEvent
  | { type: 'heartbeat'; timestamp: number }
  | { type: 'init'; timestamp: number };

@Injectable()
export class EcosystemEventsService implements OnModuleDestroy {
  private readonly logger = new Logger(EcosystemEventsService.name);
  private readonly clients: Set<Response> = new Set();
  private heartbeatTimer: NodeJS.Timeout | null = null;

  constructor() {
    // 25s heartbeat to keep SSE open across all proxies, firewalls, and browsers
    this.heartbeatTimer = setInterval(() => {
      this.broadcast({ type: 'heartbeat', timestamp: Date.now() });
    }, 25000);
  }

  onModuleDestroy() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    for (const res of this.clients) {
      try {
        res.end();
      } catch {
        // Ignore closing errors
      }
    }
    this.clients.clear();
  }

  /**
   * Register a new client SSE connection (from React frontend)
   */
  public addClient(res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    this.clients.add(res);
    this.logger.log(
      `📡 [SSE] Client connected. Total active streams: ${this.clients.size}`,
    );

    // Send initial handshake
    this.sendToClient(res, { type: 'init', timestamp: Date.now() });

    res.on('close', () => {
      this.clients.delete(res);
      this.logger.log(
        `📡 [SSE] Client disconnected. Remaining streams: ${this.clients.size}`,
      );
    });
  }

  /**
   * Broadcast an integration status change event to all connected UI clients
   */
  public emitIntegrationStatus(
    integrationId: string,
    status: 'connected' | 'disconnected' | 'error',
    payload?: unknown,
  ) {
    this.logger.log(
      `📢 [SSE Broadcast] Integration "${integrationId}" status changed -> ${status.toUpperCase()}`,
    );
    this.broadcast({
      type: 'integration_status_changed',
      integrationId,
      status,
      payload,
      timestamp: Date.now(),
    });
  }

  /**
   * Broadcast an Android QR pairing session status update
   */
  public emitPairingSessionUpdate(
    sessionId: string,
    status: 'waiting' | 'confirmed' | 'expired',
    deviceInfo?: unknown,
  ) {
    this.logger.log(
      `📢 [SSE Broadcast] Pairing session "${sessionId}" status -> ${status.toUpperCase()}`,
    );
    this.broadcast({
      type: 'pairing_status_changed',
      sessionId,
      status,
      deviceInfo,
      timestamp: Date.now(),
    });
  }

  private broadcast(event: EcosystemRealtimeEvent) {
    for (const client of this.clients) {
      this.sendToClient(client, event);
    }
  }

  private sendToClient(client: Response, event: EcosystemRealtimeEvent) {
    try {
      client.write(`event: ${event.type}\n`);
      client.write(`data: ${JSON.stringify(event)}\n\n`);
    } catch (err: unknown) {
      this.logger.warn(`Failed to write to SSE client: ${String(err)}`);
      this.clients.delete(client);
    }
  }
}
