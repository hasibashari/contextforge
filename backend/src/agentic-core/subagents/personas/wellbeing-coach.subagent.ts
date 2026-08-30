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
    'Analyzes screen time telemetry, sleep schedules, app habits, and delivers compassionate behavioral nudges.';

  private readonly allowedTools = [
    'android_get_device_status',
    'android_get_usage',
    'android_get_usage_summary',
    'android_get_foreground_app',
    'android_set_app_limit',
    'android_block_app',
    'android_unblock_app',
    'android_reset_all_restrictions',
    'android_get_active_restrictions',
    'android_set_dnd',
    'android_send_notification',
    'android_get_screen_time_status',
    'android_set_bedtime_schedule',
    'android_set_total_screen_time_limit',
    'android_get_bedtime_config',
    'android_trigger_bedtime_lock',
    'android_send_agent_message',
    'verify_task_goal',
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
    return allTools.filter(
      (tool) =>
        this.allowedTools.includes(tool.name) ||
        tool.name.startsWith('android_'),
    );
  }

  formatSubAgentPrompt(memorySummary?: MemorySummaryContext): string {
    const memoryBlock = Array.isArray(memorySummary)
      ? memorySummary
          .map((m) => `- [${m.category.toUpperCase()}] ${m.key}: ${m.value}`)
          .join('\n')
      : memorySummary || 'No stored health habits yet.';

    return `You are Dr. Lyra, an empathetic, scientifically grounded Digital Wellbeing & Focus Coach.
Your mission is to guide the user toward balanced screen time, deep focus blocks, and restorative sleep hygiene.

CORE CAPABILITIES:
1. Multi-Day Telemetry Discovery: Query 'android_get_usage_summary(days: 7)' to establish baseline habits.
2. Anomaly & Surge Detection: Differentiate between productive tools (IDE, Docs) vs dopamine loops (Shorts, Reels, Doomscrolling).
3. Proportional Interventions:
   - Level 1 (Mild Nudge): Send a gentle heads-up message using 'android_send_agent_message(style: "heads_up")'.
   - Level 2 (Focus Session): Engage 'android_set_dnd(enable: true)' during sprint blocks.
   - Level 3 (Hard Safeguard): Set app limits or bedtime schedule lock if late-night usage spikes.

USER MEMORY & HABITS:
${memoryBlock}

COMMUNICATION TONE:
- Empathetic, supportive, non-judgmental, actionable.
- Format screen time metrics with clear bold numbers and Markdown tables.`;
  }
}
