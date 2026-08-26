export interface Goal {
  id: string;
  user_id?: string;
  title: string;
  description: string;
  category: 'productivity' | 'learning' | 'health' | 'finance' | 'custom';
  status: 'active' | 'paused' | 'completed' | 'abandoned';
  target_metrics: Record<string, unknown>;
  current_progress_pct: number;
  streak_days: number;
  cron_evaluation: string;
  linked_mcp_servers: string[];
  notion_parent_page_id?: string;
  notion_database_id?: string;
  created_at: string;
  updated_at: string;
}

export interface GoalTask {
  id: string;
  goal_id: string;
  title: string;
  description?: string;
  scheduled_start?: string;
  scheduled_end?: string;
  mcp_target?: string;
  mcp_resource_id?: string;
  status:
    | 'pending'
    | 'in_progress'
    | 'verified_completed'
    | 'incomplete'
    | 'unverified';
  verification_evidence: Record<string, unknown>;
  verification_notes?: string;
  risk_level: 'low_risk' | 'medium_risk' | 'high_risk';
  requires_user_approval: boolean;
  user_approval_status: 'none' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface GoalEvaluation {
  id: string;
  goal_id: string;
  evaluation_date: string;
  score_pct: number;
  summary: string;
  tasks_completed: number;
  tasks_incomplete: number;
  tasks_unverified: number;
  insights: string[];
  adaptations_proposed: string[];
  notion_page_url?: string;
  created_at: string;
}

export interface CreateGoalPayload {
  title: string;
  description?: string;
  category?: 'productivity' | 'learning' | 'health' | 'finance' | 'custom';
  targetMetrics?: Record<string, unknown>;
  cronEvaluation?: string;
  linkedMcpServers?: string[];
  notionParentPageId?: string;
  notionDatabaseId?: string;
  initialTasks?: Array<{
    title: string;
    description?: string;
    scheduledStart?: string;
    scheduledEnd?: string;
    mcpTarget?: string;
    riskLevel?: 'low_risk' | 'medium_risk' | 'high_risk';
  }>;
}

const BASE_URL = '/api/goals';

export const goalsApi = {
  async fetchGoals(): Promise<Goal[]> {
    const res = await fetch(BASE_URL);
    if (!res.ok) throw new Error('Failed to fetch goals');
    return res.json();
  },

  async fetchGoalById(id: string): Promise<Goal> {
    const res = await fetch(`${BASE_URL}/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch goal ${id}`);
    return res.json();
  },

  async createGoal(payload: CreateGoalPayload): Promise<Goal> {
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to create goal');
    return res.json();
  },

  async updateGoal(id: string, payload: Partial<Goal>): Promise<Goal> {
    const res = await fetch(`${BASE_URL}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update goal');
    return res.json();
  },

  async deleteGoal(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${BASE_URL}/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete goal');
    return res.json();
  },

  async decomposeGoal(
    id: string,
    additionalContext?: string,
  ): Promise<{ goal: Goal; tasks: GoalTask[] }> {
    const res = await fetch(`${BASE_URL}/${id}/decompose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ additionalContext }),
    });
    if (!res.ok) throw new Error('Failed to decompose goal with AI');
    return res.json();
  },

  async fetchGoalTasks(goalId: string): Promise<GoalTask[]> {
    const res = await fetch(`${BASE_URL}/${goalId}/tasks`);
    if (!res.ok) throw new Error('Failed to fetch goal tasks');
    return res.json();
  },

  async createGoalTask(
    goalId: string,
    task: Partial<GoalTask>,
  ): Promise<GoalTask> {
    const res = await fetch(`${BASE_URL}/${goalId}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    });
    if (!res.ok) throw new Error('Failed to create task');
    return res.json();
  },

  async updateGoalTaskStatus(
    goalId: string,
    taskId: string,
    payload: {
      status: GoalTask['status'];
      verificationEvidence?: Record<string, unknown>;
      verificationNotes?: string;
      userApprovalStatus?: 'none' | 'approved' | 'rejected';
    },
  ): Promise<GoalTask> {
    const res = await fetch(`${BASE_URL}/${goalId}/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update task status');
    return res.json();
  },

  async verifyGoalTask(
    goalId: string,
    taskId: string,
  ): Promise<{
    status: 'verified_completed' | 'incomplete' | 'unverified';
    evidence: Record<string, unknown>;
    notes: string;
  }> {
    const res = await fetch(`${BASE_URL}/${goalId}/tasks/${taskId}/verify`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to verify task with MCP');
    return res.json();
  },

  async deleteGoalTask(
    goalId: string,
    taskId: string,
  ): Promise<{ success: boolean }> {
    const res = await fetch(`${BASE_URL}/${goalId}/tasks/${taskId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete task');
    return res.json();
  },

  async triggerGoalEvaluation(goalId: string): Promise<GoalEvaluation> {
    const res = await fetch(`${BASE_URL}/${goalId}/evaluate`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to run goal evaluation');
    return res.json();
  },

  async fetchGoalEvaluations(goalId: string): Promise<GoalEvaluation[]> {
    const res = await fetch(`${BASE_URL}/${goalId}/evaluations`);
    if (!res.ok) throw new Error('Failed to fetch evaluations');
    return res.json();
  },
};
