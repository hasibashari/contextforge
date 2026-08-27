import { Injectable, Logger } from '@nestjs/common';
import {
  AndroidActiveRestrictionsResponse,
  AndroidAppUsageItem,
  AndroidBlockAppResponse,
  AndroidDevicePingResponse,
  AndroidForegroundAppResponse,
  AndroidSendNotificationResponse,
  AndroidSetAppLimitResponse,
  AndroidSetDndResponse,
  AndroidUsageSummaryResponse,
} from './android-bridge.types';

@Injectable()
export class AndroidBridgeApiClient {
  private readonly logger = new Logger(AndroidBridgeApiClient.name);
  private readonly defaultTimeoutMs = 8000;

  /**
   * Universal fetch request wrapper with timeout and error handling
   */
  private async request<T>(
    endpoint: string,
    path: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
      body?: unknown;
      authToken?: string;
      timeoutMs?: number;
    } = {},
  ): Promise<T> {
    const cleanEndpoint = (endpoint || 'http://127.0.0.1:8080').replace(
      /\/+$/,
      '',
    );
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const url = `${cleanEndpoint}${cleanPath}`;
    const timeout = options.timeoutMs || this.defaultTimeoutMs;

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    if (options.authToken && options.authToken.trim()) {
      headers.Authorization = `Bearer ${options.authToken.trim()}`;
    }

    let bodyStr: string | undefined;
    if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json';
      bodyStr = JSON.stringify(options.body);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      this.logger.debug(
        `Dispatching Android Bridge HTTP request: ${options.method || 'GET'} ${url}`,
      );

      const response = await fetch(url, {
        method: options.method || 'GET',
        headers,
        body: bodyStr,
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        let errMessage = `HTTP error ${response.status} (${response.statusText})`;
        try {
          const errBody = (await response.json()) as Record<string, unknown>;
          if (errBody && typeof errBody.message === 'string') {
            errMessage = errBody.message;
          } else if (errBody && typeof errBody.error === 'string') {
            errMessage = errBody.error;
          }
        } catch {
          // ignore json parse error
        }
        throw new Error(
          `Android Bridge request failed [${response.status}]: ${errMessage}`,
        );
      }

      const data = (await response.json()) as T;
      return data;
    } catch (err: unknown) {
      clearTimeout(timer);
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error(
          `Koneksi ke Android Bridge timed out (${timeout}ms). Pastikan server Ktor aktif di port 8080 dan ADB port forward telah dijalankan (\`adb forward tcp:8080 tcp:8080\`).`,
        );
      }
      if (
        err instanceof Error &&
        (err.message.includes('ECONNREFUSED') ||
          err.message.includes('fetch failed'))
      ) {
        throw new Error(
          `Unable to connect to Android Device at ${url}. Ensure the Android MCP Bridge app is running in the foreground and port 8080 is accessible.`,
        );
      }
      throw err;
    }
  }

  /**
   * 1. Check server & device connectivity
   * GET /ping
   */
  async ping(
    endpoint: string,
    authToken?: string,
  ): Promise<{
    status: 'connected' | 'disconnected' | 'error';
    message: string;
    latencyMs: number;
    device?: string;
  }> {
    const startTime = Date.now();
    try {
      const res = await this.request<AndroidDevicePingResponse>(
        endpoint,
        '/ping',
        {
          method: 'GET',
          authToken,
          timeoutMs: 4000,
        },
      );

      const latencyMs = Math.max(5, Date.now() - startTime);
      return {
        status: res.status === 'ok' ? 'connected' : 'disconnected',
        message:
          res.message ||
          `Android Native MCP connected (${res.device || 'Android Device'})`,
        latencyMs,
        device: res.device || 'Android Native MCP',
      };
    } catch (err: unknown) {
      const latencyMs = Math.max(5, Date.now() - startTime);
      const msg = err instanceof Error ? err.message : String(err);
      return {
        status: 'disconnected',
        message: `Android Device offline: ${msg}`,
        latencyMs,
      };
    }
  }

  /**
   * 2. Get raw app usage statistics since 00:00 today
   * GET /mcp/tools/get_usage
   */
  async getUsage(
    endpoint: string,
    authToken?: string,
  ): Promise<AndroidAppUsageItem[]> {
    return this.request<AndroidAppUsageItem[]>(
      endpoint,
      '/mcp/tools/get_usage',
      {
        method: 'GET',
        authToken,
      },
    );
  }

  /**
   * 3. Get structured daily usage summary ready for AI analysis
   * GET /mcp/tools/get_usage_summary
   */
  async getUsageSummary(
    endpoint: string,
    authToken?: string,
  ): Promise<AndroidUsageSummaryResponse> {
    return this.request<AndroidUsageSummaryResponse>(
      endpoint,
      '/mcp/tools/get_usage_summary',
      {
        method: 'GET',
        authToken,
      },
    );
  }

  /**
   * 4. Detect currently active foreground application
   * GET /mcp/tools/get_foreground_app
   */
  async getForegroundApp(
    endpoint: string,
    authToken?: string,
  ): Promise<AndroidForegroundAppResponse> {
    return this.request<AndroidForegroundAppResponse>(
      endpoint,
      '/mcp/tools/get_foreground_app',
      {
        method: 'GET',
        authToken,
      },
    );
  }

  /**
   * 5. Set daily usage time limit in minutes
   * POST /mcp/tools/set_app_limit
   */
  async setAppLimit(
    endpoint: string,
    packageName: string,
    maxDailyMinutes: number,
    authToken?: string,
  ): Promise<AndroidSetAppLimitResponse> {
    return this.request<AndroidSetAppLimitResponse>(
      endpoint,
      '/mcp/tools/set_app_limit',
      {
        method: 'POST',
        body: { packageName, maxDailyMinutes },
        authToken,
      },
    );
  }

  /**
   * 6. Instantly block or unblock an application
   * POST /mcp/tools/block_app
   */
  async blockApp(
    endpoint: string,
    packageName: string,
    block: boolean,
    authToken?: string,
  ): Promise<AndroidBlockAppResponse> {
    return this.request<AndroidBlockAppResponse>(
      endpoint,
      '/mcp/tools/block_app',
      {
        method: 'POST',
        body: { packageName, block },
        authToken,
      },
    );
  }

  /**
   * 7. Retrieve configured daily time limits & blocked apps list
   * GET /mcp/tools/get_active_restrictions
   */
  async getActiveRestrictions(
    endpoint: string,
    authToken?: string,
  ): Promise<AndroidActiveRestrictionsResponse> {
    return this.request<AndroidActiveRestrictionsResponse>(
      endpoint,
      '/mcp/tools/get_active_restrictions',
      {
        method: 'GET',
        authToken,
      },
    );
  }

  /**
   * 8. Enable or disable Do Not Disturb (DND) mode
   * POST /mcp/tools/set_dnd
   */
  async setDnd(
    endpoint: string,
    enable: boolean,
    authToken?: string,
  ): Promise<AndroidSetDndResponse> {
    return this.request<AndroidSetDndResponse>(endpoint, '/mcp/tools/set_dnd', {
      method: 'POST',
      body: { enable },
      authToken,
    });
  }

  /**
   * 9. Send local push notification banner to device
   * POST /mcp/tools/send_notification
   */
  async sendNotification(
    endpoint: string,
    title: string,
    message: string,
    authToken?: string,
  ): Promise<AndroidSendNotificationResponse> {
    return this.request<AndroidSendNotificationResponse>(
      endpoint,
      '/mcp/tools/send_notification',
      {
        method: 'POST',
        body: { title, message },
        authToken,
      },
    );
  }
}
