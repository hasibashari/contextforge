import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
  Inject,
  forwardRef,
  Optional,
} from '@nestjs/common';
import { AutomationRepository } from './automation.repository';
import { AutomationService } from './automation.service';
import { GoalsService } from '../goals/goals.service';

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

export interface SchedulerTickResult {
  success: boolean;
  source: string;
  timestamp: string;
  evaluatedAutomationsCount: number;
  triggeredAutomations: string[];
  evaluatedGoalsCount: number;
  triggeredGoals: string[];
}

@Injectable()
export class AutomationSchedulerService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(AutomationSchedulerService.name);
  private timer: NodeJS.Timeout | null = null;
  private readonly intervalMs = 30_000; // Check every 30 seconds when running persistent
  private lastCheckedAt: string = new Date().toISOString();
  private readonly triggeredSlots: Set<string> = new Set();

  constructor(
    private readonly repo: AutomationRepository,
    @Inject(forwardRef(() => AutomationService))
    private readonly automationService: AutomationService,
    @Optional()
    @Inject(forwardRef(() => GoalsService))
    private readonly goalsService?: GoalsService,
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
      this.evaluateGoalSchedules().catch((err) => {
        this.logger.error(
          `Error evaluating goal cron schedules: ${err instanceof Error ? err.message : String(err)}`,
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
   * On-Demand Cloud Scheduler Tick (Scale-to-Zero trigger)
   * Wakes up container and evaluates both Automations and Goal Reviews synchronously.
   */
  async triggerTick(source = 'cloud-scheduler'): Promise<SchedulerTickResult> {
    this.logger.log(`⏰ Scheduler TICK triggered from source: ${source}`);
    this.lastCheckedAt = new Date().toISOString();

    const [triggeredAutomations, triggeredGoals] = await Promise.all([
      this.evaluateSchedules(),
      this.evaluateGoalSchedules(),
    ]);

    const automations = await this.repo.getAllAutomations();
    let goalsCount = 0;
    if (this.goalsService) {
      try {
        const goals = await this.goalsService.getAllGoals();
        goalsCount = goals.length;
      } catch {
        // safe ignore
      }
    }

    return {
      success: true,
      source,
      timestamp: this.lastCheckedAt,
      evaluatedAutomationsCount: automations.length,
      triggeredAutomations,
      evaluatedGoalsCount: goalsCount,
      triggeredGoals,
    };
  }

  /**
   * Main evaluation cycle for active scheduled workflows
   */
  async evaluateSchedules(): Promise<string[]> {
    this.lastCheckedAt = new Date().toISOString();
    const now = new Date();
    const triggered: string[] = [];

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
        const slotKey = `auto:${workflow.id}:${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}`;

        if (!this.triggeredSlots.has(slotKey)) {
          this.triggeredSlots.add(slotKey);
          triggered.push(workflow.name);
          this.logger.log(
            `[Cron Trigger] Schedule matched for workflow "${workflow.name}" (${cron}). Dispatching real agentic run...`,
          );

          // Trigger execution in background
          this.automationService.triggerRun(workflow.id).catch((err) => {
            this.logger.error(
              `Failed background execution of workflow "${workflow.name}": ${err instanceof Error ? err.message : String(err)}`,
            );
          });
        }
      }
    }

    return triggered;
  }

  /**
   * Evaluates active goal daily evaluations
   */
  async evaluateGoalSchedules(): Promise<string[]> {
    if (!this.goalsService) return [];

    const now = new Date();
    const triggered: string[] = [];

    try {
      const goals = await this.goalsService.getAllGoals();
      const activeGoals = goals.filter((g) => g.status === 'active');

      for (const goal of activeGoals) {
        const cron = goal.cron_evaluation?.trim() || '0 21 * * *';
        const isMatch = this.matchesCron(cron, now);

        if (isMatch) {
          const slotKey = `goal:${goal.id}:${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}`;

          if (!this.triggeredSlots.has(slotKey)) {
            this.triggeredSlots.add(slotKey);
            triggered.push(goal.title);
            this.logger.log(
              `[Goal Evaluation Trigger] Schedule matched for goal "${goal.title}" (${cron}). Running evaluation pipeline...`,
            );

            this.goalsService.runDailyGoalEvaluation(goal.id).catch((err) => {
              this.logger.error(
                `Failed daily goal evaluation for "${goal.title}": ${err instanceof Error ? err.message : String(err)}`,
              );
            });
          }
        }
      }
    } catch (err: unknown) {
      this.logger.warn(
        `Failed to evaluate goal schedules: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    return triggered;
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
          const [rStart, rEnd] = rangeStr.split('-').map(Number);
          start = !isNaN(rStart) ? rStart : min;
          end = !isNaN(rEnd) ? rEnd : max;
        } else {
          start = parseInt(rangeStr, 10);
          if (isNaN(start)) start = min;
        }
      }

      if (value < start || value > end) return false;
      return (value - start) % step === 0;
    }

    // Handle lists (e.g. 1,2,5)
    if (pattern.includes(',')) {
      return pattern
        .split(',')
        .some((sub) => this.matchesField(sub.trim(), value, min, max));
    }

    // Handle ranges (e.g. 1-5)
    if (pattern.includes('-')) {
      const [startStr, endStr] = pattern.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (isNaN(start) || isNaN(end)) return false;
      return value >= start && value <= end;
    }

    // Exact value match
    const exact = parseInt(pattern, 10);
    return !isNaN(exact) && exact === value;
  }

  /**
   * Get scheduler diagnostic status and all active cron workflows
   */
  async getSchedulerStatus(): Promise<SchedulerStatusResponse> {
    const workflows = await this.repo.getAllAutomations();
    const scheduledWorkflows = workflows.filter(
      (w) => w.trigger_type === 'schedule' && w.schedule_cron,
    );

    const jobs: SchedulerJobStatus[] = scheduledWorkflows.map((w) => ({
      id: w.id,
      name: w.name,
      cron: w.schedule_cron || '',
      scheduleLabel: w.schedule_label || w.schedule_cron || '',
      isActive: w.is_active,
      lastRunAt: w.last_run_at,
      lastRunStatus: w.last_run_status,
      totalRuns: w.total_runs,
    }));

    return {
      status: this.timer ? 'running' : 'idle',
      intervalSeconds: this.intervalMs / 1000,
      lastCheckedAt: this.lastCheckedAt,
      activeJobsCount: scheduledWorkflows.filter((w) => w.is_active).length,
      totalWorkflowsCount: workflows.length,
      jobs,
    };
  }
}
