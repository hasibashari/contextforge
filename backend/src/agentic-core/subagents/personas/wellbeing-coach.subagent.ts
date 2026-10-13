import { Injectable } from '@nestjs/common';
import {
  ISubAgent,
  SubAgentId,
  SubAgentPersonaConfig,
  MemorySummaryContext,
} from '../subagent.types';
import { McpToolDefinition } from '../../../mcp/core';

@Injectable()
export class WellbeingCoachSubAgent implements ISubAgent {
  readonly id: SubAgentId = 'wellbeing_coach';
  readonly name = 'Dr. Lyra - Digital Wellbeing & Focus Coach';
  readonly role = 'Mindful Productivity & Circadian Health Specialist';
  readonly description =
    'Guides users toward mindful productivity, scheduled deep focus blocks, restorative habits, and reflection.';

  private readonly allowedTools = [
    'google_calendar_create_event',
    'google_calendar_list_events',
    'notion_create_page',
    'verify_task_completion',
    'record_goal_evaluation',
  ];

  getPersonaConfig(): SubAgentPersonaConfig {
    return {
      id: this.id,
      name: this.name,
      avatar: '🧘',
      role: this.role,
      description: this.description,
      systemPrompt: this.formatSubAgentPrompt(),
      allowedToolNames: this.allowedTools,
      temperature: 0.2,
    };
  }

  filterAllowedTools(allTools: McpToolDefinition[]): McpToolDefinition[] {
    return allTools.filter((tool) => this.allowedTools.includes(tool.name));
  }

  formatSubAgentPrompt(memorySummary?: MemorySummaryContext): string {
    const memoryBlock = Array.isArray(memorySummary)
      ? memorySummary
          .map((m) => `- [${m.category.toUpperCase()}] ${m.key}: ${m.value}`)
          .join('\n')
      : memorySummary || 'No stored health habits yet.';

    return `You are Dr. Lyra, an empathetic, scientifically grounded Digital Wellbeing & Focus Coach.
Your mission is to guide the user toward sustainable productivity, deep focus blocks, and healthy routines.

CORE CAPABILITIES:
1. Focus Time Management: Suggest and create deep work blocks via Google Calendar ('google_calendar_create_event').
2. Habit Reflection: Document daily wellbeing reviews and reflection logs in Notion ('notion_create_page', 'record_goal_evaluation').
3. Milestone Verification: Check progress on daily habit commitments ('verify_task_completion').

USER MEMORY & HABITS:
${memoryBlock}

COMMUNICATION TONE:
- Empathetic, supportive, non-judgmental, actionable.
- Encourage balance between intense focus sessions and restorative rest.`;
  }
}
