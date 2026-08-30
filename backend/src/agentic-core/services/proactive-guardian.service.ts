import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
  Optional,
} from '@nestjs/common';
import { AndroidBridgeGatewayService } from '../../mcp/connectors/android-bridge/android-bridge.gateway';
import { AndroidBridgeMcpConnector } from '../../mcp/connectors/android-bridge/android-bridge-mcp.connector';

export interface GuardianEvaluationResult {
  triggered: boolean;
  reason?: string;
  actionTaken?: string;
  timestamp: number;
}

@Injectable()
export class ProactiveGuardianService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ProactiveGuardianService.name);
  private checkTimer: NodeJS.Timeout | null = null;

  // Evaluation interval: 1 minute
  private readonly EVALUATION_INTERVAL_MS = 60 * 1000;

  // Anti-spam cooldown: 2 hours between proactive nudges
  private lastNudgeTimestamp = 0;
  private readonly NUDGE_COOLDOWN_MS = 2 * 60 * 60 * 1000;

  constructor(
    @Optional()
    private readonly androidGateway?: AndroidBridgeGatewayService,
    @Optional()
    private readonly androidConnector?: AndroidBridgeMcpConnector,
  ) {}

  onModuleInit() {
    this.logger.log('🛡️ Proactive Guardian Background Daemon initialized.');
    this.startDaemon();
  }

  onModuleDestroy() {
    this.stopDaemon();
  }

  private startDaemon(): void {
    if (this.checkTimer) return;

    this.checkTimer = setInterval(() => {
      void this.runEvaluationCycle();
    }, this.EVALUATION_INTERVAL_MS);

    if (typeof this.checkTimer.unref === 'function') {
      this.checkTimer.unref();
    }
  }

  private stopDaemon(): void {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }
  }

  /**
   * Evaluates active connected device telemetry and decides whether to dispatch autonomous nudges
   */
  public async runEvaluationCycle(): Promise<GuardianEvaluationResult> {
    const now = Date.now();

    // 1. Guard: Check if Android Bridge is connected
    if (!this.androidGateway?.isBridgeConnected() || !this.androidConnector) {
      return { triggered: false, timestamp: now, reason: 'Device offline' };
    }

    // 2. Guard: Respect anti-spam cooldown window
    if (now - this.lastNudgeTimestamp < this.NUDGE_COOLDOWN_MS) {
      return {
        triggered: false,
        timestamp: now,
        reason: 'Within cooldown window',
      };
    }

    try {
      // 3. Inspect live device status & foreground app
      const fgRes = await this.androidConnector.executeTool(
        'android_get_foreground_app',
        {},
      );
      const fgData = fgRes.data as { currentForegroundApp?: string };
      const currentApp = fgData?.currentForegroundApp || '';

      const isDoomscrollApp =
        currentApp.includes('instagram') ||
        currentApp.includes('tiktok') ||
        currentApp.includes('youtube') ||
        currentApp.includes('twitter') ||
        currentApp.includes('x.com');

      const currentHour = new Date().getHours();
      const isLateNight = currentHour >= 23 || currentHour < 5;

      // Scenario A: Late-night usage of entertainment apps
      if (isLateNight && isDoomscrollApp) {
        this.logger.log(
          `🌙 [Proactive Guardian] Late-night entertainment app detected: "${currentApp}". Triggering compassionate nudge...`,
        );

        await this.androidConnector.executeTool('android_send_agent_message', {
          style: 'heads_up',
          title: 'Waktunya Istirahat 🌙',
          message:
            'Sudah larut malam. Istirahatkan mata dan pikiran Anda agar besok kembali bertenaga!',
          allowExtension: true,
          extensionMinutes: 5,
        });

        this.lastNudgeTimestamp = now;
        return {
          triggered: true,
          reason: 'Late-night doomscrolling detected',
          actionTaken: 'heads_up_nudge_dispatched',
          timestamp: now,
        };
      }

      return {
        triggered: false,
        timestamp: now,
        reason: 'Normal usage within baseline',
      };
    } catch (err: unknown) {
      this.logger.warn(`Error in proactive evaluation cycle: ${String(err)}`);
      return {
        triggered: false,
        timestamp: now,
        reason: `Evaluation error: ${String(err)}`,
      };
    }
  }
}
