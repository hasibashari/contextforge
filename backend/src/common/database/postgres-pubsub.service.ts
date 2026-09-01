import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PoolClient } from 'pg';
import { DatabaseService } from './database.service';

export type PubSubMessageHandler = (payload: string) => void;

@Injectable()
export class PostgresPubSubService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PostgresPubSubService.name);
  private listenerClient: PoolClient | null = null;
  private isDestroyed = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private readonly channelHandlers: Map<string, Set<PubSubMessageHandler>> =
    new Map();

  constructor(private readonly db: DatabaseService) {}

  async onModuleInit() {
    await this.initListener();
  }

  onModuleDestroy() {
    this.isDestroyed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.listenerClient) {
      try {
        this.listenerClient.release(true);
      } catch {
        // safe ignore
      }
      this.listenerClient = null;
    }
  }

  /**
   * Initializes dedicated persistent client for LISTEN channels
   */
  private async initListener(): Promise<void> {
    if (this.isDestroyed) return;

    try {
      this.listenerClient = await this.db.getClient();

      this.listenerClient.on('notification', (msg) => {
        if (!msg.channel) return;
        const handlers = this.channelHandlers.get(msg.channel);
        if (handlers && handlers.size > 0) {
          const payload = msg.payload || '';
          for (const handler of handlers) {
            try {
              handler(payload);
            } catch (err: unknown) {
              this.logger.error(
                `Error in subscriber handler for channel "${msg.channel}": ${err instanceof Error ? err.message : String(err)}`,
              );
            }
          }
        }
      });

      this.listenerClient.on('error', (err) => {
        this.logger.warn(
          `PostgreSQL pub/sub client connection error: ${err.message}. Reconnecting...`,
        );
        this.handleDisconnect();
      });

      this.listenerClient.on('end', () => {
        if (!this.isDestroyed) {
          this.logger.warn('PostgreSQL pub/sub client ended. Reconnecting...');
          this.handleDisconnect();
        }
      });

      // Re-subscribe to all registered channels
      for (const channel of this.channelHandlers.keys()) {
        await this.listenerClient.query(`LISTEN ${channel}`);
      }

      this.logger.log(
        `📡 PostgreSQL LISTEN Pub/Sub initialized (${this.channelHandlers.size} channels subscribed).`,
      );
    } catch (err: unknown) {
      this.logger.warn(
        `Failed to establish PostgreSQL pub/sub listener: ${err instanceof Error ? err.message : String(err)}. Retrying in 5s...`,
      );
      this.handleDisconnect();
    }
  }

  private handleDisconnect() {
    if (this.isDestroyed || this.reconnectTimer) return;

    if (this.listenerClient) {
      try {
        this.listenerClient.release(true);
      } catch {
        // safe ignore
      }
      this.listenerClient = null;
    }

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.initListener().catch((err) => {
        this.logger.error(
          `Reconnect pub/sub failed: ${err instanceof Error ? err.message : String(err)}`,
        );
      });
    }, 5000);
  }

  /**
   * Subscribe to a PostgreSQL NOTIFY channel
   */
  async subscribe(
    channel: string,
    handler: PubSubMessageHandler,
  ): Promise<() => void> {
    let handlers = this.channelHandlers.get(channel);
    const isFirstSubscriber = !handlers || handlers.size === 0;

    if (!handlers) {
      handlers = new Set();
      this.channelHandlers.set(channel, handlers);
    }
    handlers.add(handler);

    if (isFirstSubscriber && this.listenerClient) {
      try {
        await this.listenerClient.query(`LISTEN ${channel}`);
        this.logger.log(`Subscribed to PostgreSQL channel: LISTEN ${channel}`);
      } catch (err: unknown) {
        this.logger.error(
          `Failed to LISTEN on channel "${channel}": ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    // Return un-subscribe function
    return () => {
      handlers?.delete(handler);
      if (handlers && handlers.size === 0) {
        this.channelHandlers.delete(channel);
        if (this.listenerClient) {
          this.listenerClient
            .query(`UNLISTEN ${channel}`)
            .catch(() => undefined);
        }
      }
    };
  }

  /**
   * Publish a payload to a PostgreSQL NOTIFY channel across all listening instances
   */
  async publish(channel: string, payload: unknown): Promise<void> {
    const rawString =
      typeof payload === 'string' ? payload : JSON.stringify(payload);
    // Sanitize string for SQL single-quote escaping
    const escapedPayload = rawString.replace(/'/g, "''");
    try {
      await this.db.query(`NOTIFY ${channel}, '${escapedPayload}'`);
    } catch (err: unknown) {
      this.logger.error(
        `Failed to NOTIFY channel "${channel}": ${err instanceof Error ? err.message : String(err)}`,
      );
      throw err;
    }
  }
}
