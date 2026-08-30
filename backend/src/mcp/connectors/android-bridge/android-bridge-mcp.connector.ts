import { Injectable, Optional } from '@nestjs/common';
import {
  BaseMcpConnector,
  McpToolCallResult,
  McpToolDefinition,
  McpTransportType,
} from '../../core';
import { AndroidBridgeGatewayService } from './android-bridge.gateway';
import { ANDROID_BRIDGE_MCP_TOOLS } from './android-bridge-tools.definition';
import {
  formatBedtimeConfig,
  formatDurationMs,
  formatRawUsageList,
  formatRestrictionsReport,
  formatScreenTimeStatus,
  formatUsageSummaryReport,
  getFriendlyAppName,
  validatePackageName,
  validateTimeFormat,
} from './android-bridge-parser.engine';
import {
  AndroidActiveRestrictionsResponse,
  AndroidAppUsageItem,
  AndroidBedtimeConfigResponse,
  AndroidBlockAppResponse,
  AndroidBridgeConfig,
  AndroidForegroundAppResponse,
  AndroidResetAllRestrictionsResponse,
  AndroidScreenTimeStatusResponse,
  AndroidSendAgentMessageResponse,
  AndroidSendNotificationResponse,
  AndroidSetAppLimitResponse,
  AndroidSetBedtimeScheduleResponse,
  AndroidSetDndResponse,
  AndroidSetTotalScreenTimeLimitResponse,
  AndroidTriggerBedtimeLockResponse,
  AndroidUnblockAppResponse,
  AndroidUsageSummaryResponse,
} from './android-bridge.types';

@Injectable()
export class AndroidBridgeMcpConnector extends BaseMcpConnector {
  readonly id = 'int-android-bridge-mcp';
  readonly name = 'Android Bridge & Digital Wellbeing MCP';
  readonly category = 'productivity';
  readonly transportType: McpTransportType = 'websocket';
  readonly isInternal = false;

  private endpoint = '';
  private deviceName = 'Android Mobile Device';

  constructor(
    @Optional()
    private readonly gateway?: AndroidBridgeGatewayService,
  ) {
    super(AndroidBridgeMcpConnector.name);
  }

