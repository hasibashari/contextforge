import { API_BASE_URL, handleApiResponse } from './config';
import type {
  Agent,
  Skill,
  Integration,
  AgentCapability,
  AgentRoleType,
  AgentPermissionType,
  McpTool,
} from '@/shared/types/workspace';

interface BackendAgent {
  id: string;
  name: string;
  role: string;
  agent_type?: AgentRoleType;
  agentType?: AgentRoleType;
  permissions?: AgentPermissionType;
  description: string;
  avatar_color?: string;
  avatarColor?: string;
  model?: string;
  temperature?: number | string;
  system_prompt?: string;
  systemPrompt?: string;
  capabilities?: AgentCapability[];
  assigned_tools?: string[];
  assignedTools?: string[];
  assigned_skills?: string[];
  assignedSkills?: string[];
  status?: 'idle' | 'executing' | 'offline';
  total_tasks_completed?: number;
  totalTasksCompleted?: number;
  success_rate_pct?: number | string;
  successRatePct?: number | string;
}

interface BackendSkill {
  id: string;
  name: string;
  description: string;
  category: Skill['category'];
  icon?: string;
  sop_summary?: string;
  sopSummary?: string;
  instructions?: string;
  assigned_tools?: string[];
  assignedTools?: string[];
  enabled?: boolean;
  is_custom?: boolean;
  isCustom?: boolean;
}

interface BackendIntegration {
  id: string;
  connection_id?: string;
  connectionId?: string;
  name: string;
  category: Integration['category'];
  status?: 'connected' | 'connecting' | 'disconnected' | 'error';
  endpoint: string;
  version?: string;
  description: string;
  tools?: McpTool[];
  last_ping_ms?: number;
  lastPingMs?: number;
  latency_ms?: number;
  latencyMs?: number;
  transport?: 'stdio' | 'sse' | 'rest';
  is_custom?: boolean;
  isCustom?: boolean;
}

// Helper to normalize backend rows to frontend models
function mapAgentFromBackend(row: BackendAgent): Agent {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    agentType: row.agent_type || row.agentType || 'orchestrator',
    permissions: row.permissions || 'read_only',
    description: row.description,
    avatarColor: row.avatar_color || row.avatarColor || 'bg-primary',
    model: row.model || 'gemini-3.6-flash',
    temperature:
      typeof row.temperature === 'number'
        ? row.temperature
        : typeof row.temperature === 'string'
        ? parseFloat(row.temperature)
        : 0.2,
    systemPrompt: row.system_prompt || row.systemPrompt || '',
    capabilities: row.capabilities || [],
    assignedTools: row.assigned_tools || row.assignedTools || [],
    assignedSkills: row.assigned_skills || row.assignedSkills || [],
    status: (row.status as Agent['status']) || 'idle',
    totalTasksCompleted: row.total_tasks_completed ?? row.totalTasksCompleted ?? 0,
    successRatePct:
      typeof row.success_rate_pct === 'number'
        ? row.success_rate_pct
        : typeof row.success_rate_pct === 'string'
        ? parseFloat(row.success_rate_pct)
        : typeof row.successRatePct === 'number'
        ? row.successRatePct
        : 100,
  };
}

function mapSkillFromBackend(row: BackendSkill): Skill {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    icon: row.icon || 'sparkles',
    sopSummary: row.sop_summary || row.sopSummary || '',
    instructions: row.instructions || '',
    assignedTools: row.assigned_tools || row.assignedTools || [],
    enabled: Boolean(row.enabled),
    isCustom: Boolean(row.is_custom || row.isCustom),
  };
}

function mapIntegrationFromBackend(row: BackendIntegration): Integration {
  return {
    id: row.id,
    connectionId: row.connection_id || row.connectionId,
    name: row.name,
    category: row.category,
    status: row.status || 'connected',
    endpoint: row.endpoint,
    version: row.version || 'v1.0.0',
    description: row.description,
    tools: row.tools || [],
    lastPingMs: row.last_ping_ms ?? row.lastPingMs ?? 12,
    latencyMs: row.latency_ms ?? row.latencyMs ?? 12,
    transport: row.transport || 'stdio',
    isCustom: Boolean(row.is_custom || row.isCustom),
  };
}

