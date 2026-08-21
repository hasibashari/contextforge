import { API_BASE_URL, handleApiResponse } from './config';
import type { AutomationWorkflow, AutomationStatus } from '@/shared/types/workspace';

export interface BackendAutomationWorkflow {
  id: string;
  name: string;
  description: string;
  agent_id: string;
  agent_name?: string;
  mcp_server_id?: string;
  mcp_tools?: string[];
  trigger_type: 'schedule' | 'event' | 'manual';
  schedule_cron?: string;
  schedule_label?: string;
  event_source?: string;
  prompt_template: string;
  guardrail_strict_hitl: boolean;
  is_active: boolean;
  last_run_at?: string;
  last_run_status?: string;
  total_runs: number;
  created_at?: string;
  updated_at?: string;
}

function mapToFrontend(a: BackendAutomationWorkflow): AutomationWorkflow {
  return {
    id: a.id,
    name: a.name,
    description: a.description,
    agentId: a.agent_id,
    agentName: a.agent_name || 'Action Agent',
    mcpServerId: a.mcp_server_id,
    mcpTools: a.mcp_tools || [],
    triggerType: a.trigger_type,
    scheduleCron: a.schedule_cron,
    scheduleLabel: a.schedule_label || 'Scheduled Workflow',
    eventSource: a.event_source,
    promptTemplate: a.prompt_template,
    guardrailStrictHITL: a.guardrail_strict_hitl,
    isActive: a.is_active,
    lastRunAt: a.last_run_at,
    lastRunStatus: a.last_run_status as AutomationStatus | undefined,
    totalRuns: a.total_runs || 0,
    createdAt: a.created_at || new Date().toISOString(),
  };
}

export const automationApi = {
  async getAll(): Promise<AutomationWorkflow[]> {
    const res = await fetch(`${API_BASE_URL}/automations`);
    const data = await handleApiResponse<BackendAutomationWorkflow[]>(res);
    return (data || []).map(mapToFrontend);
  },

  async getById(id: string): Promise<AutomationWorkflow> {
    const res = await fetch(`${API_BASE_URL}/automations/${id}`);
    const data = await handleApiResponse<BackendAutomationWorkflow>(res);
    return mapToFrontend(data);
  },

  async create(payload: Omit<AutomationWorkflow, 'id' | 'totalRuns' | 'createdAt'>): Promise<AutomationWorkflow> {
    const res = await fetch(`${API_BASE_URL}/automations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: payload.name,
        description: payload.description,
        agent_id: payload.agentId,
        agent_name: payload.agentName,
        mcp_server_id: payload.mcpServerId,
        mcp_tools: payload.mcpTools,
        trigger_type: payload.triggerType,
        schedule_cron: payload.scheduleCron,
        schedule_label: payload.scheduleLabel,
        event_source: payload.eventSource,
        prompt_template: payload.promptTemplate,
        guardrail_strict_hitl: payload.guardrailStrictHITL,
        is_active: payload.isActive ?? true,
      }),
    });
    const data = await handleApiResponse<BackendAutomationWorkflow>(res);
    return mapToFrontend(data);
  },

  async update(id: string, updates: Partial<AutomationWorkflow>): Promise<AutomationWorkflow> {
    const res = await fetch(`${API_BASE_URL}/automations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: updates.name,
        description: updates.description,
        agent_id: updates.agentId,
        agent_name: updates.agentName,
        mcp_server_id: updates.mcpServerId,
        mcp_tools: updates.mcpTools,
        trigger_type: updates.triggerType,
        schedule_cron: updates.scheduleCron,
        schedule_label: updates.scheduleLabel,
        event_source: updates.eventSource,
        prompt_template: updates.promptTemplate,
        guardrail_strict_hitl: updates.guardrailStrictHITL,
        is_active: updates.isActive,
      }),
    });
    const data = await handleApiResponse<BackendAutomationWorkflow>(res);
    return mapToFrontend(data);
  },

  async delete(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE_URL}/automations/${id}`, {
      method: 'DELETE',
    });
    return handleApiResponse<{ success: boolean }>(res);
  },

  async run(id: string): Promise<{ success: boolean; data?: unknown }> {
    const res = await fetch(`${API_BASE_URL}/automations/${id}/run`, {
      method: 'POST',
    });
    return handleApiResponse<{ success: boolean; data?: unknown }>(res);
  },
};
