import { Injectable } from '@nestjs/common';
import {
  BaseMcpConnector,
  McpToolCallResult,
  McpToolDefinition,
  McpTransportType,
} from '../../core';
import { AndroidBridgeApiClient } from './android-bridge-api.client';
import { AndroidBridgeGatewayService } from './android-bridge.gateway';
import { ANDROID_BRIDGE_MCP_TOOLS } from './android-bridge-tools.definition';
import {
  formatDurationMs,
  formatRawUsageList,
  formatRestrictionsReport,
  formatUsageSummaryReport,
  getFriendlyAppName,
  validatePackageName,
} from './android-bridge-parser.engine';
import {
  AndroidActiveRestrictionsResponse,
  AndroidAppUsageItem,
  AndroidBridgeConfig,
  AndroidForegroundAppResponse,
  AndroidUsageSummaryResponse,
} from './android-bridge.types';

@Injectable()
export class AndroidBridgeMcpConnector extends BaseMcpConnector {
  readonly id = 'int-android-bridge-mcp';
  readonly name = 'Android Bridge & Digital Wellbeing MCP';
  readonly category = 'productivity';
  readonly transportType: McpTransportType = 'streamable_http';
  readonly isInternal = false;

  private endpoint = 'http://127.0.0.1:8080';
  private deviceName = 'Android Native MCP Device';

  constructor(
    private readonly apiClient: AndroidBridgeApiClient,
    private readonly gateway: AndroidBridgeGatewayService,
  ) {
    super(AndroidBridgeMcpConnector.name);
  }

  /**
   * Sets or updates endpoint and authentication configuration
   */
  public configure(config: Partial<AndroidBridgeConfig>): void {
    if (config.endpoint) {
      this.endpoint = config.endpoint.trim().replace(/\/+$/, '');
    }
    if (config.authToken !== undefined) {
      this.setAuthToken(config.authToken);
    } else if (config.apiKey !== undefined) {
      this.setAuthToken(config.apiKey);
    }
    if (config.deviceName) {
      this.deviceName = config.deviceName;
    }
  }

  public getEndpoint(): string {
    return this.endpoint;
  }

  getTools(): McpToolDefinition[] {
    return ANDROID_BRIDGE_MCP_TOOLS;
  }

  hasTool(toolName: string): boolean {
    return toolName.startsWith('android_');
  }

  /**
   * Connected if either WebSocket client is active or endpoint is defined
   */
  override isConnected(): boolean {
    return (
      this.gateway.isBridgeConnected() ||
      Boolean(this.endpoint && this.endpoint.length > 0)
    );
  }

