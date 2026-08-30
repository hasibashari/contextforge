import { Injectable } from '@nestjs/common';
import {
  ISubAgent,
  SubAgentId,
  SubAgentPersonaConfig,
  MemorySummaryContext,
} from '../subagent.types';
import { McpToolDefinition } from '../../../mcp/core';

@Injectable()
export class SecondBrainSubAgent implements ISubAgent {
  readonly id: SubAgentId = 'second_brain';
  readonly name = 'Atlas - Second Brain & Knowledge Architect';
  readonly role = 'Zettelkasten Note Architect & Semantic Knowledge Curator';
  readonly description =
    'Organizes Obsidian vaults, structures atomic markdown notes, establishes bidirectional links, and performs semantic search.';

  private readonly allowedTools = [
    'obsidian_list_vault_notes',
    'obsidian_read_vault_note',
    'obsidian_create_vault_note',
    'obsidian_update_vault_note',
    'obsidian_delete_vault_note',
    'obsidian_append_vault_note',
    'obsidian_search_vault_notes',
    'obsidian_get_active_note',
    'obsidian_list_vault_folders',
    'search_knowledge_vault',
    'web_search',
  ];

  getPersonaConfig(): SubAgentPersonaConfig {
    return {
      id: this.id,
      name: this.name,
      avatar: '📚',
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
        tool.name.startsWith('obsidian_'),
    );
  }

  formatSubAgentPrompt(
    memorySummary?: MemorySummaryContext,
    extraContext?: Record<string, unknown>,
  ): string {
    const memoryBlock = Array.isArray(memorySummary)
      ? memorySummary
          .map((m) => `- [${m.category.toUpperCase()}] ${m.key}: ${m.value}`)
          .join('\n')
      : memorySummary || 'No stored knowledge preferences yet.';

    const folders = (extraContext?.vaultFolders as string[]) || [];
    const folderList =
      folders.length > 0
        ? folders.map((f) => `- \`${f}\``).join('\n')
        : 'Default root directory';

    return `You are Atlas, the Second Brain & Knowledge Architect.
Your mission is to structure atomic, highly connected, and easily retrievable Markdown notes in Obsidian.

CORE PRINCIPLES:
1. Directory Alignment: Always inspect existing vault folders before saving notes.
Existing Folders:
${folderList}

2. Zettelkasten & Linking: Use [[Wikilinks]] for bidirectional cross-references.
3. Clean Frontmatter: Include YAML frontmatter with 'title', 'tags', 'created', 'type'.
4. Atomic Notes: Keep single concepts concise, clear, and well-categorized.

USER PREFERENCES:
${memoryBlock}

COMMUNICATION TONE:
- Methodical, structured, precise, and intellectually organized.`;
  }
}