  /**
   * Sets or updates endpoint and authentication configuration
   */
  public configure(config: Partial<AndroidBridgeConfig>): void {
    if (config.endpoint !== undefined) {
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
   * Connected purely based on active WebSocket client status
   */
  override isConnected(): boolean {
    return this.gateway?.isBridgeConnected() ?? false;
  }

  /**
   * Execute MCP Tools on Android Device via WebSocket RPC
   */
  async executeTool(
    toolName: string,
    params: Record<string, unknown>,
  ): Promise<McpToolCallResult> {
    return this.safeExecute(toolName, async () => {
      const isConnected = this.gateway?.isBridgeConnected() ?? false;

      // 1. DEVICE DIAGNOSTICS & PING (Always returns state even when disconnected)
      if (toolName === 'android_get_device_status') {
        if (isConnected && this.gateway) {
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

        return {
          data: {
            endpoint: 'WebSocket (/api/android-bridge/ws)',
            status: 'disconnected',
            latencyMs: 0,
            device: this.deviceName,
            message:
              'Android device is not connected. Scan QR code or connect via WebSocket.',
            transport: 'websocket',
          },
          summary:
            '⚠️ Android Bridge is disconnected. Please open the ContextForge Bridge app on your phone to connect.',
        };
      }

      // Guard: All other tools require an active WebSocket connection
      if (!isConnected || !this.gateway) {
        throw new Error(
          'Android device is currently disconnected. Please open the ContextForge Bridge app on your phone to connect.',
        );
      }

      switch (toolName) {
        // 2. GET RAW USAGE STATS
        case 'android_get_usage': {
          const usageParams = params as { days?: number; date?: string };
          const usageList = await this.gateway.dispatchBridgeRequest<
            AndroidAppUsageItem[]
          >('get_usage', params);

          const formattedText = formatRawUsageList(usageList);

          return {
            data: {
              daysRequested: usageParams?.days || 1,
              referenceDate: usageParams?.date,
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
          const summaryParams = params as { days?: number; date?: string };
          const summary =
            await this.gateway.dispatchBridgeRequest<AndroidUsageSummaryResponse>(
              'get_usage_summary',
              params,
            );

          const formattedReport = formatUsageSummaryReport(summary);

          return {
            data: {
              date: summary.date,
              daysCount: summary.daysCount || summaryParams?.days || 1,
              totalScreenTimeMs: summary.totalScreenTimeMs,
              formattedTotalScreenTime: formatDurationMs(
                summary.totalScreenTimeMs,
              ),
              averageDailyScreenTimeMs: summary.averageDailyScreenTimeMs,
              formattedAverageDailyScreenTime: summary.averageDailyScreenTimeMs
                ? formatDurationMs(summary.averageDailyScreenTimeMs)
                : undefined,
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
              dailyBreakdown: summary.dailyBreakdown?.map((day) => ({
                ...day,
                formattedTotalScreenTime: formatDurationMs(
                  day.totalScreenTimeMs,
                ),
                apps: (day.apps || []).map((a) => ({
                  ...a,
                  formattedDuration: formatDurationMs(
                    a.totalTimeInForegroundMs,
                  ),
                })),
              })),
            },
            summary: formattedReport,
          };
        }

        // 4. GET CURRENT FOREGROUND APPLICATION
        case 'android_get_foreground_app': {
          const res =
            await this.gateway.dispatchBridgeRequest<AndroidForegroundAppResponse>(
              'get_foreground_app',
              params,
            );
          const appPkg = res.currentForegroundApp || 'Unknown / Home Screen';
          const friendlyName = res.friendlyName || getFriendlyAppName(appPkg);

          return {
            data: {
              currentForegroundApp: appPkg,
              friendlyName,
            },
            summary: `📱 Currently in foreground on screen: **${friendlyName}** (\`${appPkg}\`).`,
          };
        }

        // 5. SET APPLICATION TIME LIMIT
        case 'android_set_app_limit': {
          const packageName = params.packageName as string;
          const maxDailyMinutes = Number(params.maxDailyMinutes);

          validatePackageName(packageName);
          if (
            isNaN(maxDailyMinutes) ||
            maxDailyMinutes < 0 ||
            maxDailyMinutes > 1440
          ) {
            throw new Error(
              'maxDailyMinutes must be a valid number between 0 and 1440 minutes.',
            );
          }

          const friendlyName = getFriendlyAppName(packageName);
          const res =
            await this.gateway.dispatchBridgeRequest<AndroidSetAppLimitResponse>(
              'set_app_limit',
              { packageName, maxDailyMinutes },
            );

          return {
            data: {
              packageName,
              friendlyName,
              maxDailyMinutes,
              status: res.status,
              message: res.message,
            },
            summary: `⏱️ Daily screen time limit of **${maxDailyMinutes} minutes** applied for **${friendlyName}** (\`${packageName}\`).`,
          };
        }

        // 6. BLOCK APPLICATION
        case 'android_block_app': {
          const packageName = params.packageName as string;
          const block = typeof params.block === 'boolean' ? params.block : true;

          validatePackageName(packageName);
          const friendlyName = getFriendlyAppName(packageName);

          const res =
            await this.gateway.dispatchBridgeRequest<AndroidBlockAppResponse>(
              'block_app',
              { packageName, block },
            );

          const actionLabel = block ? 'BLOCKED 🚫' : 'UNBLOCKED 🟢';
          return {
            data: {
              packageName,
              friendlyName,
              isBlocked: block,
              status: res.status,
              message: res.message,
            },
            summary: `📱 Application **${friendlyName}** (\`${packageName}\`) has been **${actionLabel}** on mobile device.`,
          };
        }

        // 7. GET ACTIVE RESTRICTIONS
        case 'android_get_active_restrictions': {
          const res =
            await this.gateway.dispatchBridgeRequest<AndroidActiveRestrictionsResponse>(
              'get_active_restrictions',
              {},
            );

          const formattedReport = formatRestrictionsReport(res);

          return {
            data: {
              totalLimits: res.limits?.length || 0,
              totalBlocked: res.blockedApps?.length || 0,
              limits: res.limits || [],
              blockedApps: res.blockedApps || [],
            },
            summary: formattedReport,
          };
        }

        // 8. SET DO NOT DISTURB (DND)
        case 'android_set_dnd': {
          const enable =
            typeof params.enable === 'boolean' ? params.enable : true;

          const res =
            await this.gateway.dispatchBridgeRequest<AndroidSetDndResponse>(
              'set_dnd',
              { enable },
            );

          return {
            data: {
              dndEnabled: enable,
              status: res.status,
              message: res.message,
            },
            summary: enable
              ? '🔕 **Do Not Disturb (DND)** mode has been **ENABLED** on the mobile device.'
              : '🔔 **Do Not Disturb (DND)** mode has been **DISABLED**.',
          };
        }

        // 9. SEND PUSH NOTIFICATION
        case 'android_send_notification': {
          const title = (params.title as string) || 'ContextForge Agent';
          const message = (params.message as string) || '';

          if (!message || message.trim() === '') {
            throw new Error('Notification message cannot be empty.');
          }

          const res =
            await this.gateway.dispatchBridgeRequest<AndroidSendNotificationResponse>(
              'send_notification',
              { title: title.trim(), message: message.trim() },
            );

          return {
            data: {
              title: title.trim(),
              message: message.trim(),
              status: res.status,
            },
            summary: `📬 Notification sent to device: **"${title.trim()}"** - *${message.trim()}*.`,
          };
        }

        // 10. UNBLOCK APPLICATION
        case 'android_unblock_app': {
          const packageName = params.packageName as string;
          validatePackageName(packageName);
          const friendlyName = getFriendlyAppName(packageName);

          let res: AndroidUnblockAppResponse;
          try {
            res =
              await this.gateway.dispatchBridgeRequest<AndroidUnblockAppResponse>(
                'unblock_app',
                { packageName },
              );
          } catch {
            const fallbackRes =
              await this.gateway.dispatchBridgeRequest<AndroidBlockAppResponse>(
                'block_app',
                { packageName, block: false },
              );
            res = {
              status: fallbackRes.status,
              message: fallbackRes.message,
            };
          }

          return {
            data: {
              packageName,
              friendlyName,
              isBlocked: false,
              status: res.status,
              message: res.message,
            },
            summary: `🟢 Application **${friendlyName}** (\`${packageName}\`) has been **UNBLOCKED** on the mobile device.`,
          };
        }

        // 11. RESET ALL RESTRICTIONS
        case 'android_reset_all_restrictions': {
          const res =
            await this.gateway.dispatchBridgeRequest<AndroidResetAllRestrictionsResponse>(
              'reset_all_restrictions',
              {},
            );

          return {
            data: {
              status: res.status,
              message: res.message,
            },
            summary: `🔄 **All restrictions reset**: All application daily limits, blocklists, and bedtime curfews have been cleared on the mobile device.`,
          };
        }

        // 12. GET COMPREHENSIVE SCREEN TIME STATUS
        case 'android_get_screen_time_status': {
          const res =
            await this.gateway.dispatchBridgeRequest<AndroidScreenTimeStatusResponse>(
              'get_screen_time_status',
              {},
            );

          const formattedReport = formatScreenTimeStatus(res);

          return {
            data: {
              totalScreenTimeMs: res.totalScreenTimeMs,
              formattedTotalScreenTime: res.formattedTotalScreenTime,
              dailyLimitMs: res.dailyLimitMs,
              formattedDailyLimit: res.formattedDailyLimit,
              isLimitExceeded: res.isLimitExceeded,
              bedtimeCurfewActive: res.bedtimeCurfewActive,
              bedtimeSchedule: res.bedtimeSchedule,
              activeRestrictionsCount: res.activeRestrictionsCount,
            },
            summary: formattedReport,
          };
        }

        // 13. SET BEDTIME SCHEDULE
        case 'android_set_bedtime_schedule': {
          const startTime = params.startTime as string;
          const endTime = params.endTime as string;
          const enabled =
            typeof params.enabled === 'boolean' ? params.enabled : true;

          validateTimeFormat(startTime, 'startTime');
          validateTimeFormat(endTime, 'endTime');

          const res =
            await this.gateway.dispatchBridgeRequest<AndroidSetBedtimeScheduleResponse>(
              'set_bedtime_schedule',
              { startTime, endTime, enabled },
            );

          return {
            data: {
              startTime,
              endTime,
              enabled,
              status: res.status,
              message: res.message,
            },
            summary: enabled
              ? `🌙 **Bedtime Schedule Enabled**: Curfew active from **${startTime}** to **${endTime}**.`
              : `☀️ **Bedtime Schedule Disabled**: Device curfew is turned off.`,
          };
        }

        // 14. SET TOTAL DAILY SCREEN TIME LIMIT
        case 'android_set_total_screen_time_limit': {
          const maxDailyMinutes = Number(params.maxDailyMinutes);

          if (
            isNaN(maxDailyMinutes) ||
            maxDailyMinutes < 0 ||
            maxDailyMinutes > 1440
          ) {
            throw new Error(
              'maxDailyMinutes must be a valid number between 0 and 1440 minutes.',
            );
          }

          const res =
            await this.gateway.dispatchBridgeRequest<AndroidSetTotalScreenTimeLimitResponse>(
              'set_total_screen_time_limit',
              { maxDailyMinutes },
            );

          return {
            data: {
              maxDailyMinutes,
              formattedLimit:
                maxDailyMinutes === 0
                  ? 'Unlimited'
                  : formatDurationMs(maxDailyMinutes * 60000),
              status: res.status,
              message: res.message,
            },
            summary:
              maxDailyMinutes === 0
                ? '⏱️ **Total Daily Screen Time Limit Removed** (Unlimited).'
                : `⏱️ **Total Daily Screen Time Limit Set**: **${maxDailyMinutes} minutes** (${formatDurationMs(maxDailyMinutes * 60000)}) per day.`,
          };
        }

        // 15. GET BEDTIME & LIMIT CONFIGURATION
        case 'android_get_bedtime_config': {
          const res =
            await this.gateway.dispatchBridgeRequest<AndroidBedtimeConfigResponse>(
              'get_bedtime_config',
              {},
            );

          const formattedReport = formatBedtimeConfig(res);

          return {
            data: {
              bedtimeSchedule: res.bedtimeSchedule,
              totalDailyLimitMinutes: res.totalDailyLimitMinutes,
              formattedDailyLimit: res.formattedDailyLimit,
            },
            summary: formattedReport,
          };
        }

        // 16. TRIGGER INSTANT BEDTIME LOCK
        case 'android_trigger_bedtime_lock': {
          const message =
            typeof params.message === 'string' && params.message.trim()
              ? params.message.trim()
              : 'Waktu tidur telah tiba. Istirahatkan mata dan pikiran Anda untuk pemulihan optimal.';

          const res =
            await this.gateway.dispatchBridgeRequest<AndroidTriggerBedtimeLockResponse>(
              'trigger_bedtime_lock',
              { message },
            );

          return {
            data: {
              lockTriggered: true,
              message,
              status: res.status,
            },
            summary: `🔒 **Instant Bedtime Lock Activated**: Layar HP dikunci dengan pesan: *"${message}"*.`,
          };
        }

        // 17. SEND AGENT MESSAGE / COACHING MODAL
        case 'android_send_agent_message': {
          const style = (params.style as string) || 'heads_up';
          if (style !== 'heads_up' && style !== 'companion_modal') {
            throw new Error(
              `Invalid style "${style}". Expected "heads_up" or "companion_modal".`,
            );
          }
          const title = (params.title as string) || 'ContextForge Agent';
          const message = (params.message as string) || '';
          const allowExtension =
            typeof params.allowExtension === 'boolean'
              ? params.allowExtension
              : true;
          const extensionMinutes =
            typeof params.extensionMinutes === 'number'
              ? params.extensionMinutes
              : 1;

          if (!message || message.trim() === '') {
            throw new Error('Agent message content cannot be empty.');
          }

          const res =
            await this.gateway.dispatchBridgeRequest<AndroidSendAgentMessageResponse>(
              'send_agent_message',
              {
                style,
                title: title.trim(),
                message: message.trim(),
                allowExtension,
                extensionMinutes,
              },
            );

          const styleLabel =
            style === 'companion_modal'
              ? 'Full-screen Companion Coaching Modal'
              : 'Heads-up Banner Nudge';

          return {
            data: {
              style,
              title: title.trim(),
              message: message.trim(),
              allowExtension,
              extensionMinutes,
              status: res.status,
              userAction: res.userAction,
            },
            summary: `💬 **AI Agent Message Dispatched** (${styleLabel}): **"${title.trim()}"** - *${message.trim()}*.`,
          };
        }

        default:
          throw new Error(
            `Unknown or unsupported Android Bridge tool: "${toolName}".`,
          );
      }
    });
  }
}
