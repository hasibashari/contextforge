import { Injectable, Logger, Optional } from '@nestjs/common';
import { DatabaseService } from '../../../../common/database/database.service';
import { PostgresPubSubService } from '../../../../common/database/postgres-pubsub.service';
import { AndroidBridgeRequestMessage } from '../android-bridge.types';

interface PendingRpcRequest {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
  timer: NodeJS.Timeout;
  action: string;
}

export interface DistributedBridgeRequestPayload {
  requestId: string;
  deviceId: string;
  action: string;
  payload: Record<string, unknown>;
  originatingInstance: string;
}

export interface DistributedBridgeResponsePayload {
  requestId: string;
  success: boolean;
  data?: unknown;
  error?: string;
}

@Injectable()
export class AndroidRpcDispatcherService {
  private readonly logger = new Logger(AndroidRpcDispatcherService.name);
  private readonly pendingRequests: Map<string, PendingRpcRequest> = new Map();

  constructor(
    @Optional() private readonly db?: DatabaseService,
    @Optional() private readonly pubSub?: PostgresPubSubService,
  ) {}

  /**
   * Dispatches a tool request locally or via PostgreSQL PubSub and awaits resolution
   */
  async dispatchRequest<T = unknown>(
    action: string,
    payload: Record<string, unknown>,
    timeoutMs: number,
    deviceId: string,
    instanceId: string,
    sendLocalFn: (msg: AndroidBridgeRequestMessage) => boolean,
    isLocalConnected: boolean,
  ): Promise<T> {
    const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    // 1. Record task in PostgreSQL for idempotency
    if (this.db) {
      try {
        await this.db.query(
          `INSERT INTO android_bridge_tasks (id, device_id, action, payload, status, created_at)
           VALUES ($1, $2, $3, $4, 'pending', NOW())`,
          [requestId, deviceId, action, JSON.stringify(payload)],
        );
      } catch (err: unknown) {
        this.logger.warn(
          `Failed to record task in DB: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(requestId);

        if (this.db) {
          this.db
            .query(
              `UPDATE android_bridge_tasks 
               SET status = 'timeout', error_message = $1, completed_at = NOW() 
               WHERE id = $2`,
              [`Request timed out after ${timeoutMs}ms`, requestId],
            )
            .catch(() => undefined);
        }

        this.logger.error(
          `⏱️ [Bridge RPC] Timeout for "${action}" | id=${requestId} | timeout=${timeoutMs}ms`,
        );
        reject(
          new Error(
            `Timeout: Android device request for "${action}" exceeded ${timeoutMs}ms without response. Ensure companion app is awake.`,
          ),
        );
      }, timeoutMs);

      this.pendingRequests.set(requestId, {
        resolve: (val: unknown) => resolve(val as T),
        reject,
        timer,
        action,
      });

      const requestMessage: AndroidBridgeRequestMessage = {
        id: requestId,
        type: 'mcp_bridge_request',
        action,
        payload,
        timestamp: Date.now(),
      };

      if (isLocalConnected) {
        sendLocalFn(requestMessage);
        this.logger.log(
          `📤 [Bridge RPC] Dispatched directly to local socket: "${action}" (id: ${requestId})`,
        );
      } else if (this.pubSub) {
        const distributedReq: DistributedBridgeRequestPayload = {
          requestId,
          deviceId,
          action,
          payload,
          originatingInstance: instanceId,
        };
        this.pubSub
          .publish('android_bridge_req', distributedReq)
          .then(() => {
            this.logger.log(
              `📡 [Bridge RPC] Broadcasted to PostgreSQL channel: "${action}" (id: ${requestId})`,
            );
          })
          .catch((err) => {
            clearTimeout(timer);
            this.pendingRequests.delete(requestId);
            reject(
              new Error(
                `Failed to broadcast bridge request via PostgreSQL: ${err instanceof Error ? err.message : String(err)}`,
              ),
            );
          });
      } else {
        clearTimeout(timer);
        this.pendingRequests.delete(requestId);
        reject(
          new Error(
            `Android device is not connected via WebSocket and no distributed pub/sub is available.`,
          ),
        );
      }
    });
  }

  /**
   * Resolves a local or distributed response for an in-flight RPC request
   */
  handleResponse(
    reqId: string,
    responseData: unknown,
    errorMessage?: string,
    hasExplicitError = false,
  ): void {
    // 1. Update task row in database
    if (this.db) {
      this.db
        .query(
          `UPDATE android_bridge_tasks 
           SET status = $1, response_data = $2, error_message = $3, completed_at = NOW() 
           WHERE id = $4`,
          [
            hasExplicitError ? 'failed' : 'completed',
            responseData ? JSON.stringify(responseData) : null,
            errorMessage || null,
            reqId,
          ],
        )
        .catch(() => undefined);
    }

    // 2. Resolve local pending request if initiated on this instance
    const pending = this.pendingRequests.get(reqId);
    if (pending) {
      clearTimeout(pending.timer);
      this.pendingRequests.delete(reqId);

      if (hasExplicitError) {
        pending.reject(
          new Error(
            errorMessage || `Bridge RPC error for action ${pending.action}`,
          ),
        );
      } else {
        pending.resolve(responseData);
      }
    }

    // 3. Broadcast response to other Cloud Run instances via PubSub
    if (this.pubSub) {
      const distributedRes: DistributedBridgeResponsePayload = {
        requestId: reqId,
        success: !hasExplicitError,
        data: responseData,
        error: errorMessage,
      };
      this.pubSub
        .publish('android_bridge_res', distributedRes)
        .catch(() => undefined);
    }
  }

  /**
   * Resolves a distributed response received from another Cloud Run instance
   */
  handleDistributedResponse(raw: string): void {
    try {
      const parsed = JSON.parse(raw) as DistributedBridgeResponsePayload;
      if (!parsed.requestId) return;

      const pending = this.pendingRequests.get(parsed.requestId);
      if (pending) {
        clearTimeout(pending.timer);
        this.pendingRequests.delete(parsed.requestId);

        if (!parsed.success) {
          pending.reject(
            new Error(
              parsed.error || `Bridge RPC error for action ${pending.action}`,
            ),
          );
        } else {
          pending.resolve(parsed.data);
        }
      }
    } catch (err: unknown) {
      this.logger.warn(
        `Failed to parse distributed bridge response: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  /**
   * Clean up all pending requests on shutdown
   */
  cleanup(): void {
    for (const pending of this.pendingRequests.values()) {
      clearTimeout(pending.timer);
      pending.reject(new Error('Android Bridge Gateway is shutting down.'));
    }
    this.pendingRequests.clear();
  }
}
