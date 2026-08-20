import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';

export interface WorkspaceAgentRow {
  id: string;
  name: string;
  role: string;
  agent_type: 'orchestrator' | 'execution_worker' | 'planner';
  permissions: 'read_only' | 'sandbox_write' | 'full_system';
  description: string;
  avatar_color: string;
  model: string;
  temperature: number;
  system_prompt: string;
  capabilities: any[];
  assigned_tools: string[];
  assigned_skills: string[];
  status: 'idle' | 'busy' | 'waiting_approval' | 'offline';
  total_tasks_completed: number;
  success_rate_pct: number;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceSkillRow {
  id: string;
  name: string;
  description: string;
  category: 'engineering' | 'security' | 'knowledge' | 'productivity';
  icon: string;
  sop_summary: string;
  instructions: string;
  assigned_tools: string[];
  enabled: boolean;
  is_custom: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceIntegrationRow {
  id: string;
  connection_id?: string;
  name: string;
  category: 'engineering' | 'security' | 'knowledge' | 'productivity';
  status: 'connected' | 'disconnected' | 'error';
  endpoint: string;
  version: string;
  transport: 'stdio' | 'sse' | 'rest';
  description: string;
  tools: any[];
  last_ping_ms: number;
  latency_ms: number;
  is_custom: boolean;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class EcosystemRepository implements OnModuleInit {
  private readonly logger = new Logger(EcosystemRepository.name);

  constructor(private readonly db: DatabaseService) {}

  async onModuleInit() {
    await this.ensureTablesAndSeed();
  }

  async ensureTablesAndSeed() {
    try {
      // 1. Create tables
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS workspace_agents (
          id VARCHAR(100) PRIMARY KEY,
          name VARCHAR(150) NOT NULL,
          role VARCHAR(150) NOT NULL,
          agent_type VARCHAR(50) NOT NULL,
          permissions VARCHAR(50) NOT NULL,
          description TEXT NOT NULL,
          avatar_color VARCHAR(50) DEFAULT 'bg-primary',
          model VARCHAR(100) DEFAULT 'gemini-3.6-flash',
          temperature NUMERIC(3,2) DEFAULT 0.2,
          system_prompt TEXT NOT NULL,
          capabilities JSONB DEFAULT '[]',
          assigned_tools TEXT[] DEFAULT '{}',
          assigned_skills TEXT[] DEFAULT '{}',
          status VARCHAR(30) DEFAULT 'idle',
          total_tasks_completed INTEGER DEFAULT 0,
          success_rate_pct NUMERIC(5,2) DEFAULT 100.0,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      await this.db.query(`
        CREATE TABLE IF NOT EXISTS workspace_skills (
          id VARCHAR(100) PRIMARY KEY,
          name VARCHAR(150) NOT NULL,
          description TEXT NOT NULL,
          category VARCHAR(50) NOT NULL,
          icon VARCHAR(50) DEFAULT 'sparkles',
          sop_summary TEXT NOT NULL,
          instructions TEXT NOT NULL,
          assigned_tools TEXT[] DEFAULT '{}',
          enabled BOOLEAN DEFAULT true,
          is_custom BOOLEAN DEFAULT false,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      await this.db.query(`
        CREATE TABLE IF NOT EXISTS workspace_integrations (
          id VARCHAR(100) PRIMARY KEY,
          connection_id VARCHAR(100),
          name VARCHAR(150) NOT NULL,
          category VARCHAR(50) NOT NULL,
          status VARCHAR(30) DEFAULT 'connected',
          endpoint TEXT NOT NULL,
          version VARCHAR(50) DEFAULT 'v1.0.0',
          transport VARCHAR(20) DEFAULT 'stdio',
          description TEXT NOT NULL,
          tools JSONB DEFAULT '[]',
          last_ping_ms INTEGER DEFAULT 12,
          latency_ms INTEGER DEFAULT 12,
          is_custom BOOLEAN DEFAULT false,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      // 2. Seed Default Agents
      await this.db.query(`
        INSERT INTO workspace_agents (id, name, role, agent_type, permissions, description, avatar_color, model, temperature, system_prompt, capabilities, assigned_tools, assigned_skills, status, total_tasks_completed, success_rate_pct)
        VALUES
          ('agent-sec-docs', 'ContextForge Core Orchestrator', 'Main Reasoning & Analysis Agent', 'orchestrator', 'read_only', 'Primary conversational brain for Q&A, live web research, memory retrieval, and formulating execution plans for Side Agents.', 'bg-primary', 'gemini-3.6-flash', 0.2, 'You are ContextForge Core Orchestrator. You handle general reasoning, conversational discussion, live web search, and analysis.', '[{"id":"c1","name":"Conversational Reasoning","description":"Deep reasoning, Q&A, and technical architecture analysis"},{"id":"c2","name":"Live Web Grounding","description":"Query web search engines and synthesize cited answers"},{"id":"c3","name":"Side Agent Delegation","description":"Formulate structured task specs and dispatch execution sandboxes"}]'::jsonb, ARRAY['web_search', 'read_file', 'query_memory', 'search_vault', 'dispatch_side_agent'], ARRAY['skill-rfc-architect', 'skill-deep-web-research'], 'idle', 128, 99.4),
          ('agent-doc-crawl', 'Obsidian Vault Worker', 'Side Agent: Vault & Document Writer', 'execution_worker', 'sandbox_write', 'Ephemeral execution worker that writes structured Markdown notes, updates frontmatter, and syncs Obsidian vaults.', 'bg-[#9fbbe0]', 'gemini-3.6-flash', 0.2, 'You are Obsidian Vault Worker Side Agent. Execute file creation and note formatting in local Obsidian vaults.', '[{"id":"c4","name":"Obsidian Vault Writing","description":"Create and update Markdown notes with frontmatter in Obsidian"},{"id":"c5","name":"Note Formatting","description":"Apply consistent markdown templates, tags, and bi-directional links"}]'::jsonb, ARRAY['obsidian_vault_writer', 'obsidian_vault_reader'], ARRAY['skill-obsidian-vault-synthesis'], 'idle', 58, 99.2),
          ('agent-code-reviewer', 'CLI & Code Sandbox Runner', 'Side Agent: Terminal & File Execution', 'execution_worker', 'full_system', 'Sandboxed execution worker that creates files, edits codebases, executes bash commands, and runs test suites.', 'bg-[#c0a8dd]', 'gemini-3.6-flash', 0.1, 'You are Code Sandbox Side Agent. Execute file mutations, run CLI commands, verify AST syntax, and return execution summaries.', '[{"id":"c8","name":"File Creation & Editing","description":"Write source code files and generate atomic git diffs"},{"id":"c9","name":"Bash Command Execution","description":"Run test suites, linting, and build commands in sandbox"},{"id":"c10","name":"AST Syntax Checking","description":"Parse and validate code syntax before committing changes"}]'::jsonb, ARRAY['code_editor', 'bash_executor', 'code_ast_checker', 'git_diff_generator'], ARRAY['skill-ast-code-patcher'], 'idle', 92, 98.7),
          ('agent-workflow-planner', 'Calendar & Workflow Scheduler', 'Side Agent: Agenda & Schedule Mutator', 'execution_worker', 'sandbox_write', 'Ephemeral execution worker that inspects user schedule, books calendar events, and updates meeting agendas.', 'bg-[#9fc9a2]', 'gemini-3.6-flash', 0.2, 'You are Calendar & Workflow Scheduler Side Agent. Create, update, and manage Google Calendar events and task timelines.', '[{"id":"c11","name":"Calendar Scheduling","description":"Insert, reschedule, and update calendar agenda items"},{"id":"c12","name":"Meeting Agenda Preparation","description":"Draft briefing notes and attendees lists for upcoming meetings"}]'::jsonb, ARRAY['calendar_event_creator', 'calendar_event_updater', 'calendar_schedule_reader'], ARRAY['skill-calendar-workflow-sync'], 'idle', 41, 100.0),
          ('agent-visual-artist', 'Visual Diagram & Asset Generator', 'Side Agent: Diagram & Media Creator', 'execution_worker', 'sandbox_write', 'Ephemeral execution worker that creates Mermaid architecture diagrams, system flows, and graphical visual assets.', 'bg-[#e0b09f]', 'gemini-3.6-flash', 0.3, 'You are Visual Diagram & Asset Generator Side Agent. Render precise Mermaid diagrams and generate visual concept assets.', '[{"id":"c13","name":"Mermaid Architecture Diagrams","description":"Generate sequence, flowchart, and ERD diagrams"},{"id":"c14","name":"Visual Asset Generation","description":"Synthesize UI mockups and visual asset specifications"}]'::jsonb, ARRAY['mermaid_renderer', 'image_asset_generator'], ARRAY[]::text[], 'idle', 34, 97.8)
        ON CONFLICT (id) DO NOTHING;
      `);

      // 3. Seed Default Skills
      await this.db.query(`
        INSERT INTO workspace_skills (id, name, description, category, icon, sop_summary, instructions, assigned_tools, enabled, is_custom)
        VALUES
          ('skill-rfc-architect', 'Architecture RFC & Decision Records', 'Standard operating procedure for drafting comprehensive technical design docs (TDD) and architecture decision records (ADR).', 'engineering', 'book-open', 'Enforces strict section hierarchy: Executive Summary, System Architecture, SQL DDL Schema, API Specifications, and Rollout Strategy.', 'Follow the RFC template: 1. Executive Summary, 2. High-Level Mermaid Architecture, 3. Relational/Vector Schema, 4. REST & SSE Contract, 5. Step-by-Step Implementation.', ARRAY['read_file', 'obsidian_vault_writer'], true, false),
          ('skill-deep-web-research', 'Deep Web Synthesis & Citation Grounding', 'Structured research playbook that queries search engines, evaluates source authority, and synthesizes cited answers.', 'knowledge', 'globe', 'Formulate multi-angle search queries, extract primary domain sources, filter commercial noise, and append numbered markdown footnotes.', 'Execute web search queries, verify 2+ sources, synthesize findings, cite domain URLs.', ARRAY['web_search'], true, false),
          ('skill-obsidian-vault-synthesis', 'Obsidian Vault Note Ingestion & Linking', 'Playbook for writing bi-directionally linked Markdown files with frontmatter tags and Obsidian YAML metadata.', 'knowledge', 'book-open', 'Structures frontmatter YAML (created, tags, aliases), uses [[WikiLinks]] for cross-note referencing, and writes atomic notes.', 'Format YAML frontmatter with date and tags, write concise markdown, link related topics.', ARRAY['obsidian_vault_writer', 'obsidian_vault_reader'], true, false),
          ('skill-ast-code-patcher', 'AST-Verified Code Patching & Refactoring', 'Strict code modification playbook that checks Abstract Syntax Trees (AST) before applying file diffs.', 'engineering', 'cpu', 'Generates minimal unified diffs, runs AST parsing to prevent syntax breakage, and verifies unit test passing.', 'Inspect original code, generate atomic diff, run syntax check, format output cleanly.', ARRAY['code_editor', 'code_ast_checker', 'bash_executor'], true, false),
          ('skill-threat-model-review', 'CVE & Security Threat Model Review', 'Standard protocol for auditing authentication boundaries, SQL injection risks, and secret leakage.', 'security', 'shield', 'Applies STRIDE threat modeling methodology, checks for hardcoded tokens, and verifies SQL parameterization.', 'Audit code for unsanitized inputs, check CORS and auth boundaries, document mitigations.', ARRAY['code_ast_checker', 'read_file'], true, false),
          ('skill-calendar-workflow-sync', 'Calendar & Agenda Intelligent Dispatch', 'Procedural standard for parsing conversational meeting requests, resolving timezones, and creating calendar events.', 'productivity', 'calendar', 'Resolves relative dates (tomorrow, next Monday), validates duration against free slots, and populates attendee metadata.', 'Extract event title, date, time, and attendees, verify slot availability, create calendar event.', ARRAY['calendar_event_creator', 'calendar_schedule_reader'], true, false)
        ON CONFLICT (id) DO NOTHING;
      `);

      // 4. Seed Default Integrations (MCP Connectors)
      await this.db.query(`
        INSERT INTO workspace_integrations (id, name, category, status, endpoint, version, transport, description, tools, last_ping_ms, latency_ms, is_custom)
        VALUES
          ('mcp-filesystem', 'Local Filesystem MCP Server', 'engineering', 'connected', 'npx -y @modelcontextprotocol/server-filesystem /home/azure/dev', 'v1.1.0', 'stdio', 'Grants secure sandboxed file read/write access to project directories.', '[{"id":"t-fs-1","name":"read_file","description":"Read UTF-8 file contents from workspace"},{"id":"t-fs-2","name":"write_file","description":"Write or overwrite file contents"},{"id":"t-fs-3","name":"list_directory","description":"List files and directories"}]'::jsonb, 8, 8, false),
          ('mcp-github', 'GitHub API MCP Server', 'engineering', 'connected', 'npx -y @modelcontextprotocol/server-github', 'v2.0.4', 'stdio', 'Inspect pull requests, browse repositories, create issues, and manage git branches.', '[{"id":"t-gh-1","name":"get_pull_request","description":"Fetch PR diff and review comments"},{"id":"t-gh-2","name":"create_branch","description":"Create new git branch"},{"id":"t-gh-3","name":"search_code","description":"Search repository code"}]'::jsonb, 42, 42, false),
          ('mcp-google-calendar', 'Google Calendar & Agenda MCP', 'productivity', 'connected', 'https://mcp.contextforge.internal/google-calendar/sse', 'v1.4.0', 'sse', 'Synchronize calendar events, check user availability, and schedule meetings.', '[{"id":"t-gc-1","name":"list_events","description":"Get today or upcoming calendar events"},{"id":"t-gc-2","name":"create_event","description":"Create new calendar entry"}]'::jsonb, 18, 18, false),
          ('mcp-postgres', 'PostgreSQL Database MCP Server', 'knowledge', 'connected', 'npx -y @modelcontextprotocol/server-postgres postgresql://cloudsql/contextforge_prod', 'v1.0.2', 'stdio', 'Inspect relational schemas, run parameterized read-only queries, and verify table constraints.', '[{"id":"t-pg-1","name":"describe_table","description":"Get column types and foreign keys"},{"id":"t-pg-2","name":"execute_query","description":"Run parameterized SQL query"}]'::jsonb, 12, 12, false),
          ('mcp-brave-search', 'Brave Web Search MCP Server', 'knowledge', 'connected', 'https://api.search.brave.com/res/v1/web', 'v1.0.0', 'rest', 'Live web search index providing factual grounding and cited documentation.', '[{"id":"t-bs-1","name":"web_search","description":"Execute live web search query"}]'::jsonb, 95, 95, false)
        ON CONFLICT (id) DO NOTHING;
      `);

      this.logger.log('✨ Ecosystem tables and seeds verified in PostgreSQL');
    } catch (err: unknown) {
      this.logger.error(
        'Failed to initialize ecosystem tables or seed data',
        err,
      );
    }
  }

  // ==========================================
  // AGENTS CRUD
  // ==========================================

  async getAgents(): Promise<WorkspaceAgentRow[]> {
    let res = await this.db.query<WorkspaceAgentRow>(
      `SELECT * FROM workspace_agents ORDER BY created_at ASC;`,
    );
    if (res.rows.length === 0) {
      await this.ensureTablesAndSeed();
      res = await this.db.query<WorkspaceAgentRow>(
        `SELECT * FROM workspace_agents ORDER BY created_at ASC;`,
      );
    }
    return res.rows;
  }

  async getAgentById(id: string): Promise<WorkspaceAgentRow | null> {
    const res = await this.db.query<WorkspaceAgentRow>(
      `SELECT * FROM workspace_agents WHERE id = $1;`,
      [id],
    );
    return res.rows[0] || null;
  }

  async updateAgent(
    id: string,
    updates: Partial<WorkspaceAgentRow>,
  ): Promise<WorkspaceAgentRow | null> {
    const agent = await this.getAgentById(id);
    if (!agent) return null;

    const systemPrompt = updates.system_prompt ?? agent.system_prompt;
    const temperature = updates.temperature ?? agent.temperature;
    const model = updates.model ?? agent.model;
    const assignedTools = updates.assigned_tools ?? agent.assigned_tools;
    const assignedSkills = updates.assigned_skills ?? agent.assigned_skills;
    const capabilities = updates.capabilities
      ? JSON.stringify(updates.capabilities)
      : JSON.stringify(agent.capabilities);

    const res = await this.db.query<WorkspaceAgentRow>(
      `UPDATE workspace_agents
       SET system_prompt = $1,
           temperature = $2,
           model = $3,
           assigned_tools = $4,
           assigned_skills = $5,
           capabilities = $6::jsonb,
           updated_at = NOW()
       WHERE id = $7
       RETURNING *;`,
      [
        systemPrompt,
        temperature,
        model,
        assignedTools,
        assignedSkills,
        capabilities,
        id,
      ],
    );
    return res.rows[0] || null;
  }

  // ==========================================
  // SKILLS CRUD
  // ==========================================

  async getSkills(): Promise<WorkspaceSkillRow[]> {
    let res = await this.db.query<WorkspaceSkillRow>(
      `SELECT * FROM workspace_skills ORDER BY created_at ASC;`,
    );
    if (res.rows.length === 0) {
      await this.ensureTablesAndSeed();
      res = await this.db.query<WorkspaceSkillRow>(
        `SELECT * FROM workspace_skills ORDER BY created_at ASC;`,
      );
    }
    return res.rows;
  }

  async getSkillById(id: string): Promise<WorkspaceSkillRow | null> {
    const res = await this.db.query<WorkspaceSkillRow>(
      `SELECT * FROM workspace_skills WHERE id = $1;`,
      [id],
    );
    return res.rows[0] || null;
  }

  async createSkill(data: {
    id?: string;
    name: string;
    description: string;
    category: WorkspaceSkillRow['category'];
    sopSummary: string;
    instructions: string;
    assignedTools: string[];
    icon?: string;
  }): Promise<WorkspaceSkillRow> {
    const id =
      data.id ||
      `skill-${data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`;
    const icon = data.icon || 'sparkles';

    const res = await this.db.query<WorkspaceSkillRow>(
      `INSERT INTO workspace_skills (id, name, description, category, icon, sop_summary, instructions, assigned_tools, enabled, is_custom)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, true)
       RETURNING *;`,
      [
        id,
        data.name,
        data.description,
        data.category,
        icon,
        data.sopSummary,
        data.instructions,
        data.assignedTools,
      ],
    );
    return res.rows[0];
  }

  async toggleSkill(id: string): Promise<WorkspaceSkillRow | null> {
    const skill = await this.getSkillById(id);
    if (!skill) return null;

    const res = await this.db.query<WorkspaceSkillRow>(
      `UPDATE workspace_skills
       SET enabled = NOT enabled,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *;`,
      [id],
    );
    return res.rows[0] || null;
  }

  async setSkillEnabled(
    id: string,
    enabled: boolean,
  ): Promise<WorkspaceSkillRow | null> {
    const res = await this.db.query<WorkspaceSkillRow>(
      `UPDATE workspace_skills
       SET enabled = $1,
           updated_at = NOW()
       WHERE id = $2
       RETURNING *;`,
      [enabled, id],
    );
    return res.rows[0] || null;
  }

  // ==========================================
  // MCP INTEGRATIONS CRUD
  // ==========================================

  async getIntegrations(): Promise<WorkspaceIntegrationRow[]> {
    let res = await this.db.query<WorkspaceIntegrationRow>(
      `SELECT * FROM workspace_integrations ORDER BY created_at ASC;`,
    );
    if (res.rows.length === 0) {
      await this.ensureTablesAndSeed();
      res = await this.db.query<WorkspaceIntegrationRow>(
        `SELECT * FROM workspace_integrations ORDER BY created_at ASC;`,
      );
    }
    return res.rows;
  }

  async getIntegrationById(
    id: string,
  ): Promise<WorkspaceIntegrationRow | null> {
    const res = await this.db.query<WorkspaceIntegrationRow>(
      `SELECT * FROM workspace_integrations WHERE id = $1;`,
      [id],
    );
    return res.rows[0] || null;
  }

  async createIntegration(data: {
    id?: string;
    connectionId?: string;
    name: string;
    category: WorkspaceIntegrationRow['category'];
    endpoint: string;
    description: string;
    transport?: 'stdio' | 'sse' | 'rest';
    tools?: any[];
  }): Promise<WorkspaceIntegrationRow> {
    const id =
      data.id ||
      `mcp-${data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`;
    const transport = data.transport || 'stdio';
    const tools = JSON.stringify(
      data.tools || [
        {
          id: `t-${id}-1`,
          name: `${data.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_action`,
          description: `Execute tools provided by ${data.name}`,
        },
      ],
    );

    const res = await this.db.query<WorkspaceIntegrationRow>(
      `INSERT INTO workspace_integrations (id, connection_id, name, category, status, endpoint, version, transport, description, tools, is_custom)
       VALUES ($1, $2, $3, $4, 'connected', $5, 'v1.0.0', $6, $7, $8::jsonb, true)
       RETURNING *;`,
      [
        id,
        data.connectionId || null,
        data.name,
        data.category,
        data.endpoint,
        transport,
        data.description,
        tools,
      ],
    );
    return res.rows[0];
  }

  async updateIntegration(
    id: string,
    updates: Partial<WorkspaceIntegrationRow>,
  ): Promise<WorkspaceIntegrationRow | null> {
    const current = await this.getIntegrationById(id);
    if (!current) return null;

    const name = updates.name ?? current.name;
    const status = updates.status ?? current.status;
    const endpoint = updates.endpoint ?? current.endpoint;
    const description = updates.description ?? current.description;
    const tools = updates.tools
      ? JSON.stringify(updates.tools)
      : JSON.stringify(current.tools);
    const lastPing = updates.last_ping_ms ?? current.last_ping_ms;
    const latency = updates.latency_ms ?? current.latency_ms;

    const res = await this.db.query<WorkspaceIntegrationRow>(
      `UPDATE workspace_integrations
       SET name = $1,
           status = $2,
           endpoint = $3,
           description = $4,
           tools = $5::jsonb,
           last_ping_ms = $6,
           latency_ms = $7,
           updated_at = NOW()
       WHERE id = $8
       RETURNING *;`,
      [name, status, endpoint, description, tools, lastPing, latency, id],
    );
    return res.rows[0] || null;
  }

  async deleteIntegration(id: string): Promise<boolean> {
    const res = await this.db.query(
      `DELETE FROM workspace_integrations WHERE id = $1;`,
      [id],
    );
    return (res.rowCount ?? 0) > 0;
  }
}
