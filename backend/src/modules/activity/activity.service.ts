import { Injectable } from '@nestjs/common';
import { ActivityRepository, ActivityLogRow } from './activity.repository';

@Injectable()
export class ActivityService {
  constructor(private readonly repo: ActivityRepository) {}

  async getAllLogs(): Promise<ActivityLogRow[]> {
    return this.repo.getAllLogs();
  }

  async createLog(data: {
    taskId?: string;
    taskTitle?: string;
    agentId: string;
    agentName: string;
    actionType: string;
    summary: string;
    details?: Record<string, unknown>;
    status?: 'info' | 'success' | 'warning' | 'error';
  }): Promise<ActivityLogRow> {
    return this.repo.createLog(data);
  }
}
