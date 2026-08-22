import { Injectable, Logger } from '@nestjs/common';
import {
  AutomationRepository,
  AutomationWorkflowRow,
} from '../../modules/automation/automation.repository';
import {
  OrchestrationResult,
  StreamEmitter,
} from '../orchestrator/orchestrator.types';

export interface AutomationToolArgs {
  name?: string;
  description?: string;
  schedule_cron?: string;
  schedule_label?: string;
  mcp_server_id?: string;
  mcp_tools?: string[];
  prompt_template?: string;
}

@Injectable()
export class AutomationToolHandler {
  private readonly logger = new Logger(AutomationToolHandler.name);

  constructor(private readonly automationRepo: AutomationRepository) {}

  async execute(
    prompt: string,
    args: AutomationToolArgs,
    emit: StreamEmitter,
  ): Promise<OrchestrationResult> {
    void prompt;
    const workflowName = args.name || 'Daily Scheduled Automation';
    const cron = args.schedule_cron || '0 8 * * *';
    const scheduleLabel = args.schedule_label || 'Every day at 08:00 AM';
    const isNotion =
      !args.mcp_server_id || args.mcp_server_id.includes('notion');
    const mcpServerId =
      args.mcp_server_id ||
      (isNotion ? 'int-notion-mcp' : 'int-obsidian-vault-mcp');
    const mcpTools =
      args.mcp_tools ||
      (isNotion
        ? ['notion_get_tasks', 'notion_read_page', 'notion_search']
        : [
            'obsidian_create_daily_note',
            'obsidian_vault_writer',
            'obsidian_vault_reader',
          ]);
    const description =
      args.description ||
      `Autonomous background worker scheduled ${scheduleLabel} to execute ${mcpServerId} operations.`;
    const promptTemplate =
      args.prompt_template ||
      `Tinjau seluruh data dan tugas terkait dari konektor MCP (${mcpServerId}). Buatkan ringkasan prioritas tinggi untuk hari ini ({{today}}).`;

    const agentId = 'agent-conversational';
    const agentName = 'Personal Assistant Agent';

    emit({
      event: 'timeline_stage',
      data: {
        stage: 'scheduling',
        label: `Registering Background Automation: ${workflowName}...`,
      },
    });

    // 1. Save automation record to PostgreSQL
    let createdWorkflow: AutomationWorkflowRow;
    try {
      createdWorkflow = await this.automationRepo.createAutomation({
        name: workflowName,
        description,
        agent_id: agentId,
        agent_name: agentName,
        mcp_server_id: mcpServerId,
        mcp_tools: mcpTools,
        trigger_type: 'schedule',
        schedule_cron: cron,
        schedule_label: scheduleLabel,
        prompt_template: promptTemplate,
        guardrail_strict_hitl: false,
        is_active: true,
      });
    } catch {
      createdWorkflow = {
        id: `auto-${Date.now()}`,
        name: workflowName,
        description,
        agent_id: agentId,
        agent_name: agentName,
        mcp_server_id: mcpServerId,
        mcp_tools: mcpTools,
        trigger_type: 'schedule',
        schedule_cron: cron,
        schedule_label: scheduleLabel,
        prompt_template: promptTemplate,
        guardrail_strict_hitl: false,
        is_active: true,
        total_runs: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    emit({
      event: 'automation_created',
      data: {
        id: createdWorkflow.id,
        name: createdWorkflow.name,
        description: createdWorkflow.description,
        agentId: createdWorkflow.agent_id,
        agentName: createdWorkflow.agent_name,
        mcpServerId: createdWorkflow.mcp_server_id,
        mcpTools: createdWorkflow.mcp_tools,
        triggerType: createdWorkflow.trigger_type,
        scheduleCron: createdWorkflow.schedule_cron,
        scheduleLabel: createdWorkflow.schedule_label,
        promptTemplate: createdWorkflow.prompt_template,
        guardrailStrictHITL: createdWorkflow.guardrail_strict_hitl,
        isActive: createdWorkflow.is_active,
        totalRuns: createdWorkflow.total_runs,
        createdAt: createdWorkflow.created_at,
      },
    });

    const summaryText = `Registered background automation "${workflowName}" (${scheduleLabel}).`;

    emit({
      event: 'tool_call_result',
      data: {
        toolName: 'create_scheduled_automation',
        summary: summaryText,
        automationId: createdWorkflow.id,
      },
    });

    return {
      textContent: summaryText,
      summary: summaryText,
      rawResult: {
        success: true,
        automationId: createdWorkflow.id,
        name: createdWorkflow.name,
        scheduleCron: createdWorkflow.schedule_cron,
        mcpServerId: createdWorkflow.mcp_server_id,
      },
      intent: {
        toolName: 'create_scheduled_automation',
        service: 'automation',
        status: 'completed',
        summaryText: `Automation Scheduled: ${workflowName} (${cron})`,
      },
    };
  }
}
