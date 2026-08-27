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

let cachedGoals: Goal[] | null = null;
const cachedTasksByGoalId = new Map<string, GoalTask[]>();
const cachedEvaluationsByGoalId = new Map<string, GoalEvaluation[]>();

export const goalsApi = {
  getCachedGoals(): Goal[] | null {
    return cachedGoals;
  },

  getCachedTasks(goalId: string): GoalTask[] | null {
    return cachedTasksByGoalId.get(goalId) || null;
  },

  getCachedEvaluations(goalId: string): GoalEvaluation[] | null {
    return cachedEvaluationsByGoalId.get(goalId) || null;
  },

  async fetchGoals(forceRefresh = false): Promise<Goal[]> {
    if (!forceRefresh && cachedGoals && cachedGoals.length > 0) {
      // Trigger background quiet revalidation without blocking UI
      fetch(BASE_URL)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (Array.isArray(data)) {
            cachedGoals = data;
          }
        })
        .catch(() => {});
      return cachedGoals;
    }

    const res = await fetch(BASE_URL);
    if (!res.ok) throw new Error('Failed to fetch goals');
    const data = (await res.json()) as Goal[];
    cachedGoals = data;
    return data;
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
    const created = (await res.json()) as Goal;
    if (cachedGoals) {
      cachedGoals = [created, ...cachedGoals.filter((g) => g.id !== created.id)];
    }
    return created;
  },

  async updateGoal(id: string, payload: Partial<Goal>): Promise<Goal> {
    const res = await fetch(`${BASE_URL}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update goal');
    const updated = (await res.json()) as Goal;
    if (cachedGoals) {
      cachedGoals = cachedGoals.map((g) => (g.id === id ? updated : g));
    }
    return updated;
  },

  async deleteGoal(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${BASE_URL}/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete goal');
    if (cachedGoals) {
      cachedGoals = cachedGoals.filter((g) => g.id !== id);
    }
    cachedTasksByGoalId.delete(id);
    cachedEvaluationsByGoalId.delete(id);
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
    const data = (await res.json()) as { goal: Goal; tasks: GoalTask[] };
    if (data.tasks) {
      cachedTasksByGoalId.set(id, data.tasks);
    }
    if (cachedGoals && data.goal) {
      cachedGoals = cachedGoals.map((g) => (g.id === id ? data.goal : g));
    }
    return data;
  },

  async fetchGoalTasks(goalId: string, forceRefresh = false): Promise<GoalTask[]> {
    const cached = cachedTasksByGoalId.get(goalId);
    if (!forceRefresh && cached && cached.length > 0) {
      fetch(`${BASE_URL}/${goalId}/tasks`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (Array.isArray(data)) {
            cachedTasksByGoalId.set(goalId, data);
          }
        })
        .catch(() => {});
      return cached;
    }

    const res = await fetch(`${BASE_URL}/${goalId}/tasks`);
    if (!res.ok) throw new Error('Failed to fetch goal tasks');
    const tasks = (await res.json()) as GoalTask[];
    cachedTasksByGoalId.set(goalId, tasks);
    return tasks;
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
    const created = (await res.json()) as GoalTask;
    const existing = cachedTasksByGoalId.get(goalId) || [];
    cachedTasksByGoalId.set(goalId, [created, ...existing.filter((t) => t.id !== created.id)]);
    return created;
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
    const updated = (await res.json()) as GoalTask;
    const existing = cachedTasksByGoalId.get(goalId);
    if (existing) {
      cachedTasksByGoalId.set(
        goalId,
        existing.map((t) => (t.id === taskId ? updated : t)),
      );
    }
    return updated;
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
    const data = (await res.json()) as {
      status: 'verified_completed' | 'incomplete' | 'unverified';
      evidence: Record<string, unknown>;
      notes: string;
    };
    const existing = cachedTasksByGoalId.get(goalId);
    if (existing) {
      cachedTasksByGoalId.set(
        goalId,
        existing.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status: data.status,
                verification_evidence: data.evidence,
                verification_notes: data.notes,
              }
            : t,
        ),
      );
    }
    return data;
  },

  async deleteGoalTask(
    goalId: string,
    taskId: string,
  ): Promise<{ success: boolean }> {
    const res = await fetch(`${BASE_URL}/${goalId}/tasks/${taskId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete task');
    const existing = cachedTasksByGoalId.get(goalId);
    if (existing) {
      cachedTasksByGoalId.set(
        goalId,
        existing.filter((t) => t.id !== taskId),
      );
    }
    return res.json();
  },

  async triggerGoalEvaluation(goalId: string): Promise<GoalEvaluation> {
    const res = await fetch(`${BASE_URL}/${goalId}/evaluate`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to run goal evaluation');
    const evaluation = (await res.json()) as GoalEvaluation;
    const existing = cachedEvaluationsByGoalId.get(goalId) || [];
    cachedEvaluationsByGoalId.set(goalId, [
      evaluation,
      ...existing.filter((e) => e.id !== evaluation.id),
    ]);
    return evaluation;
  },

  async fetchGoalEvaluations(goalId: string, forceRefresh = false): Promise<GoalEvaluation[]> {
    const cached = cachedEvaluationsByGoalId.get(goalId);
    if (!forceRefresh && cached && cached.length > 0) {
      fetch(`${BASE_URL}/${goalId}/evaluations`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (Array.isArray(data)) {
            cachedEvaluationsByGoalId.set(goalId, data);
          }
        })
        .catch(() => {});
      return cached;
    }

    const res = await fetch(`${BASE_URL}/${goalId}/evaluations`);
    if (!res.ok) throw new Error('Failed to fetch evaluations');
    const evaluations = (await res.json()) as GoalEvaluation[];
    cachedEvaluationsByGoalId.set(goalId, evaluations);
    return evaluations;
  },
};
