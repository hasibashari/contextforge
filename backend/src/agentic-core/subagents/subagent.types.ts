import { McpToolDefinition } from '../../mcp/core';

export type SubAgentId =
  | 'wellbeing_coach'
  | 'second_brain'
  | 'executive_scheduler'
  | 'research_specialist'
  | 'agent-research'
  | 'universal_orchestrator';

export type MemorySummaryContext =
  string | Array<{ category: string; key: string; value: string }>;

export interface SubAgentPersonaConfig {
  id: SubAgentId;
  name: string;
  avatar: string;
  role: string;
  description: string;
  systemPrompt: string;
  allowedToolNames: string[];
  temperature?: number;
  modelOverride?: string;
}

export interface ISubAgent {
  readonly id: SubAgentId;
  readonly name: string;
  readonly role: string;
  readonly description: string;
  getPersonaConfig(): SubAgentPersonaConfig;
  filterAllowedTools(allTools: McpToolDefinition[]): McpToolDefinition[];
  formatSubAgentPrompt(
    memorySummary?: MemorySummaryContext,
    extraContext?: Record<string, unknown>,
  ): string;
}
