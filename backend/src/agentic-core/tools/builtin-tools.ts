import type { FunctionDeclaration, Schema, Type } from '@google/genai';

const strProp = (description: string): Schema => ({
  type: 'STRING' as unknown as Type,
  description,
});

const arrayProp = (description: string): Schema => ({
  type: 'ARRAY' as unknown as Type,
  description,
  items: { type: 'STRING' as unknown as Type },
});

export const BUILTIN_FUNCTION_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: 'dispatch_action_worker',
    description:
      'Delegates markdown note creation, formatting, and file synchronization to the Action Agent (supports local Obsidian Vaults and Notion workspaces).',
    parameters: {
      type: 'OBJECT' as unknown as Type,
      properties: {
        title: strProp('Title of the markdown document'),
        target: strProp(
          'Target workspace destination: "obsidian" (default) or "notion"',
        ),
        path: strProp(
          'Relative vault file path, e.g. Vault/Work/Notes/system-architecture.md',
        ),
        content: strProp(
          'Complete formatted markdown content including YAML frontmatter, headers, and bi-directional [[backlinks]]',
        ),
      },
      required: ['title', 'content'],
    },
  },
  {
    name: 'create_scheduled_automation',
    description:
      'Registers an autonomous background automation rule with cron schedule trigger and assigned MCP tools (e.g. daily morning Notion tasks check at 08:00 AM, periodic Obsidian sync, PR audits).',
    parameters: {
      type: 'OBJECT' as unknown as Type,
      properties: {
        name: strProp('Descriptive workflow name, e.g. "Daily Notion Tasks Briefing"'),
        description: strProp('Short description of what the background automation executes'),
        schedule_cron: strProp('Standard 5-field cron expression, e.g. "0 8 * * *" for 08:00 AM daily'),
        schedule_label: strProp('Human-readable schedule string, e.g. "Every day at 08:00 AM"'),
        mcp_server_id: strProp('Target MCP Server identifier, e.g. "int-notion-mcp" or "int-obsidian-vault-mcp"'),
        mcp_tools: arrayProp('Array of tool names to execute, e.g. ["notion_get_tasks", "notion_read_page"]'),
        prompt_template: strProp('Instruction prompt template sent to the agent when triggered'),
      },
      required: ['name', 'schedule_cron', 'mcp_server_id'],
    },
  },
  {
    name: 'query_notion_workspace',
    description:
      'Instant Chat Task: Queries active Notion tasks, database boards, or pages using Notion MCP protocol.',
    parameters: {
      type: 'OBJECT' as unknown as Type,
      properties: {
        query: strProp('Search keyword or filter criteria for Notion tasks'),
        filter: strProp('Status filter e.g. "active", "in_progress", "all"'),
      },
    },
  },
  {
    name: 'web_search',
    description:
      'Performs live web research and factual grounding via the Research Agent to fetch up-to-date documentation and technical facts.',
    parameters: {
      type: 'OBJECT' as unknown as Type,
      properties: {
        query: strProp('Search query keywords or research topic'),
      },
      required: ['query'],
    },
  },
  {
    name: 'search_knowledge_vault',
    description:
      'Searches internal knowledge base, indexed documents, specifications, and notes via the Research Agent using semantic vector similarity (pgvector RAG).',
    parameters: {
      type: 'OBJECT' as unknown as Type,
      properties: {
        query: strProp(
          'Semantic search query or topic to look up in internal knowledge base',
        ),
      },
      required: ['query'],
    },
  },
];