export const ecosystemApi = {
  // ------------------------------------------
  // AGENTS
  // ------------------------------------------
  async getAgents(): Promise<Agent[]> {
    const res = await fetch(`${API_BASE_URL}/ecosystem/agents`);
    const data = await handleApiResponse<BackendAgent[]>(res);
    return Array.isArray(data) ? data.map(mapAgentFromBackend) : [];
  },

  async updateAgent(id: string, updates: Partial<Agent>): Promise<Agent> {
    const payload: Record<string, unknown> = {};
    if (updates.systemPrompt !== undefined) payload.system_prompt = updates.systemPrompt;
    if (updates.temperature !== undefined) payload.temperature = updates.temperature;
    if (updates.model !== undefined) payload.model = updates.model;
    if (updates.assignedTools !== undefined) payload.assigned_tools = updates.assignedTools;
    if (updates.assignedSkills !== undefined) payload.assigned_skills = updates.assignedSkills;
    if (updates.capabilities !== undefined) payload.capabilities = updates.capabilities;

    const res = await fetch(`${API_BASE_URL}/ecosystem/agents/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await handleApiResponse<BackendAgent>(res);
    return mapAgentFromBackend(data);
  },

  // ------------------------------------------
  // SKILLS (SOPs)
  // ------------------------------------------
  async getSkills(): Promise<Skill[]> {
    const res = await fetch(`${API_BASE_URL}/ecosystem/skills`);
    const data = await handleApiResponse<BackendSkill[]>(res);
    return Array.isArray(data) ? data.map(mapSkillFromBackend) : [];
  },

  async createSkill(data: {
    name: string;
    description: string;
    category: Skill['category'];
    sopSummary: string;
    instructions: string;
    assignedTools: string[];
    icon?: string;
  }): Promise<Skill> {
    const res = await fetch(`${API_BASE_URL}/ecosystem/skills`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await handleApiResponse<BackendSkill>(res);
    return mapSkillFromBackend(result);
  },

  async toggleSkill(id: string): Promise<Skill> {
    const res = await fetch(`${API_BASE_URL}/ecosystem/skills/${encodeURIComponent(id)}/toggle`, {
      method: 'PATCH',
    });
    const data = await handleApiResponse<BackendSkill>(res);
    return mapSkillFromBackend(data);
  },

  // ------------------------------------------
  // MCP CONNECTORS / INTEGRATIONS
  // ------------------------------------------
  async getIntegrations(): Promise<Integration[]> {
    const res = await fetch(`${API_BASE_URL}/ecosystem/integrations`);
    const data = await handleApiResponse<BackendIntegration[]>(res);
    return Array.isArray(data) ? data.map(mapIntegrationFromBackend) : [];
  },

  async createIntegration(data: {
    connectionId?: string;
    name: string;
    category: Integration['category'];
    endpoint: string;
    description: string;
    transport?: 'stdio' | 'sse' | 'rest';
    tools?: McpTool[];
  }): Promise<Integration> {
    const res = await fetch(`${API_BASE_URL}/ecosystem/integrations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await handleApiResponse<BackendIntegration>(res);
    return mapIntegrationFromBackend(result);
  },

  async updateIntegration(id: string, updates: Partial<Integration>): Promise<Integration> {
    const payload: Record<string, unknown> = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.endpoint !== undefined) payload.endpoint = updates.endpoint;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.tools !== undefined) payload.tools = updates.tools;
    if (updates.lastPingMs !== undefined) payload.last_ping_ms = updates.lastPingMs;
    if (updates.latencyMs !== undefined) payload.latency_ms = updates.latencyMs;

    const res = await fetch(`${API_BASE_URL}/ecosystem/integrations/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await handleApiResponse<BackendIntegration>(res);
    return mapIntegrationFromBackend(data);
  },

  async testIntegration(id: string): Promise<{
    id: string;
    status: 'connected' | 'error';
    latencyMs: number;
    message: string;
  }> {
    const res = await fetch(`${API_BASE_URL}/ecosystem/integrations/${encodeURIComponent(id)}/test`, {
      method: 'POST',
    });
    return handleApiResponse<{
      id: string;
      status: 'connected' | 'error';
      latencyMs: number;
      message: string;
    }>(res);
  },

  async deleteIntegration(id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/ecosystem/integrations/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    await handleApiResponse<{ success: boolean }>(res);
  },
};
