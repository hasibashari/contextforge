import type { AutomationWorkflowRow } from '../automation.repository';

export class CreateAutomationDto {
  id?: string;
  name!: string;
  description?: string;
  agent_id?: string;
  agentId?: string;
  agent_name?: string;
  agentName?: string;
  mcp_server_id?: string;
  mcpServerId?: string;
  mcp_tools?: string[];
  mcpTools?: string[];
  trigger_type?: 'schedule' | 'event' | 'manual';
  triggerType?: 'schedule' | 'event' | 'manual';
  schedule_cron?: string;
  scheduleCron?: string;
  schedule_label?: string;
  scheduleLabel?: string;
  event_source?: string;
  eventSource?: string;
  prompt_template?: string;
  promptTemplate?: string;
  guardrail_strict_hitl?: boolean;
  guardrailStrictHITL?: boolean;
  is_active?: boolean;
  isActive?: boolean;

  static toEntity(dto: CreateAutomationDto): Partial<AutomationWorkflowRow> {
    const rawAgentId =
      dto.agent_id || dto.agentId || 'agent-personal-assistant';
    // Standardize legacy agent IDs
    const normalizedAgentId =
      rawAgentId === 'agent-action-worker' ||
      rawAgentId === 'agent-action' ||
      rawAgentId === 'agent-conversational'
        ? 'agent-personal-assistant'
        : rawAgentId === 'agent-researcher'
          ? 'agent-research'
          : rawAgentId;

    const rawTools = dto.mcp_tools || dto.mcpTools || [];
    // Standardize legacy tool names
    const normalizedTools = rawTools.map((t) => {
      if (t === 'obsidian_read_vault') return 'obsidian_vault_reader';
      if (t === 'obsidian_write_note') return 'obsidian_vault_writer';
      return t;
    });

    return {
      id: dto.id,
      name: dto.name,
      description: dto.description || '',
      agent_id: normalizedAgentId,
      agent_name: dto.agent_name || dto.agentName || 'Action Agent',
      mcp_server_id: dto.mcp_server_id || dto.mcpServerId || undefined,
      mcp_tools: normalizedTools,
      trigger_type: dto.trigger_type || dto.triggerType || 'schedule',
      schedule_cron: dto.schedule_cron || dto.scheduleCron || '0 8 * * *',
      schedule_label:
        dto.schedule_label || dto.scheduleLabel || 'Every day at 08:00 AM',
      event_source: dto.event_source || dto.eventSource || undefined,
      prompt_template: dto.prompt_template || dto.promptTemplate || '',
      guardrail_strict_hitl:
        dto.guardrail_strict_hitl ?? dto.guardrailStrictHITL ?? false,
      is_active: dto.is_active ?? dto.isActive ?? true,
    };
  }
}

export class UpdateAutomationDto {
  name?: string;
  description?: string;
  agent_id?: string;
  agentId?: string;
  agent_name?: string;
  agentName?: string;
  mcp_server_id?: string;
  mcpServerId?: string;
  mcp_tools?: string[];
  mcpTools?: string[];
  trigger_type?: 'schedule' | 'event' | 'manual';
  triggerType?: 'schedule' | 'event' | 'manual';
  schedule_cron?: string;
  scheduleCron?: string;
  schedule_label?: string;
  scheduleLabel?: string;
  event_source?: string;
  eventSource?: string;
  prompt_template?: string;
  promptTemplate?: string;
  guardrail_strict_hitl?: boolean;
  guardrailStrictHITL?: boolean;
  is_active?: boolean;
  isActive?: boolean;
  last_run_at?: string;
  lastRunAt?: string;
  last_run_status?: string;
  lastRunStatus?: string;
  total_runs?: number;
  totalRuns?: number;

  static toEntity(dto: UpdateAutomationDto): Partial<AutomationWorkflowRow> {
    const updates: Partial<AutomationWorkflowRow> = {};

    if (dto.name !== undefined) updates.name = dto.name;
    if (dto.description !== undefined) updates.description = dto.description;

    const agentId = dto.agent_id ?? dto.agentId;
    if (agentId !== undefined) {
      updates.agent_id =
        agentId === 'agent-action-worker' ||
        agentId === 'agent-action' ||
        agentId === 'agent-conversational'
          ? 'agent-personal-assistant'
          : agentId === 'agent-researcher'
            ? 'agent-research'
            : agentId;
    }

    const agentName = dto.agent_name ?? dto.agentName;
    if (agentName !== undefined) updates.agent_name = agentName;

    const mcpServerId = dto.mcp_server_id ?? dto.mcpServerId;
    if (mcpServerId !== undefined) updates.mcp_server_id = mcpServerId;

    const tools = dto.mcp_tools ?? dto.mcpTools;
    if (tools !== undefined) {
      updates.mcp_tools = tools.map((t) => {
        if (t === 'obsidian_read_vault') return 'obsidian_vault_reader';
        if (t === 'obsidian_write_note') return 'obsidian_vault_writer';
        return t;
      });
    }

    const triggerType = dto.trigger_type ?? dto.triggerType;
    if (triggerType !== undefined) updates.trigger_type = triggerType;

    const scheduleCron = dto.schedule_cron ?? dto.scheduleCron;
    if (scheduleCron !== undefined) updates.schedule_cron = scheduleCron;

    const scheduleLabel = dto.schedule_label ?? dto.scheduleLabel;
    if (scheduleLabel !== undefined) updates.schedule_label = scheduleLabel;

    const eventSource = dto.event_source ?? dto.eventSource;
    if (eventSource !== undefined) updates.event_source = eventSource;

    const promptTemplate = dto.prompt_template ?? dto.promptTemplate;
    if (promptTemplate !== undefined) updates.prompt_template = promptTemplate;

    const guardrail = dto.guardrail_strict_hitl ?? dto.guardrailStrictHITL;
    if (guardrail !== undefined) updates.guardrail_strict_hitl = guardrail;

    const isActive = dto.is_active ?? dto.isActive;
    if (isActive !== undefined) updates.is_active = isActive;

    const lastRunAt = dto.last_run_at ?? dto.lastRunAt;
    if (lastRunAt !== undefined) updates.last_run_at = lastRunAt;

    const lastRunStatus = dto.last_run_status ?? dto.lastRunStatus;
    if (lastRunStatus !== undefined) updates.last_run_status = lastRunStatus;

    const totalRuns = dto.total_runs ?? dto.totalRuns;
    if (totalRuns !== undefined) updates.total_runs = totalRuns;

    return updates;
  }
}
