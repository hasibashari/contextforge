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

export interface ToolMetadata {
  name: string;
  category:
    | 'mcp_obsidian'
    | 'mcp_notion'
    | 'internal_rag'
    | 'web_search'
    | 'automation';
  readOnly: boolean;
  serverName: string;
  description: string;
}

export const TOOL_CATALOG: Record<string, ToolMetadata> = {
  obsidian_write_note: {
    name: 'obsidian_write_note',
    category: 'mcp_obsidian',
    readOnly: false,
    serverName: 'Obsidian MCP Server',
    description:
      'Writes a structured Markdown document with frontmatter and backlinks to local Obsidian Vault.',
  },
  obsidian_create_daily_note: {
    name: 'obsidian_create_daily_note',
    category: 'mcp_obsidian',
    readOnly: false,
    serverName: 'Obsidian MCP Server',
    description:
      'Creates an atomic Daily Note for today in the DailyNotes folder of Obsidian Vault.',
  },
  obsidian_read_note: {
    name: 'obsidian_read_note',
    category: 'mcp_obsidian',
    readOnly: true,
    serverName: 'Obsidian MCP Server',
    description: 'Reads note contents and queries backlinks in Obsidian Vault.',
  },
  obsidian_list_folders: {
    name: 'obsidian_list_folders',
    category: 'mcp_obsidian',
    readOnly: true,
    serverName: 'Obsidian MCP Server',
    description:
      'Scans and returns existing folder paths in the Obsidian Vault so notes can be organized into matching existing folders.',
  },
  notion_get_tasks: {
    name: 'notion_get_tasks',
    category: 'mcp_notion',
    readOnly: true,
    serverName: 'Notion MCP Server',
    description:
      'Queries tasks, project items, and status boards from connected Notion workspace.',
  },
  notion_search: {
    name: 'notion_search',
    category: 'mcp_notion',
    readOnly: true,
    serverName: 'Notion MCP Server',
    description:
      'Performs semantic search across connected Notion database pages and blocks.',
  },
  search_knowledge_vault: {
    name: 'search_knowledge_vault',
    category: 'internal_rag',
    readOnly: true,
    serverName: 'PostgreSQL pgvector RAG',
    description:
      'Searches internal knowledge base, specifications, and uploaded documents using vector embeddings.',
  },
  web_search: {
    name: 'web_search',
    category: 'web_search',
    readOnly: true,
    serverName: 'Google Search Grounding',
    description:
      'Fetches live technical documentation and factual grounding from the web.',
  },
  create_scheduled_automation: {
    name: 'create_scheduled_automation',
    category: 'automation',
    readOnly: false,
    serverName: 'ContextForge Automation Scheduler',
    description:
      'Registers a background automation workflow triggered by cron schedule.',
  },
  transfer_to_agent: {
    name: 'transfer_to_agent',
    category: 'internal_rag',
    readOnly: true,
    serverName: 'ContextForge Multi-Agent Router',
    description:
      'Delegates conversational context or a specialized sub-task to another agent persona (e.g. Research Specialist or Action Worker).',
  },
};

