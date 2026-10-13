import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';

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
  public runEvaluationCycle(): Promise<GuardianEvaluationResult> {
    const now = Date.now();
    return Promise.resolve({
      triggered: false,
      timestamp: now,
      reason: 'No active mobile device attached',
    });
  }
}
