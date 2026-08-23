import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';

export interface WorkspaceAgentRow {
  id: string;
  name: string;
  role: string;
  agent_type: 'orchestrator' | 'researcher';
  permissions: 'read_only' | 'sandbox_write' | 'full_system';
  description: string;
  avatar_color: string;
  model: string;
  temperature: number;
  system_prompt: string;
  capabilities: any[];
  assigned_tools: string[];
  assigned_skills: string[];
  status: 'idle' | 'executing' | 'offline';
  total_tasks_completed: number;
  success_rate_pct: number;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceSkillRow {
  id: string;
  name: string;
  description: string;
  category:
    | 'architecture'
    | 'qa_testing'
    | 'security'
    | 'knowledge'
    | 'database'
    | 'productivity';
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
  name: string;
  category?: string;
  status: 'connected' | 'disconnected' | 'error';
  endpoint: string;
  version: string;
  transport: 'stdio' | 'streamable_http' | 'sse' | 'rest';
  auth_type?: 'none' | 'bearer' | 'oauth' | 'api_key';
  auth_config?: {
    token?: string;
    apiKey?: string;
    workspaceName?: string;
    workspaceId?: string;
    workspaceIcon?: string;
    botId?: string;
    vaultName?: string;
    vaultPath?: string;
    headers?: Record<string, string>;
    env?: Record<string, string>;
  };
  description: string;
  tools: any[];
  last_ping_ms: number;
  latency_ms: number;
  health_message?: string;
  is_custom: boolean;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class EcosystemRepository implements OnModuleInit {
  private readonly logger = new Logger(EcosystemRepository.name);

  constructor(private readonly db: DatabaseService) {}

  async onModuleInit() {
    await this.ensureTables();
  }

  async ensureTables() {
    try {
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS workspace_agents (
          id VARCHAR(100) PRIMARY KEY,
          name VARCHAR(150) NOT NULL,
          role VARCHAR(150) NOT NULL,
          agent_type VARCHAR(50) NOT NULL,
          permissions VARCHAR(50) NOT NULL,
          description TEXT NOT NULL,
          avatar_color VARCHAR(50) DEFAULT 'bg-primary',
          model VARCHAR(100) DEFAULT 'gemini-3.5-flash',
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
        ALTER TABLE workspace_agents DROP CONSTRAINT IF EXISTS workspace_agents_status_check;
        ALTER TABLE workspace_agents DROP CONSTRAINT IF EXISTS workspace_agents_agent_type_check;
        ALTER TABLE workspace_agents DROP CONSTRAINT IF EXISTS workspace_agents_permissions_check;
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
          name VARCHAR(150) NOT NULL,
          category VARCHAR(50) DEFAULT 'mcp_server',
          status VARCHAR(30) DEFAULT 'connected',
          endpoint TEXT NOT NULL,
          version VARCHAR(50) DEFAULT 'v1.0.0',
          transport VARCHAR(30) DEFAULT 'stdio',
          auth_type VARCHAR(30) DEFAULT 'none',
          auth_config JSONB DEFAULT '{}',
          description TEXT NOT NULL,
          tools JSONB DEFAULT '[]',
          last_ping_ms INTEGER DEFAULT 12,
          latency_ms INTEGER DEFAULT 12,
          is_custom BOOLEAN DEFAULT false,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        ALTER TABLE workspace_integrations DROP CONSTRAINT IF EXISTS workspace_integrations_category_check;
        ALTER TABLE workspace_integrations DROP CONSTRAINT IF EXISTS workspace_integrations_transport_check;
        ALTER TABLE workspace_integrations ADD COLUMN IF NOT EXISTS auth_type VARCHAR(30) DEFAULT 'none';
        ALTER TABLE workspace_integrations ADD COLUMN IF NOT EXISTS auth_config JSONB DEFAULT '{}';
      `);

      this.logger.log('✨ Ecosystem database tables verified in PostgreSQL');
    } catch (err: unknown) {
      this.logger.error('Failed to initialize ecosystem tables', err);
    }
  }

  // ==========================================
  // AGENTS CRUD
  // ==========================================

  async getAgents(): Promise<WorkspaceAgentRow[]> {
    const res = await this.db.query<WorkspaceAgentRow>(
      `SELECT * FROM workspace_agents ORDER BY created_at ASC;`,
    );
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

    const name = updates.name ?? agent.name;
    const role = updates.role ?? agent.role;
    const description = updates.description ?? agent.description;
    const model = updates.model ?? agent.model;
    const temperature = updates.temperature ?? agent.temperature;
    const system_prompt = updates.system_prompt ?? agent.system_prompt;
    const capabilities = updates.capabilities
      ? JSON.stringify(updates.capabilities)
      : JSON.stringify(agent.capabilities);
    const assigned_tools = updates.assigned_tools ?? agent.assigned_tools;
    const assigned_skills = updates.assigned_skills ?? agent.assigned_skills;
    const status = updates.status ?? agent.status;

    const res = await this.db.query<WorkspaceAgentRow>(
      `UPDATE workspace_agents
       SET name = $1,
           role = $2,
           description = $3,
           model = $4,
           temperature = $5,
           system_prompt = $6,
           capabilities = $7::jsonb,
           assigned_tools = $8,
           assigned_skills = $9,
           status = $10,
           updated_at = NOW()
       WHERE id = $11
       RETURNING *;`,
      [
        name,
        role,
        description,
        model,
        temperature,
        system_prompt,
        capabilities,
        assigned_tools,
        assigned_skills,
        status,
        id,
      ],
    );
    return res.rows[0] || null;
  }

  // ==========================================
  // SKILLS CRUD
  // ==========================================

  async getSkills(): Promise<WorkspaceSkillRow[]> {
    const res = await this.db.query<WorkspaceSkillRow>(
      `SELECT * FROM workspace_skills ORDER BY created_at ASC;`,
    );
    return res.rows;
  }

  async getActiveSkills(): Promise<WorkspaceSkillRow[]> {
    const res = await this.db.query<WorkspaceSkillRow>(
      `SELECT * FROM workspace_skills WHERE enabled = true ORDER BY created_at ASC;`,
    );
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
    category: string;
    icon?: string;
    sopSummary: string;
    instructions: string;
    assignedTools?: string[];
  }): Promise<WorkspaceSkillRow> {
    const id =
      data.id ||
      `skill-${data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`;

    const res = await this.db.query<WorkspaceSkillRow>(
      `INSERT INTO workspace_skills (
        id, name, description, category, icon, sop_summary, instructions, assigned_tools, enabled, is_custom
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, true)
      RETURNING *;`,
      [
        id,
        data.name,
        data.description,
        data.category,
        data.icon || 'sparkles',
        data.sopSummary,
        data.instructions,
        data.assignedTools || [],
      ],
    );
    return res.rows[0];
  }

  async toggleSkill(id: string): Promise<WorkspaceSkillRow | null> {
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

  // ==========================================
  // INTEGRATIONS (MCP CONNECTORS) CRUD
  // ==========================================

  async getIntegrations(): Promise<WorkspaceIntegrationRow[]> {
    const res = await this.db.query<WorkspaceIntegrationRow>(
      `SELECT * FROM workspace_integrations ORDER BY created_at ASC;`,
    );
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
    category?: string;
    endpoint: string;
    description: string;
    transport?: 'stdio' | 'streamable_http' | 'sse' | 'rest';
    authType?: 'none' | 'bearer' | 'oauth' | 'api_key';
    authConfig?: {
      token?: string;
      headers?: Record<string, string>;
      env?: Record<string, string>;
    };
    tools?: any[];
  }): Promise<WorkspaceIntegrationRow> {
    const id =
      data.id ||
      `mcp-${data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`;
    const transport = data.transport || 'stdio';
    const category = data.category || 'mcp_server';
    const authType = data.authType || 'none';
    const authConfig = JSON.stringify(data.authConfig || {});
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
      `INSERT INTO workspace_integrations (id, connection_id, name, category, status, endpoint, version, transport, auth_type, auth_config, description, tools, is_custom)
       VALUES ($1, $2, $3, $4, 'connected', $5, 'v1.0.0', $6, $7, $8::jsonb, $9, $10::jsonb, true)
       RETURNING *;`,
      [
        id,
        data.connectionId || null,
        data.name,
        category,
        data.endpoint,
        transport,
        authType,
        authConfig,
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
    const transport = updates.transport ?? current.transport;
    const authType = updates.auth_type ?? current.auth_type ?? 'none';
    const authConfig = updates.auth_config
      ? JSON.stringify(updates.auth_config)
      : JSON.stringify(current.auth_config || {});
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
           transport = $4,
           auth_type = $5,
           auth_config = $6::jsonb,
           description = $7,
           tools = $8::jsonb,
           last_ping_ms = $9,
           latency_ms = $10,
           updated_at = NOW()
       WHERE id = $11
       RETURNING *;`,
      [
        name,
        status,
        endpoint,
        transport,
        authType,
        authConfig,
        description,
        tools,
        lastPing,
        latency,
        id,
      ],
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
