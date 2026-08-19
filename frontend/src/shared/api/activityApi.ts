import { API_BASE_URL, handleApiResponse } from './config';
import type { ActivityLogEntry } from '@/shared/types/workspace';

export interface BackendActivityLog {
  id: string;
  task_id?: string;
  task_title?: string;
  agent_id: string;
  agent_name: string;
  action_type: string;
  summary: string;
  details?: Record<string, unknown>;
  status: 'info' | 'success' | 'warning' | 'error';
  created_at: string;
}

export const activityApi = {
  async getLogs(): Promise<ActivityLogEntry[]> {
    const res = await fetch(`${API_BASE_URL}/activity/logs`);
    const data = await handleApiResponse<BackendActivityLog[]>(res);
    return data.map((l) => ({
      id: l.id,
      taskId: l.task_id,
      taskTitle: l.task_title,
      agentId: l.agent_id,
      agentName: l.agent_name,
      actionType: l.action_type as ActivityLogEntry['actionType'],
      summary: l.summary,
      details: l.details,
      status: l.status,
      timestamp: new Date(l.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }));
  },
};
