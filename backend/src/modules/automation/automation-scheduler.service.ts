import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { AutomationRepository } from './automation.repository';
import { AutomationService } from './automation.service';

export interface SchedulerJobStatus {
  id: string;
  name: string;
  cron: string;
  scheduleLabel: string;
  isActive: boolean;
  lastRunAt?: string;
  lastRunStatus?: string;
  totalRuns: number;
}

export interface SchedulerStatusResponse {
  status: 'running' | 'paused' | 'idle';
  intervalSeconds: number;
  lastCheckedAt: string;
  activeJobsCount: number;
  totalWorkflowsCount: number;
  jobs: SchedulerJobStatus[];
}

@Injectable()
export class AutomationSchedulerService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(AutomationSchedulerService.name);
  private timer: NodeJS.Timeout | null = null;
  private readonly intervalMs = 30_000; // Check every 30 seconds
  private lastCheckedAt: string = new Date().toISOString();
  private readonly triggeredSlots: Set<string> = new Set();

  constructor(
    private readonly repo: AutomationRepository,
    @Inject(forwardRef(() => AutomationService))
    private readonly automationService: AutomationService,
  ) {}

  onModuleInit() {
    this.startScheduler();
  }

  onModuleDestroy() {
    this.stopScheduler();
  }

  private startScheduler() {
    this.logger.log(
      'Starting ContextForge Background Cron Scheduler Daemon...',
    );
    this.timer = setInterval(() => {
      this.evaluateSchedules().catch((err) => {
        this.logger.error(
          `Error evaluating background cron schedules: ${err instanceof Error ? err.message : String(err)}`,
        );
      });
    }, this.intervalMs);
  }

  private stopScheduler() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      this.logger.log('Background Cron Scheduler Daemon stopped.');
    }
  }

  /**
   * Main evaluation cycle for active scheduled workflows
   */
  async evaluateSchedules(): Promise<void> {
    this.lastCheckedAt = new Date().toISOString();
    const now = new Date();

    const workflows = await this.repo.getAllAutomations();
    const activeScheduledWorkflows = workflows.filter(
      (w) => w.is_active && w.trigger_type === 'schedule' && w.schedule_cron,
    );

    // Prune triggered slots older than 2 hours to avoid memory leak
    if (this.triggeredSlots.size > 200) {
      this.triggeredSlots.clear();
    }

    for (const workflow of activeScheduledWorkflows) {
      const cron = workflow.schedule_cron?.trim();
      if (!cron) continue;

      const isMatch = this.matchesCron(cron, now);
      if (isMatch) {
        const slotKey = `${workflow.id}:${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}`;

        if (!this.triggeredSlots.has(slotKey)) {
          this.triggeredSlots.add(slotKey);
          this.logger.log(
            `[Cron Trigger] Schedule matched for workflow "${workflow.name}" (${cron}). Dispatching real agentic run...`,
          );

          // Trigger execution asynchronously in background
          this.automationService.triggerRun(workflow.id).catch((err) => {
            this.logger.error(
              `Failed background execution of workflow "${workflow.name}": ${err instanceof Error ? err.message : String(err)}`,
            );
          });
        }
      }
    }
  }

  /**
   * Evaluates standard 5-part cron syntax: minute hour day-of-month month day-of-week
   */
  matchesCron(cronExpr: string, date: Date): boolean {
    const parts = cronExpr.trim().split(/\s+/);
    if (parts.length < 5) return false;

    const [minutePart, hourPart, domPart, monthPart, dowPart] = parts;

    const minute = date.getMinutes();
    const hour = date.getHours();
    const dom = date.getDate();
    const month = date.getMonth() + 1; // 1-12
    const dow = date.getDay(); // 0-6 (0 is Sunday)

    return (
      this.matchesField(minutePart, minute, 0, 59) &&
      this.matchesField(hourPart, hour, 0, 23) &&
      this.matchesField(domPart, dom, 1, 31) &&
      this.matchesField(monthPart, month, 1, 12) &&
      this.matchesField(dowPart, dow, 0, 6)
    );
  }

  private matchesField(
    pattern: string,
    value: number,
    min: number,
    max: number,
  ): boolean {
    if (pattern === '*' || pattern === '?') return true;

    // Handle step values (e.g. */5 or 0-30/5)
    if (pattern.includes('/')) {
      const [rangeStr, stepStr] = pattern.split('/');
      const step = parseInt(stepStr, 10);
      if (isNaN(step) || step <= 0) return false;

      let start = min;
      let end = max;
      if (rangeStr !== '*') {
        if (rangeStr.includes('-')) {
          const [s, e] = rangeStr.split('-').map((v) => parseInt(v, 10));
          start = isNaN(s) ? min : s;
          end = isNaN(e) ? max : e;
        } else {
          start = parseInt(rangeStr, 10);
          if (isNaN(start)) start = min;
        }
      }

      if (value < start || value > end) return false;
      return (value - start) % step === 0;
    }

    // Handle comma separated lists (e.g. 1,2,5)
    if (pattern.includes(',')) {
      const subPatterns = pattern.split(',');
      return subPatterns.some((sub) =>
        this.matchesField(sub.trim(), value, min, max),
      );
    }

    // Handle ranges (e.g. 1-5)
    if (pattern.includes('-')) {
      const [startStr, endStr] = pattern.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (isNaN(start) || isNaN(end)) return false;
      return value >= start && value <= end;
    }

    // Handle exact number
    const num = parseInt(pattern, 10);
    return !isNaN(num) && num === value;
  }

  /**
   * Retrieves live status of background scheduler and registered cron jobs
   */
  async getSchedulerStatus(): Promise<SchedulerStatusResponse> {
    const workflows = await this.repo.getAllAutomations();
    const activeScheduled = workflows.filter(
      (w) => w.is_active && w.trigger_type === 'schedule' && w.schedule_cron,
    );

    const jobs: SchedulerJobStatus[] = workflows.map((w) => ({
      id: w.id,
      name: w.name,
      cron: w.schedule_cron || '',
      scheduleLabel: w.schedule_label || 'Manual Trigger',
      isActive: w.is_active,
      lastRunAt: w.last_run_at,
      lastRunStatus: w.last_run_status,
      totalRuns: w.total_runs || 0,
    }));

    return {
      status: this.timer ? 'running' : 'paused',
      intervalSeconds: this.intervalMs / 1000,
      lastCheckedAt: this.lastCheckedAt,
      activeJobsCount: activeScheduled.length,
      totalWorkflowsCount: workflows.length,
      jobs,
    };
  }
}
