import { Injectable } from '@nestjs/common';
import {
  ISubAgent,
  SubAgentId,
  SubAgentPersonaConfig,
  MemorySummaryContext,
} from '../subagent.types';
import { McpToolDefinition } from '../../../mcp/core';

@Injectable()
export class ExecutiveSchedulerSubAgent implements ISubAgent {
  readonly id: SubAgentId = 'executive_scheduler';
  readonly name = 'Vanguard - Executive Scheduler & Goal Strategist';
  readonly role = 'Calendar Time-Blocking & Sprint Execution Specialist';
  readonly description =
    'Manages Google Calendar events, Notion databases, sprint milestones, and autonomous goal evaluations.';

  private readonly allowedTools = [
    'gcal_list_events',
    'gcal_create_event',
    'gcal_update_event',
    'gcal_delete_event',
    'gcal_get_free_busy',
    'notion_search_pages',
    'notion_read_page',
    'notion_create_page',
    'notion_update_page',
    'notion_query_database',
    'create_goal',
    'evaluate_goal_progress',
    'verify_task_goal',
    'trigger_workflow_run',
  ];

  getPersonaConfig(): SubAgentPersonaConfig {
    return {
      id: this.id,
      name: this.name,
      avatar: '⚡',
      role: this.role,
      description: this.description,
      systemPrompt: this.formatSubAgentPrompt(),
      allowedToolNames: this.allowedTools,
      temperature: 0.15,
    };
  }

  filterAllowedTools(allTools: McpToolDefinition[]): McpToolDefinition[] {
    return allTools.filter(
      (tool) =>
        this.allowedTools.includes(tool.name) ||
        tool.name.startsWith('gcal_') ||
        tool.name.startsWith('notion_'),
    );
  }

  formatSubAgentPrompt(memorySummary?: MemorySummaryContext): string {
    const memoryBlock = Array.isArray(memorySummary)
      ? memorySummary
          .map((m) => `- [${m.category.toUpperCase()}] ${m.key}: ${m.value}`)
          .join('\n')
      : memorySummary || 'No stored scheduling preferences.';

    return `You are Vanguard, the Executive Scheduler & Goal Strategist.
Your mission is to maximize high-leverage focus time, resolve calendar conflicts, and drive goal execution.

CORE CAPABILITIES:
1. Time Blocking: Create focused deep-work blocks in Google Calendar ('gcal_create_event').
2. Calendar Audit: Check free/busy slots ('gcal_get_free_busy') before scheduling meetings.
3. Notion Project Sync: Query and update project tasks in Notion databases.
4. Goal & Sprint Tracking: Track milestones, evaluate velocity, and verify task completion.

USER PREFERENCES:
${memoryBlock}

COMMUNICATION TONE:
- Crisp, proactive, highly organized, and results-driven.`;
  }
}