  /**
   * Execute MCP Tools on Android Device (via WebSocket or HTTP fallback)
   */
  async executeTool(
    toolName: string,
    params: Record<string, unknown>,
  ): Promise<McpToolCallResult> {
    return this.safeExecute(toolName, async () => {
      const isWs = this.gateway.isBridgeConnected();

      switch (toolName) {
        // 1. DEVICE DIAGNOSTICS & PING
        case 'android_get_device_status': {
          if (isWs) {
            const devInfo = this.gateway.getDeviceInfo();
            return {
              data: {
                endpoint: 'WebSocket (/api/android-bridge/ws)',
                status: 'connected',
                latencyMs: 2,
                device: devInfo.deviceName,
                androidVersion: devInfo.androidVersion || '14',
                batteryLevel: devInfo.batteryLevel ?? 100,
                transport: 'websocket',
              },
              summary: `📱 Android WebSocket Bridge aktif & terhubung (${devInfo.deviceName}, Android ${devInfo.androidVersion || 'Native'}, Baterai: ${devInfo.batteryLevel ?? 100}%).`,
            };
          }

          const probe = await this.apiClient.ping(
            this.endpoint,
            this.authToken,
          );
          return {
            data: {
              endpoint: this.endpoint,
              status: probe.status,
              latencyMs: probe.latencyMs,
              device: probe.device || this.deviceName,
              message: probe.message,
            },
            summary:
              probe.status === 'connected'
                ? `📱 Android Bridge terhubung pada ${this.endpoint} (${probe.latencyMs}ms latency) - Device: ${probe.device || 'Android Native MCP'}.`
                : `⚠️ Android Bridge tidak merespons pada ${this.endpoint}: ${probe.message}`,
          };
        }

        // 2. GET RAW USAGE STATS
        case 'android_get_usage': {
          let usageList: AndroidAppUsageItem[];
          if (isWs) {
            usageList = await this.gateway.dispatchBridgeRequest<
              AndroidAppUsageItem[]
            >('get_usage', params);
          } else {
            usageList = await this.apiClient.getUsage(
              this.endpoint,
              this.authToken,
            );
          }

          const formattedText = formatRawUsageList(usageList);

          return {
            data: {
              totalApps: usageList.length,
              apps: usageList.map((item) => ({
                ...item,
                formattedDuration: formatDurationMs(
                  item.totalTimeInForegroundMs,
                ),
              })),
            },
            summary: formattedText,
          };
        }

        // 3. GET DIGITAL WELLBEING USAGE SUMMARY
        case 'android_get_usage_summary': {
          let summary: AndroidUsageSummaryResponse;
          if (isWs) {
            summary =
              await this.gateway.dispatchBridgeRequest<AndroidUsageSummaryResponse>(
                'get_usage_summary',
                params,
              );
          } else {
            summary = await this.apiClient.getUsageSummary(
              this.endpoint,
              this.authToken,
            );
          }

          const formattedReport = formatUsageSummaryReport(summary);

          return {
            data: {
              date: summary.date,
              totalScreenTimeMs: summary.totalScreenTimeMs,
              formattedTotalScreenTime: formatDurationMs(
                summary.totalScreenTimeMs,
              ),
              mostUsedApp: summary.mostUsedApp,
              mostUsedAppName: summary.mostUsedApp
                ? getFriendlyAppName(summary.mostUsedApp)
                : undefined,
              appsCount: summary.apps?.length || 0,
              apps: (summary.apps || []).map((app) => ({
                ...app,
                formattedDuration: formatDurationMs(
                  app.totalTimeInForegroundMs,
                ),
              })),
            },
            summary: formattedReport,
          };
        }

        // 4. GET CURRENT FOREGROUND APPLICATION
        case 'android_get_foreground_app': {
          let appPkg = 'Unknown / Home Screen';
          let friendlyName = 'Home Screen';

          if (isWs) {
            const res =
              await this.gateway.dispatchBridgeRequest<AndroidForegroundAppResponse>(
                'get_foreground_app',
                params,
              );
            appPkg = res.currentForegroundApp || 'Unknown / Home Screen';
            friendlyName = res.friendlyName || getFriendlyAppName(appPkg);
          } else {
            const res = await this.apiClient.getForegroundApp(
              this.endpoint,
              this.authToken,
            );
            appPkg = res.currentForegroundApp || 'Unknown / Home Screen';
            friendlyName = getFriendlyAppName(appPkg);
          }

          return {
            data: {
              currentForegroundApp: appPkg,
              friendlyName,
            },
            summary: `📱 Aplikasi aktif di layar Android saat ini: **${friendlyName}** (\`${appPkg}\`).`,
          };
        }

        // 5. SET DAILY APP USAGE LIMIT
        case 'android_set_app_limit': {
          const packageName = (params.packageName as string)?.trim();
          const maxDailyMinutes =
            typeof params.maxDailyMinutes === 'number'
              ? params.maxDailyMinutes
              : typeof params.maxDailyMinutes === 'string'
                ? parseInt(params.maxDailyMinutes, 10)
                : NaN;

          if (!packageName) {
            throw new Error('Parameter "packageName" wajib diisi.');
          }
          if (isNaN(maxDailyMinutes) || maxDailyMinutes <= 0) {
            throw new Error(
              'Parameter "maxDailyMinutes" wajib berupa angka lebih dari 0.',
            );
          }

          validatePackageName(packageName);
          const friendlyName = getFriendlyAppName(packageName);

          let res: { status?: string; message?: string };
          if (isWs) {
            res = await this.gateway.dispatchBridgeRequest<{
              status?: string;
              message?: string;
            }>('set_app_limit', { packageName, maxDailyMinutes });
          } else {
            res = await this.apiClient.setAppLimit(
              this.endpoint,
              packageName,
              maxDailyMinutes,
              this.authToken,
            );
          }

          return {
            data: {
              packageName,
              friendlyName,
              maxDailyMinutes,
              status: res.status || 'success',
              message: res.message,
            },
            summary: `⏳ Berhasil menetapkan batas waktu penggunaan **${maxDailyMinutes} menit/hari** untuk aplikasi **${friendlyName}** (\`${packageName}\`).`,
          };
        }

        // 6. BLOCK / UNBLOCK APP
        case 'android_block_app': {
          const packageName = (params.packageName as string)?.trim();
          const block =
            params.block !== undefined ? Boolean(params.block) : true;

          if (!packageName) {
            throw new Error('Parameter "packageName" wajib diisi.');
          }

          validatePackageName(packageName);
          const friendlyName = getFriendlyAppName(packageName);

          let res: { status?: string; message?: string };
          if (isWs) {
            res = await this.gateway.dispatchBridgeRequest<{
              status?: string;
              message?: string;
            }>('block_app', { packageName, block });
          } else {
            res = await this.apiClient.blockApp(
              this.endpoint,
              packageName,
              block,
              this.authToken,
            );
          }

          return {
            data: {
              packageName,
              friendlyName,
              blocked: block,
              status: res.status || 'success',
              message: res.message,
            },
            summary: block
              ? `🛑 Aplikasi **${friendlyName}** (\`${packageName}\`) berhasil **diblokir** di perangkat Android.`
              : `✅ Blokir untuk aplikasi **${friendlyName}** (\`${packageName}\`) berhasil **dibuka**.`,
          };
        }

        // 7. GET ACTIVE RESTRICTIONS
        case 'android_get_active_restrictions': {
          let restrictions: AndroidActiveRestrictionsResponse;
          if (isWs) {
            restrictions =
              await this.gateway.dispatchBridgeRequest<AndroidActiveRestrictionsResponse>(
                'get_active_restrictions',
                params,
              );
          } else {
            restrictions = await this.apiClient.getActiveRestrictions(
              this.endpoint,
              this.authToken,
            );
          }

          const report = formatRestrictionsReport(restrictions);

          return {
            data: restrictions as unknown as Record<string, unknown>,
            summary: report,
          };
        }

        // 8. SET DO NOT DISTURB (DND)
        case 'android_set_dnd': {
          const enable =
            params.enable !== undefined ? Boolean(params.enable) : true;

          let res: { status?: string };
          if (isWs) {
            res = await this.gateway.dispatchBridgeRequest<{
              status?: string;
            }>('set_dnd', { enable });
          } else {
            res = await this.apiClient.setDnd(
              this.endpoint,
              enable,
              this.authToken,
            );
          }

          return {
            data: {
              dndEnabled: enable,
              status: res.status || 'success',
            },
            summary: enable
              ? `🔕 Mode **Do Not Disturb (DND)** berhasil **diaktifkan** pada perangkat Android untuk sesi fokus.`
              : `🔔 Mode **Do Not Disturb (DND)** berhasil **dinonaktifkan**. Notifikasi kembali normal.`,
          };
        }

        // 9. SEND PUSH NOTIFICATION
        case 'android_send_notification': {
          const title = ((params.title as string) || 'ContextForge AI').trim();
          const message = (
            (params.message as string) ||
            (params.text as string) ||
            ''
          ).trim();

          if (!message) {
            throw new Error(
              'Parameter "message" tidak boleh kosong saat mengirim notifikasi.',
            );
          }

          let res: { status?: string };
          if (isWs) {
            res = await this.gateway.dispatchBridgeRequest<{
              status?: string;
            }>('send_notification', { title, message });
          } else {
            res = await this.apiClient.sendNotification(
              this.endpoint,
              title,
              message,
              this.authToken,
            );
          }

          return {
            data: {
              title,
              message,
              status: res.status || 'success',
            },
            summary: `📬 Notifikasi lokal berhasil dikirim ke perangkat Android:\n**${title}**: ${message}`,
          };
        }

        default:
          throw new Error(
            `Tool "${toolName}" tidak didukung oleh Android MCP Bridge.`,
          );
      }
    });
  }

  /**
   * Health Ping probe to Android server
   */
  override async ping(): Promise<{
    status: 'connected' | 'disconnected' | 'error';
    message?: string;
    latencyMs: number;
  }> {
    if (this.gateway.isBridgeConnected()) {
      const devInfo = this.gateway.getDeviceInfo();
      return {
        status: 'connected',
        message: `📱 Connected via WebSocket (${devInfo.deviceName})`,
        latencyMs: 2,
      };
    }

    const probe = await this.apiClient.ping(this.endpoint, this.authToken);
    return {
      status: probe.status,
      message: probe.message,
      latencyMs: probe.latencyMs,
    };
  }
}
