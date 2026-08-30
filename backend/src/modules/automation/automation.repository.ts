import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';

export interface AutomationWorkflowRow {
  id: string;
  guest_id?: string;
  name: string;
  description: string;
  agent_id: string;
  agent_name?: string;
  mcp_server_id?: string;
  mcp_tools: string[];
  trigger_type: 'schedule' | 'event' | 'manual';
  schedule_cron?: string;
  schedule_label: string;
  event_source?: string;
  prompt_template: string;
  guardrail_strict_hitl: boolean;
  is_active: boolean;
  last_run_at?: string;
  last_run_status?: string;
  total_runs: number;
  created_at: string;
  updated_at: string;
}

export interface AutomationRunRow {
  id: string;
  workflow_id: string;
  workflow_name: string;
  agent_id: string;
  agent_name: string;
  trigger_source: string;
  status: string;
  started_at: string;
  completed_at?: string;
  duration_ms: number;
  tokens_used: Record<string, unknown>;
  steps: Record<string, unknown>[];
  output_summary: string;
  output_artifact_url?: string;
  created_at: string;
}

@Injectable()
export class AutomationRepository implements OnModuleInit {
  private readonly logger = new Logger(AutomationRepository.name);

  constructor(private readonly db: DatabaseService) {}

  async onModuleInit() {
    await this.ensureTables();
  }

