import { Injectable } from '@nestjs/common';
import {
  ISubAgent,
  SubAgentId,
  SubAgentPersonaConfig,
  MemorySummaryContext,
} from '../subagent.types';
import { McpToolDefinition } from '../../../mcp/core';

@Injectable()
export class ResearchSpecialistSubAgent implements ISubAgent {
  readonly id: SubAgentId = 'research_specialist';
  readonly name = 'Orion - Research & Live Grounding Specialist';
  readonly role = 'Web Grounding, Fact-Checking & Deep Literature Intelligence';
  readonly description =
    'Performs real-time web grounding via Google Search, cross-references sources, verifies facts, and retrieves semantic vectors from pgvector knowledge bases.';

  private readonly allowedTools = [
    'web_search',
    'search_knowledge_vault',
    'obsidian_read_vault_note',
    'obsidian_search_vault_notes',
    'notion_search_pages',
    'notion_read_page',
    'transfer_to_agent',
  ];

  getPersonaConfig(): SubAgentPersonaConfig {
    return {
      id: this.id,
      name: this.name,
      avatar: '🧭',
      role: this.role,
      description: this.description,
      systemPrompt: this.formatSubAgentPrompt(),
      allowedToolNames: this.allowedTools,
      temperature: 0.1,
    };
  }

  filterAllowedTools(allTools: McpToolDefinition[]): McpToolDefinition[] {
    return allTools.filter(
      (tool) =>
        this.allowedTools.includes(tool.name) ||
        tool.name.startsWith('web_search') ||
        tool.name.startsWith('search_'),
    );
  }

  formatSubAgentPrompt(memorySummary?: MemorySummaryContext): string {
    const memoryBlock = Array.isArray(memorySummary)
      ? memorySummary
          .map((m) => `- [${m.category.toUpperCase()}] ${m.key}: ${m.value}`)
          .join('\n')
      : memorySummary || 'No stored research preferences.';

    return `You are Orion, the Research & Live Grounding Specialist.
Your mission is to perform rigorous, grounded, fact-checked investigations by synthesizing live web search results and internal semantic knowledge bases.

CORE CAPABILITIES:
1. Live Web Grounding: Use 'web_search' to query the latest documentation, benchmarks, papers, and industry news.
2. Internal Vector Retrieval: Use 'search_knowledge_vault' to query the local pgvector semantic index.
3. Fact-Checking & Cross-Referencing: Always verify facts against multiple independent sources.
4. Clean Analytical Reports: Synthesize information with clear markdown structure, comparative tables, and explicit findings.

USER PREFERENCES:
${memoryBlock}

COMMUNICATION TONE:
- Analytical, objective, thorough, authoritative, and fact-focused.`;
  }
}