export const BUILTIN_FUNCTION_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: 'transfer_to_agent',
    description:
      'Multi-Agent Handoff: Delegates the current goal, deep research investigation, or document execution task to a specialized agent persona.',
    parameters: {
      type: 'OBJECT' as unknown as Type,
      properties: {
        target_agent_id: strProp(
          'Target agent identifier: "agent-research" (for deep technical literature, source verification & web grounding), or "agent-personal-assistant"',
        ),
        sub_task: strProp(
          'Specific sub-task or question delegated to the target specialist',
        ),
        reason: strProp(
          'Brief reasoning why this specialist persona is needed',
        ),
      },
      required: ['target_agent_id', 'sub_task'],
    },
  },
  {
    name: 'obsidian_write_note',
    description:
      'MCP Obsidian Protocol: Writes or updates a Markdown document with YAML frontmatter, headings, and [[backlinks]] in the local Obsidian vault.',
    parameters: {
      type: 'OBJECT' as unknown as Type,
      properties: {
        title: strProp('Title of the markdown document'),
        path: strProp(
          'Target relative vault file path, e.g. Work/Notes/system-architecture.md',
        ),
        content: strProp(
          'Complete formatted markdown content including YAML frontmatter and [[backlinks]]',
        ),
      },
      required: ['title', 'content'],
    },
  },
  {
    name: 'obsidian_create_daily_note',
    description:
      'MCP Obsidian Protocol: Creates or appends to a daily note for a given date in the Obsidian vault.',
    parameters: {
      type: 'OBJECT' as unknown as Type,
      properties: {
        date: strProp('ISO date string (YYYY-MM-DD), defaults to today'),
        content: strProp('Markdown content for the daily note'),
      },
    },
  },
  {
    name: 'obsidian_read_note',
    description:
      'MCP Obsidian Protocol: Reads note contents or index from the Obsidian vault.',
    parameters: {
      type: 'OBJECT' as unknown as Type,
      properties: {
        path: strProp('Relative path to the note file in the vault'),
      },
    },
  },
  {
    name: 'obsidian_list_folders',
    description:
      'MCP Obsidian Protocol: Inspects the real-time directory structure and existing folder names in the Obsidian Vault. Call this to choose an existing folder before writing a note.',
    parameters: {
      type: 'OBJECT' as unknown as Type,
      properties: {},
    },
  },
  {
    name: 'notion_get_tasks',
    description:
      'MCP Notion Protocol: Queries tasks, action items, and project board statuses from connected Notion workspace.',
    parameters: {
      type: 'OBJECT' as unknown as Type,
      properties: {
        query: strProp('Optional filter keyword for tasks'),
        status: strProp(
          'Filter by task status e.g. "active", "in_progress", "all"',
        ),
      },
    },
  },
  {
    name: 'notion_search',
    description:
      'MCP Notion Protocol: Searches across connected Notion database pages and blocks.',
    parameters: {
      type: 'OBJECT' as unknown as Type,
      properties: {
        query: strProp(
          'Search keyword or question to find in Notion workspace',
        ),
      },
      required: ['query'],
    },
  },
  {
    name: 'search_knowledge_vault',
    description:
      'Internal Vector RAG: Searches indexed workspace documents and technical files using semantic vector similarity (pgvector).',
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
  {
    name: 'web_search',
    description:
      'Web Grounding: Performs live web research to retrieve up-to-date documentation and external facts.',
    parameters: {
      type: 'OBJECT' as unknown as Type,
      properties: {
        query: strProp('Search query keywords or research topic'),
      },
      required: ['query'],
    },
  },
  {
    name: 'create_scheduled_automation',
    description:
      'Automation Scheduler: Registers an autonomous background automation rule with cron schedule trigger and assigned MCP tools.',
    parameters: {
      type: 'OBJECT' as unknown as Type,
      properties: {
        name: strProp(
          'Descriptive workflow name, e.g. "Daily Notion Tasks Briefing"',
        ),
        description: strProp(
          'Short description of what the background automation executes',
        ),
        schedule_cron: strProp(
          'Standard 5-field cron expression, e.g. "0 8 * * *" for 08:00 AM daily',
        ),
        schedule_label: strProp(
          'Human-readable schedule string, e.g. "Every day at 08:00 AM"',
        ),
        mcp_server_id: strProp(
          'Target MCP Server identifier, e.g. "int-notion-mcp" or "int-obsidian-vault-mcp"',
        ),
        mcp_tools: arrayProp(
          'Array of tool names to execute, e.g. ["notion_get_tasks", "obsidian_create_daily_note"]',
        ),
        prompt_template: strProp(
          'Instruction prompt template sent to the agent when triggered',
        ),
      },
      required: ['name', 'schedule_cron', 'mcp_server_id'],
    },
  },
];
