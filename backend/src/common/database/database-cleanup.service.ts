import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { DatabaseService } from './database.service';

export interface CleanupReport {
  activityLogsPruned: number;
  automationRunsPruned: number;
  orphanedChunksPruned: number;
  durationMs: number;
}

@Injectable()
export class DatabaseCleanupService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseCleanupService.name);
  private timer?: NodeJS.Timeout;
  private isCleaning = false;

  // Cleanup runs once every 24 hours
  private readonly CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000;

  constructor(private readonly db: DatabaseService) {}

  onModuleInit() {
    // Schedule initial cleanup run 15 seconds after app startup
    setTimeout(() => {
      this.runCleanupCycle().catch((err) =>
        this.logger.error('Initial DB cleanup cycle failed', err),
      );
    }, 15000);

    // Setup periodic 24-hour cleanup timer
    this.timer = setInterval(() => {
      this.runCleanupCycle().catch((err) =>
        this.logger.error('Periodic DB cleanup cycle failed', err),
      );
    }, this.CLEANUP_INTERVAL_MS);
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  /**
   * Executes a complete database cleanup and retention cycle
   */
  async runCleanupCycle(
    activityRetentionDays = 30,
    maxAutomationRunsPerWorkflow = 50,
  ): Promise<CleanupReport> {
    if (this.isCleaning) {
      this.logger.warn('Cleanup cycle already in progress, skipping.');
      return {
        activityLogsPruned: 0,
        automationRunsPruned: 0,
        orphanedChunksPruned: 0,
        durationMs: 0,
      };
    }

    this.isCleaning = true;
    const start = Date.now();
    this.logger.log(
      '🧹 [DB Cleanup] Starting database retention housekeeping...',
    );

    let activityLogsPruned = 0;
    let automationRunsPruned = 0;
    let orphanedChunksPruned = 0;

    try {
      // 1. Prune old activity logs (default: 30 days)
      const actRes = await this.db.query(
        `DELETE FROM activity_logs 
         WHERE timestamp < NOW() - ($1 || ' days')::INTERVAL;`,
        [activityRetentionDays],
      );
      activityLogsPruned = actRes.rowCount ?? 0;

      // 2. Prune old automation runs (keep top N per workflow)
      const autoRes = await this.db.query(
        `WITH ranked_runs AS (
          SELECT id, ROW_NUMBER() OVER (
            PARTITION BY workflow_id 
            ORDER BY started_at DESC
          ) AS rn
          FROM automation_runs
        )
        DELETE FROM automation_runs
        WHERE id IN (
          SELECT id FROM ranked_runs WHERE rn > $1
        );`,
        [maxAutomationRunsPerWorkflow],
      );
      automationRunsPruned = autoRes.rowCount ?? 0;

      // 3. Prune orphaned knowledge chunks if parent source was removed
      const chunkRes = await this.db.query(
        `DELETE FROM knowledge_chunks 
         WHERE source_id NOT IN (SELECT id FROM knowledge_sources);`,
      );
      orphanedChunksPruned = chunkRes.rowCount ?? 0;

      const durationMs = Date.now() - start;
      this.logger.log(
        `✨ [DB Cleanup] Housekeeping complete in ${durationMs}ms: pruned ${activityLogsPruned} activity logs, ${automationRunsPruned} automation runs, ${orphanedChunksPruned} orphaned chunks.`,
      );

      return {
        activityLogsPruned,
        automationRunsPruned,
        orphanedChunksPruned,
        durationMs,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to complete DB cleanup cycle: ${msg}`);
      throw err;
    } finally {
      this.isCleaning = false;
    }
  }
}