  async ensureTables() {
    try {
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS automations (
          id VARCHAR(100) PRIMARY KEY,
          guest_id VARCHAR(100) DEFAULT 'default_guest',
          name VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          agent_id VARCHAR(100) NOT NULL,
          agent_name VARCHAR(150),
          mcp_server_id VARCHAR(100),
          mcp_tools TEXT[] DEFAULT '{}',
          trigger_type VARCHAR(50) NOT NULL,
          schedule_cron VARCHAR(100),
          schedule_label VARCHAR(150),
          event_source VARCHAR(100),
          prompt_template TEXT NOT NULL,
          guardrail_strict_hitl BOOLEAN DEFAULT false,
          is_active BOOLEAN DEFAULT true,
          last_run_at TIMESTAMPTZ,
          last_run_status VARCHAR(30) DEFAULT 'idle',
          total_runs INTEGER DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        ALTER TABLE automations ADD COLUMN IF NOT EXISTS guest_id VARCHAR(100) DEFAULT 'default_guest';
        CREATE INDEX IF NOT EXISTS idx_automations_guest ON automations(guest_id);

        CREATE TABLE IF NOT EXISTS automation_runs (
          id VARCHAR(100) PRIMARY KEY,
          workflow_id VARCHAR(100) REFERENCES automations(id) ON DELETE CASCADE,
          workflow_name VARCHAR(255) NOT NULL,
          agent_id VARCHAR(100) NOT NULL,
          agent_name VARCHAR(150) NOT NULL,
          trigger_source VARCHAR(150) NOT NULL,
          status VARCHAR(30) NOT NULL,
          started_at TIMESTAMPTZ DEFAULT NOW(),
          completed_at TIMESTAMPTZ,
          duration_ms INTEGER DEFAULT 0,
          tokens_used JSONB DEFAULT '{}',
          steps JSONB DEFAULT '[]',
          output_summary TEXT NOT NULL,
          output_artifact_url TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_automation_runs_workflow_time ON automation_runs(workflow_id, started_at DESC);
      `);

      this.logger.log(
        '✨ Automations & Runs tables verified in PostgreSQL (Clean Slate mode)',
      );
    } catch (err: unknown) {
      this.logger.error('Failed to initialize automations tables', err);
    }
  }

  async getAllAutomations(guestId?: string): Promise<AutomationWorkflowRow[]> {
    if (guestId) {
      const res = await this.db.query<AutomationWorkflowRow>(
        `SELECT * FROM automations WHERE guest_id = $1 ORDER BY created_at DESC;`,
        [guestId],
      );
      return res.rows;
    }
    const res = await this.db.query<AutomationWorkflowRow>(
      `SELECT * FROM automations ORDER BY created_at DESC;`,
    );
    return res.rows;
  }

  async getAutomationById(
    id: string,
    guestId?: string,
  ): Promise<AutomationWorkflowRow | null> {
    if (guestId) {
      const res = await this.db.query<AutomationWorkflowRow>(
        `SELECT * FROM automations WHERE id = $1 AND (guest_id = $2 OR guest_id = 'default_guest');`,
        [id, guestId],
      );
      return res.rows[0] || null;
    }
    const res = await this.db.query<AutomationWorkflowRow>(
      `SELECT * FROM automations WHERE id = $1;`,
      [id],
    );
    return res.rows[0] || null;
  }

  async createAutomation(
    data: Partial<AutomationWorkflowRow>,
    guestId?: string,
  ): Promise<AutomationWorkflowRow> {
    const id = data.id || `auto-${Date.now()}`;
    const effectiveGuestId = guestId || data.guest_id || 'default_guest';
    const res = await this.db.query<AutomationWorkflowRow>(
      `INSERT INTO automations (
        id, name, description, agent_id, agent_name, mcp_server_id, mcp_tools,
        trigger_type, schedule_cron, schedule_label, event_source, prompt_template,
        guardrail_strict_hitl, is_active, total_runs, guest_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *;`,
      [
        id,
        data.name,
        data.description || '',
        data.agent_id,
        data.agent_name || 'ContextForge Agent',
        data.mcp_server_id || null,
        data.mcp_tools || [],
        data.trigger_type || 'schedule',
        data.schedule_cron || null,
        data.schedule_label || 'Daily Schedule',
        data.event_source || null,
        data.prompt_template || '',
        data.guardrail_strict_hitl ?? false,
        data.is_active ?? true,
        0,
        effectiveGuestId,
      ],
    );
    return res.rows[0];
  }

  async updateAutomation(
    id: string,
    updates: Partial<AutomationWorkflowRow>,
  ): Promise<AutomationWorkflowRow> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (key !== 'id' && value !== undefined) {
        fields.push(`${key} = $${idx}`);
        values.push(value);
        idx++;
      }
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const query = `UPDATE automations SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *;`;
    const res = await this.db.query<AutomationWorkflowRow>(query, values);
    return res.rows[0];
  }

  async deleteAutomation(id: string): Promise<boolean> {
    const res = await this.db.query(`DELETE FROM automations WHERE id = $1;`, [
      id,
    ]);
    return (res.rowCount || 0) > 0;
  }

  async getAllRuns(limit = 100): Promise<AutomationRunRow[]> {
    const res = await this.db.query<AutomationRunRow>(
      `SELECT * FROM automation_runs ORDER BY started_at DESC LIMIT $1;`,
      [limit],
    );
    return res.rows;
  }

  async createRun(data: Partial<AutomationRunRow>): Promise<AutomationRunRow> {
    const id = data.id || `run-${Date.now()}`;
    const res = await this.db.query<AutomationRunRow>(
      `INSERT INTO automation_runs (
        id, workflow_id, workflow_name, agent_id, agent_name, trigger_source,
        status, started_at, completed_at, duration_ms, tokens_used, steps,
        output_summary, output_artifact_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *;`,
      [
        id,
        data.workflow_id,
        data.workflow_name,
        data.agent_id,
        data.agent_name,
        data.trigger_source,
        data.status || 'success',
        data.started_at || new Date().toISOString(),
        data.completed_at || new Date().toISOString(),
        data.duration_ms || 0,
        JSON.stringify(data.tokens_used || {}),
        JSON.stringify(data.steps || []),
        data.output_summary || 'Run completed',
        data.output_artifact_url || null,
      ],
    );
    return res.rows[0];
  }

  /**
   * Prunes older automation runs exceeding maxPerWorkflow records per workflow.
   */
  async pruneOldRuns(maxPerWorkflow = 50): Promise<number> {
    const res = await this.db.query(
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
      [maxPerWorkflow],
    );
    return res.rowCount ?? 0;
  }
}
