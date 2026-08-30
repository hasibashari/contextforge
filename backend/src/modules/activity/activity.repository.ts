import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';

export interface ActivityLogRow {
  id: string;
  user_id?: string;
  timestamp: string;
  task_id?: string;
  task_title?: string;
  agent_id: string;
  agent_name: string;
  action_type: string;
  summary: string;
  details?: any;
  status: 'info' | 'success' | 'warning' | 'error';
}

@Injectable()
export class ActivityRepository implements OnModuleInit {
  private readonly logger = new Logger(ActivityRepository.name);

  constructor(private readonly db: DatabaseService) {}

  async onModuleInit() {
    await this.ensureTables();
  }

  async ensureTables() {
    try {
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS activity_logs (
          id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
          user_id UUID,
          timestamp TIMESTAMPTZ DEFAULT NOW(),
          task_id VARCHAR(100),
          task_title VARCHAR(255),
          agent_id VARCHAR(100) NOT NULL,
          agent_name VARCHAR(150) NOT NULL,
          action_type VARCHAR(50) NOT NULL,
          summary TEXT NOT NULL,
          details JSONB,
          status VARCHAR(20) DEFAULT 'info'
        );
        CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs (timestamp DESC);
      `);

      this.logger.log('✨ Activity logs table verified in PostgreSQL');
    } catch (err: unknown) {
      this.logger.error('Failed to initialize activity logs table', err);
    }
  }

  async getAllLogs(limit = 100): Promise<ActivityLogRow[]> {
    const res = await this.db.query<ActivityLogRow>(
      `SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT $1;`,
      [limit],
    );
    return res.rows;
  }

  async createLog(data: {
    taskId?: string;
    taskTitle?: string;
    agentId: string;
    agentName: string;
    actionType: string;
    summary: string;
    details?: any;
    status?: 'info' | 'success' | 'warning' | 'error';
  }): Promise<ActivityLogRow> {
    const res = await this.db.query<ActivityLogRow>(
      `INSERT INTO activity_logs (task_id, task_title, agent_id, agent_name, action_type, summary, details, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *;`,
      [
        data.taskId || null,
        data.taskTitle || null,
        data.agentId,
        data.agentName,
        data.actionType,
        data.summary,
        data.details ? JSON.stringify(data.details) : null,
        data.status || 'info',
      ],
    );
    return res.rows[0];
  }

  /**
   * Prunes activity logs older than specified retention days
   */
  async pruneOldLogs(retentionDays = 30): Promise<number> {
    const res = await this.db.query(
      `DELETE FROM activity_logs 
       WHERE timestamp < NOW() - ($1 || ' days')::INTERVAL;`,
      [retentionDays],
    );
    return res.rowCount ?? 0;
  }
}
