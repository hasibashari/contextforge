import { Injectable } from '@nestjs/common';
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
export class ActivityRepository {
  constructor(private readonly db: DatabaseService) {}

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
}
