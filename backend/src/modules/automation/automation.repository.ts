import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';

export interface AutomationWorkflowRow {
  id: string;
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

        -- Normalize legacy agent IDs
        UPDATE automations SET agent_id = 'agent-conversational' WHERE agent_id IN ('agent-action-worker', 'agent-action');
        UPDATE automations SET agent_id = 'agent-research' WHERE agent_id = 'agent-researcher';
        UPDATE automations SET mcp_tools = ARRAY['obsidian_read_note', 'obsidian_write_note']
        WHERE mcp_tools = ARRAY['obsidian_vault_reader', 'obsidian_vault_writer']
           OR mcp_tools = ARRAY['obsidian_read_vault', 'obsidian_write_note'];
      `);

      // Seed standard presets if table is empty
      const countRes = await this.db.query<{ count: string }>(
        `SELECT COUNT(*) FROM automations;`,
      );
      if (parseInt(countRes.rows[0]?.count || '0', 10) === 0) {
        await this.seedPresets();
      }

      this.logger.log('✨ Automations & Runs tables verified in PostgreSQL');
    } catch (err: unknown) {
      this.logger.error('Failed to initialize automations tables', err);
    }
  }

  private async seedPresets() {
    const presets: Partial<AutomationWorkflowRow>[] = [
      {
        id: 'auto-obsidian-daily-briefing',
        name: 'Daily Morning Obsidian Briefing & Journaling',
        description:
          'Automatically summarizes open action items and generates an atomic Markdown daily note directly in the local Obsidian Vault.',
        agent_id: 'agent-conversational',
        agent_name: 'Personal Assistant Agent',
        mcp_server_id: 'int-obsidian-vault-mcp',
        mcp_tools: [
          'obsidian_create_daily_note',
          'obsidian_write_note',
          'obsidian_read_note',
        ],
        trigger_type: 'schedule',
        schedule_cron: '0 8 * * *',
        schedule_label: 'Every day at 08:00 AM (WIB)',
        prompt_template:
          "Pull today's urgent priorities and construct a structured daily note in Obsidian at DailyNotes/{{today}}.md with YAML frontmatter, today's focus, and bi-directional links [[Daily Review]].",
        guardrail_strict_hitl: false,
        is_active: true,
      },
      {
        id: 'auto-notion-daily-tasks',
        name: 'Daily Notion Tasks Triage & Focus Briefing',
        description:
          'Queries the Notion Task Database every morning, filters active/high-priority tasks, and prepares a clear executive focus briefing.',
        agent_id: 'agent-conversational',
        agent_name: 'Personal Assistant Agent',
        mcp_server_id: 'int-notion-mcp',
        mcp_tools: ['notion_get_tasks', 'notion_read_page', 'notion_search'],
        trigger_type: 'schedule',
        schedule_cron: '0 8 * * *',
        schedule_label: 'Every day at 08:00 AM',
        prompt_template:
          "Query Notion task board via MCP for active tasks. Categorize items by priority (High, Medium, Low) and output an executive summary of today's deliverables.",
        guardrail_strict_hitl: false,
        is_active: true,
      },
      {
        id: 'auto-obsidian-knowledge-weaver',
        name: 'Obsidian Vault Knowledge Graph & Backlink Weaver',
        description:
          'Periodically scans notes in the Obsidian Inbox directory, generates semantic embeddings, and appends bi-directional backlinks to related concept notes.',
        agent_id: 'agent-research',
        agent_name: 'Research Specialist Agent',
        mcp_server_id: 'int-obsidian-vault-mcp',
        mcp_tools: ['obsidian_read_note', 'obsidian_write_note'],
        trigger_type: 'schedule',
        schedule_cron: '0 */6 * * *',
        schedule_label: 'Every 6 hours',
        prompt_template:
          "Scan Obsidian notes in folder 'Inbox/' created within the last 24 hours. Analyze key concepts, find related documents in the knowledge base, and insert a '## Related Concept Links' section containing bi-directional wikilinks [[Topic]] and tags.",
        guardrail_strict_hitl: false,
        is_active: true,
      },
      {
        id: 'auto-notion-obsidian-sync',
        name: 'Notion Tasks to Obsidian Vault Weekly Sync',
        description:
          'Cross-syncs completed Notion tasks into the local Obsidian Vault archives every Friday evening for offline permanent documentation.',
        agent_id: 'agent-conversational',
        agent_name: 'Personal Assistant Agent',
        mcp_server_id: 'int-obsidian-vault-mcp',
        mcp_tools: [
          'notion_get_tasks',
          'obsidian_write_note',
          'obsidian_create_daily_note',
        ],
        trigger_type: 'schedule',
        schedule_cron: '0 17 * * 5',
        schedule_label: 'Every Friday at 05:00 PM (WIB)',
        prompt_template:
          "Fetch all tasks completed this week from Notion MCP, format them into a markdown archive page, and write the file into Obsidian at 'Archives/Sprints/Weekly-Summary-{{today}}.md'.",
        guardrail_strict_hitl: false,
        is_active: true,
      },
    ];

    for (const preset of presets) {
      await this.createAutomation(preset);
    }
    this.logger.log(`🌱 Seeded ${presets.length} preset automations`);
  }

  async getAllAutomations(): Promise<AutomationWorkflowRow[]> {
    const res = await this.db.query<AutomationWorkflowRow>(
      `SELECT * FROM automations ORDER BY created_at DESC;`,
    );
    return res.rows;
  }

  async getAutomationById(id: string): Promise<AutomationWorkflowRow | null> {
    const res = await this.db.query<AutomationWorkflowRow>(
      `SELECT * FROM automations WHERE id = $1;`,
      [id],
    );
    return res.rows[0] || null;
  }

  async createAutomation(
    data: Partial<AutomationWorkflowRow>,
  ): Promise<AutomationWorkflowRow> {
    const id = data.id || `auto-${Date.now()}`;
    const res = await this.db.query<AutomationWorkflowRow>(
      `INSERT INTO automations (
        id, name, description, agent_id, agent_name, mcp_server_id, mcp_tools,
        trigger_type, schedule_cron, schedule_label, event_source, prompt_template,
        guardrail_strict_hitl, is_active, total_runs
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
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
}
