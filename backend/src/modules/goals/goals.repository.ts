import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';

export interface GoalRow {
  id: string;
  user_id?: string;
  title: string;
  description: string;
  category: 'productivity' | 'learning' | 'health' | 'finance' | 'custom';
  status: 'active' | 'paused' | 'completed' | 'abandoned';
  target_metrics: Record<string, any>;
  current_progress_pct: number;
  streak_days: number;
  cron_evaluation: string;
  linked_mcp_servers: string[];
  notion_parent_page_id?: string;
  notion_database_id?: string;
  created_at: string;
  updated_at: string;
}

export interface GoalTaskRow {
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
  verification_evidence: Record<string, any>;
  verification_notes?: string;
  risk_level: 'low_risk' | 'medium_risk' | 'high_risk';
  requires_user_approval: boolean;
  user_approval_status: 'none' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface GoalEvaluationRow {
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

@Injectable()
export class GoalsRepository implements OnModuleInit {
  private readonly logger = new Logger(GoalsRepository.name);

  constructor(private readonly db: DatabaseService) {}

  async onModuleInit() {
    await this.ensureTables();
  }

  async ensureTables() {
    try {
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS goals (
          id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
          user_id UUID,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          category VARCHAR(50) NOT NULL DEFAULT 'productivity' CHECK (category IN ('productivity', 'learning', 'health', 'finance', 'custom')),
          status VARCHAR(30) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'abandoned')),
          target_metrics JSONB DEFAULT '{}',
          current_progress_pct NUMERIC(5,2) DEFAULT 0.0,
          streak_days INTEGER DEFAULT 0,
          cron_evaluation VARCHAR(100) DEFAULT '0 21 * * *',
          linked_mcp_servers TEXT[] DEFAULT '{"android-bridge", "google-calendar", "notion"}',
          notion_parent_page_id VARCHAR(100),
          notion_database_id VARCHAR(100),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS goal_tasks (
          id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
          goal_id VARCHAR(100) NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          scheduled_start TIMESTAMPTZ,
          scheduled_end TIMESTAMPTZ,
          mcp_target VARCHAR(50),
          mcp_resource_id VARCHAR(255),
          status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'verified_completed', 'incomplete', 'unverified')),
          verification_evidence JSONB DEFAULT '{}',
          verification_notes TEXT,
          risk_level VARCHAR(20) DEFAULT 'low_risk' CHECK (risk_level IN ('low_risk', 'medium_risk', 'high_risk')),
          requires_user_approval BOOLEAN DEFAULT false,
          user_approval_status VARCHAR(20) DEFAULT 'none' CHECK (user_approval_status IN ('none', 'approved', 'rejected')),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS goal_evaluations (
          id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
          goal_id VARCHAR(100) NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
          evaluation_date DATE NOT NULL DEFAULT CURRENT_DATE,
          score_pct NUMERIC(5,2) NOT NULL DEFAULT 0.0,
          summary TEXT NOT NULL,
          tasks_completed INTEGER DEFAULT 0,
          tasks_incomplete INTEGER DEFAULT 0,
          tasks_unverified INTEGER DEFAULT 0,
          insights JSONB DEFAULT '[]',
          adaptations_proposed JSONB DEFAULT '[]',
          notion_page_url TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status, category);
        CREATE INDEX IF NOT EXISTS idx_goal_tasks_goal ON goal_tasks(goal_id, status);
        CREATE INDEX IF NOT EXISTS idx_goal_evaluations_goal ON goal_evaluations(goal_id, evaluation_date DESC);

        -- Auto-sync all goals into automations table for visual dashboard tracking
        INSERT INTO automations (
          id, name, description, agent_id, agent_name, mcp_server_id, mcp_tools,
          trigger_type, schedule_cron, schedule_label, prompt_template, guardrail_strict_hitl, is_active
        )
        SELECT 
          'auto-goal-' || g.id,
          'Daily Goal Evaluator: ' || g.title,
          'Automated closed-loop evaluation & Notion reflection report for goal "' || g.title || '"',
          'agent-personal-assistant',
          'Personal Assistant',
          'notion',
          ARRAY['android_get_usage_summary', 'google_calendar_list_events', 'notion_create_page', 'notion_get_tasks'],
          'schedule',
          COALESCE(g.cron_evaluation, '0 21 * * *'),
          'Every Night at 21:00 (Evaluation Closed Loop)',
          'Execute daily evaluation for Goal "' || g.title || '" (ID: ' || g.id || '). Collect telemetry from Android Bridge, compare against today''s Google Calendar, verify task completion status in Notion, compute overall compliance score, and log reflection summary to Notion.',
          false,
          true
        FROM goals g
        ON CONFLICT (id) DO NOTHING;
      `);
      this.logger.log(
        '✅ Goals, Goal Tasks, and Goal Evaluations tables verified in PostgreSQL.',
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`❌ Failed to ensure goals tables: ${msg}`);
    }
  }

  // --- Goals CRUD ---
  async getAllGoals(): Promise<GoalRow[]> {
    const res = await this.db.query<GoalRow>(
      `SELECT * FROM goals ORDER BY created_at DESC;`,
    );
    return res.rows.map((r) => this.normalizeGoal(r));
  }

  async getGoalById(id: string): Promise<GoalRow | null> {
    const res = await this.db.query<GoalRow>(
      `SELECT * FROM goals WHERE id = $1;`,
      [id],
    );
    return res.rows[0] ? this.normalizeGoal(res.rows[0]) : null;
  }

  async createGoal(data: Partial<GoalRow>): Promise<GoalRow> {
    const res = await this.db.query<GoalRow>(
      `INSERT INTO goals (
        title, description, category, status, target_metrics, 
        current_progress_pct, streak_days, cron_evaluation, linked_mcp_servers,
        notion_parent_page_id, notion_database_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *;`,
      [
        data.title,
        data.description || '',
        data.category || 'productivity',
        data.status || 'active',
        JSON.stringify(data.target_metrics || {}),
        data.current_progress_pct || 0.0,
        data.streak_days || 0,
        data.cron_evaluation || '0 21 * * *',
        data.linked_mcp_servers || [
          'android-bridge',
          'google-calendar',
          'notion',
        ],
        data.notion_parent_page_id || null,
        data.notion_database_id || null,
      ],
    );
    return this.normalizeGoal(res.rows[0]);
  }

  async updateGoal(id: string, updates: Partial<GoalRow>): Promise<GoalRow> {
    const current = await this.getGoalById(id);
    if (!current) throw new Error(`Goal with ID ${id} not found`);

    const res = await this.db.query<GoalRow>(
      `UPDATE goals SET
        title = COALESCE($2, title),
        description = COALESCE($3, description),
        category = COALESCE($4, category),
        status = COALESCE($5, status),
        target_metrics = COALESCE($6, target_metrics),
        current_progress_pct = COALESCE($7, current_progress_pct),
        streak_days = COALESCE($8, streak_days),
        cron_evaluation = COALESCE($9, cron_evaluation),
        linked_mcp_servers = COALESCE($10, linked_mcp_servers),
        notion_parent_page_id = COALESCE($11, notion_parent_page_id),
        notion_database_id = COALESCE($12, notion_database_id),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *;`,
      [
        id,
        updates.title,
        updates.description,
        updates.category,
        updates.status,
        updates.target_metrics ? JSON.stringify(updates.target_metrics) : null,
        updates.current_progress_pct,
        updates.streak_days,
        updates.cron_evaluation,
        updates.linked_mcp_servers,
        updates.notion_parent_page_id,
        updates.notion_database_id,
      ],
    );
    return this.normalizeGoal(res.rows[0]);
  }

  async deleteGoal(id: string): Promise<boolean> {
    const res = await this.db.query(`DELETE FROM goals WHERE id = $1;`, [id]);
    return (res.rowCount ?? 0) > 0;
  }

  // --- Goal Tasks CRUD ---
  async getTasksByGoalId(goalId: string): Promise<GoalTaskRow[]> {
    const res = await this.db.query<GoalTaskRow>(
      `SELECT * FROM goal_tasks WHERE goal_id = $1 ORDER BY scheduled_start ASC, created_at ASC;`,
      [goalId],
    );
    return res.rows.map((r) => this.normalizeTask(r));
  }

  async getTaskById(id: string): Promise<GoalTaskRow | null> {
    const res = await this.db.query<GoalTaskRow>(
      `SELECT * FROM goal_tasks WHERE id = $1;`,
      [id],
    );
    return res.rows[0] ? this.normalizeTask(res.rows[0]) : null;
  }

  async createTask(data: Partial<GoalTaskRow>): Promise<GoalTaskRow> {
    const res = await this.db.query<GoalTaskRow>(
      `INSERT INTO goal_tasks (
        goal_id, title, description, scheduled_start, scheduled_end,
        mcp_target, mcp_resource_id, status, verification_evidence,
        verification_notes, risk_level, requires_user_approval, user_approval_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *;`,
      [
        data.goal_id,
        data.title,
        data.description || null,
        data.scheduled_start || null,
        data.scheduled_end || null,
        data.mcp_target || null,
        data.mcp_resource_id || null,
        data.status || 'pending',
        JSON.stringify(data.verification_evidence || {}),
        data.verification_notes || null,
        data.risk_level || 'low_risk',
        data.requires_user_approval || false,
        data.user_approval_status || 'none',
      ],
    );
    return this.normalizeTask(res.rows[0]);
  }

  async updateTask(
    id: string,
    updates: Partial<GoalTaskRow>,
  ): Promise<GoalTaskRow> {
    const res = await this.db.query<GoalTaskRow>(
      `UPDATE goal_tasks SET
        title = COALESCE($2, title),
        description = COALESCE($3, description),
        scheduled_start = COALESCE($4, scheduled_start),
        scheduled_end = COALESCE($5, scheduled_end),
        mcp_target = COALESCE($6, mcp_target),
        mcp_resource_id = COALESCE($7, mcp_resource_id),
        status = COALESCE($8, status),
        verification_evidence = COALESCE($9, verification_evidence),
        verification_notes = COALESCE($10, verification_notes),
        risk_level = COALESCE($11, risk_level),
        requires_user_approval = COALESCE($12, requires_user_approval),
        user_approval_status = COALESCE($13, user_approval_status),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *;`,
      [
        id,
        updates.title,
        updates.description,
        updates.scheduled_start,
        updates.scheduled_end,
        updates.mcp_target,
        updates.mcp_resource_id,
        updates.status,
        updates.verification_evidence
          ? JSON.stringify(updates.verification_evidence)
          : null,
        updates.verification_notes,
        updates.risk_level,
        updates.requires_user_approval,
        updates.user_approval_status,
      ],
    );
    return this.normalizeTask(res.rows[0]);
  }

  async deleteTask(id: string): Promise<boolean> {
    const res = await this.db.query(`DELETE FROM goal_tasks WHERE id = $1;`, [
      id,
    ]);
    return (res.rowCount ?? 0) > 0;
  }

  // --- Goal Evaluations ---
  async getEvaluationsByGoalId(
    goalId: string,
    limit = 30,
  ): Promise<GoalEvaluationRow[]> {
    const res = await this.db.query<GoalEvaluationRow>(
      `SELECT * FROM goal_evaluations WHERE goal_id = $1 ORDER BY evaluation_date DESC, created_at DESC LIMIT $2;`,
      [goalId, limit],
    );
    return res.rows.map((r) => this.normalizeEvaluation(r));
  }

  async createEvaluation(
    data: Partial<GoalEvaluationRow>,
  ): Promise<GoalEvaluationRow> {
    const res = await this.db.query<GoalEvaluationRow>(
      `INSERT INTO goal_evaluations (
        goal_id, evaluation_date, score_pct, summary,
        tasks_completed, tasks_incomplete, tasks_unverified,
        insights, adaptations_proposed, notion_page_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;`,
      [
        data.goal_id,
        data.evaluation_date || new Date().toISOString().slice(0, 10),
        data.score_pct || 0.0,
        data.summary || '',
        data.tasks_completed || 0,
        data.tasks_incomplete || 0,
        data.tasks_unverified || 0,
        JSON.stringify(data.insights || []),
        JSON.stringify(data.adaptations_proposed || []),
        data.notion_page_url || null,
      ],
    );
    return this.normalizeEvaluation(res.rows[0]);
  }

  /* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */
  private normalizeGoal(row: any): GoalRow {
    return {
      id: String(row.id || ''),
      user_id: row.user_id ? String(row.user_id) : undefined,
      title: String(row.title || ''),
      description: String(row.description || ''),
      category: (row.category as GoalRow['category']) || 'productivity',
      status: (row.status as GoalRow['status']) || 'active',
      target_metrics:
        typeof row.target_metrics === 'string'
          ? (JSON.parse(row.target_metrics) as Record<string, unknown>)
          : (row.target_metrics as Record<string, unknown>) || {},
      current_progress_pct: Number(row.current_progress_pct || 0),
      streak_days: Number(row.streak_days || 0),
      cron_evaluation: String(row.cron_evaluation || '0 21 * * *'),
      linked_mcp_servers: Array.isArray(row.linked_mcp_servers)
        ? (row.linked_mcp_servers as string[])
        : [],
      notion_parent_page_id: row.notion_parent_page_id
        ? String(row.notion_parent_page_id)
        : undefined,
      notion_database_id: row.notion_database_id
        ? String(row.notion_database_id)
        : undefined,
      created_at: String(row.created_at || ''),
      updated_at: String(row.updated_at || ''),
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private normalizeTask(row: any): GoalTaskRow {
    return {
      id: String(row.id || ''),
      goal_id: String(row.goal_id || ''),
      title: String(row.title || ''),
      description: row.description ? String(row.description) : undefined,
      scheduled_start: row.scheduled_start
        ? String(row.scheduled_start)
        : undefined,
      scheduled_end: row.scheduled_end ? String(row.scheduled_end) : undefined,
      mcp_target: row.mcp_target ? String(row.mcp_target) : undefined,
      mcp_resource_id: row.mcp_resource_id
        ? String(row.mcp_resource_id)
        : undefined,
      status: (row.status as GoalTaskRow['status']) || 'pending',
      verification_evidence:
        typeof row.verification_evidence === 'string'
          ? (JSON.parse(row.verification_evidence) as Record<string, unknown>)
          : (row.verification_evidence as Record<string, unknown>) || {},
      verification_notes: row.verification_notes
        ? String(row.verification_notes)
        : undefined,
      risk_level: (row.risk_level as GoalTaskRow['risk_level']) || 'low_risk',
      requires_user_approval: Boolean(row.requires_user_approval),
      user_approval_status:
        (row.user_approval_status as GoalTaskRow['user_approval_status']) ||
        'none',
      created_at: String(row.created_at || ''),
      updated_at: String(row.updated_at || ''),
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private normalizeEvaluation(row: any): GoalEvaluationRow {
    return {
      id: String(row.id || ''),
      goal_id: String(row.goal_id || ''),
      evaluation_date: String(row.evaluation_date || ''),
      score_pct: Number(row.score_pct || 0),
      summary: String(row.summary || ''),
      tasks_completed: Number(row.tasks_completed || 0),
      tasks_incomplete: Number(row.tasks_incomplete || 0),
      tasks_unverified: Number(row.tasks_unverified || 0),
      insights:
        typeof row.insights === 'string'
          ? (JSON.parse(row.insights) as string[])
          : (row.insights as string[]) || [],
      adaptations_proposed:
        typeof row.adaptations_proposed === 'string'
          ? (JSON.parse(row.adaptations_proposed) as string[])
          : (row.adaptations_proposed as string[]) || [],
      notion_page_url: row.notion_page_url
        ? String(row.notion_page_url)
        : undefined,
      created_at: String(row.created_at || ''),
    };
  }
}
