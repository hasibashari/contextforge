import type { FunctionDeclaration, Schema, Type } from '@google/genai';

const strProp = (description: string): Schema => ({
  type: 'STRING' as unknown as Type,
  description,
});

const boolProp = (description: string): Schema => ({
  type: 'BOOLEAN' as unknown as Type,
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
  obsidian_get_vault_info: {
    name: 'obsidian_get_vault_info',
    category: 'mcp_obsidian',
    readOnly: true,
    serverName: 'Obsidian MCP Server',
    description:
      'Discovers active vault name, mounted status, and scope via Browser Bridge.',
  },
  obsidian_list_folders: {
    name: 'obsidian_list_folders',
    category: 'mcp_obsidian',
    readOnly: true,
    serverName: 'Obsidian MCP Server',
    description:
      'Inspects directory folder hierarchy in the connected Obsidian Vault.',
  },
  obsidian_find_folder: {
    name: 'obsidian_find_folder',
    category: 'mcp_obsidian',
    readOnly: true,
    serverName: 'Obsidian MCP Server',
    description:
      'Searches for existing vault folders matching a keyword or topic.',
  },
  obsidian_create_folder: {
    name: 'obsidian_create_folder',
    category: 'mcp_obsidian',
    readOnly: false,
    serverName: 'Obsidian MCP Server',
    description:
      'Explicitly creates a directory or subfolder path in the vault.',
  },
  obsidian_list_files: {
    name: 'obsidian_list_files',
    category: 'mcp_obsidian',
    readOnly: true,
    serverName: 'Obsidian MCP Server',
    description: 'Lists files inside a specified vault directory.',
  },
  obsidian_search_files: {
    name: 'obsidian_search_files',
    category: 'mcp_obsidian',
    readOnly: true,
    serverName: 'Obsidian MCP Server',
    description:
      'Searches for notes in the vault by filename, title, or content.',
  },
  obsidian_read_note: {
    name: 'obsidian_read_note',
    category: 'mcp_obsidian',
    readOnly: true,
    serverName: 'Obsidian MCP Server',
    description: 'Reads note contents and structure from the connected vault.',
  },
  obsidian_write_note: {
    name: 'obsidian_write_note',
    category: 'mcp_obsidian',
    readOnly: false,
    serverName: 'Obsidian MCP Server',
    description:
      'Writes or updates a structured Markdown document with frontmatter and backlinks.',
  },
  obsidian_create_daily_note: {
    name: 'obsidian_create_daily_note',
    category: 'mcp_obsidian',
    readOnly: false,
    serverName: 'Obsidian MCP Server',
    description:
      'Creates or appends a timestamped log entry to the daily note.',
  },
  obsidian_delete_file: {
    name: 'obsidian_delete_file',
    category: 'mcp_obsidian',
    readOnly: false,
    serverName: 'Obsidian MCP Server',
    description: 'Safely removes a note/file from the Obsidian Vault.',
  },
  obsidian_move_file: {
    name: 'obsidian_move_file',
    category: 'mcp_obsidian',
    readOnly: false,
    serverName: 'Obsidian MCP Server',
    description: 'Moves or renames a note/file in the Obsidian Vault.',
  },
  obsidian_search_backlinks: {
    name: 'obsidian_search_backlinks',
    category: 'mcp_obsidian',
    readOnly: true,
    serverName: 'Obsidian MCP Server',
    description:
      'Extracts bi-directional link graphs and wikilink references for a note.',
  },
  notion_list_workspace_resources: {
    name: 'notion_list_workspace_resources',
    category: 'mcp_notion',
    readOnly: true,
    serverName: 'Notion MCP Server',
    description:
      'Discovers and inventories all accessible Notion pages, child pages, and databases across the connected workspace. Use this when the user asks for a complete list, overview, or inventory of Notion resources.',
  },
  notion_get_tasks: {
    name: 'notion_get_tasks',
    category: 'mcp_notion',
    readOnly: true,
    serverName: 'Notion MCP Server',
    description:
      'Queries active tasks, action items, to-do lists, and Kanban board statuses from connected Notion workspace. Use this directly when asked about tasks, deadlines, or project boards.',
  },
  notion_search: {
    name: 'notion_search',
    category: 'mcp_notion',
    readOnly: true,
    serverName: 'Notion MCP Server',
    description:
      'Searches document pages, meeting notes, and knowledge wikis in Notion. For tasks and to-dos, use notion_get_tasks directly.',
  },
  notion_read_page: {
    name: 'notion_read_page',
    category: 'mcp_notion',
    readOnly: true,
    serverName: 'Notion MCP Server',
    description:
      'Reads structured markdown content, properties, and block hierarchy from a Notion page by its UUID.',
  },
  notion_create_page: {
    name: 'notion_create_page',
    category: 'mcp_notion',
    readOnly: false,
    serverName: 'Notion MCP Server',
    description:
      'Creates a new child page or database entry in Notion with markdown content.',
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
    name: 'obsidian_get_vault_info',
    description:
      'MCP Obsidian Protocol: Discovers the active Obsidian vault name, connection state, and folder scope via Browser Bridge.',
    parameters: {
      type: 'OBJECT' as unknown as Type,
      properties: {},
    },
  },
  {
    name: 'obsidian_list_folders',
    description:
      'MCP Obsidian Protocol: Inspects the real-time directory structure and existing folder names in the Obsidian Vault. Call this to inspect existing folders before creating or organizing notes.',
    parameters: {
      type: 'OBJECT' as unknown as Type,
      properties: {
        path: strProp(
          'Optional vault-relative subfolder path e.g. "Projects" or "Work". Leave empty for root.',
        ),
        recursive: boolProp(
          'Whether to inspect nested subdirectories recursively (defaults to false)',
        ),
      },
    },
  },
  {
    name: 'obsidian_find_folder',
    description:
      'MCP Obsidian Protocol: Searches for folders in the vault matching a query keyword or topic.',
    parameters: {
      type: 'OBJECT' as unknown as Type,
      properties: {
        query: strProp('Keyword or topic name to search for among folders'),
      },
      required: ['query'],
    },
  },
  {
    name: 'obsidian_create_folder',
    description:
      'MCP Obsidian Protocol: Explicitly creates a new directory or nested folder in the Obsidian Vault.',
    parameters: {
      type: 'OBJECT' as unknown as Type,
      properties: {
        path: strProp(
          'Vault-relative directory path to create, e.g. "Projects/Project Alpha"',
        ),
      },
      required: ['path'],
    },
  },
  {
    name: 'obsidian_list_files',
    description:
      'MCP Obsidian Protocol: Lists notes and files inside a vault folder.',
    parameters: {
      type: 'OBJECT' as unknown as Type,
      properties: {
        folderPath: strProp(
          'Vault-relative folder path, e.g. "Projects". Leave empty for vault root.',
        ),
        extension: strProp('Optional file extension filter, e.g. ".md"'),
        recursive: boolProp(
          'Whether to list files recursively in all subdirectories',
        ),
      },
    },
  },
  {
    name: 'obsidian_search_files',
    description:
      'MCP Obsidian Protocol: Searches notes in the vault by title, filename, or text content.',
    parameters: {
      type: 'OBJECT' as unknown as Type,
      properties: {
        query: strProp(
          'Search keyword, title, or topic to find in vault notes',
        ),
        folderPath: strProp('Optional subfolder path to restrict search scope'),
      },
      required: ['query'],
    },
  },
  {
    name: 'obsidian_read_note',
    description:
      'MCP Obsidian Protocol: Reads note contents, headings, and frontmatter from the Obsidian vault using a vault-relative path.',
    parameters: {
      type: 'OBJECT' as unknown as Type,
      properties: {
        path: strProp(
          'Vault-relative path to the note file, e.g. "Projects/Project Alpha/architecture.md"',
        ),
      },
      required: ['path'],
    },
  },
  {
    name: 'obsidian_write_note',
    description:
      'MCP Obsidian Protocol: Writes or updates a Markdown document with YAML frontmatter, headings, and [[backlinks]] in the local Obsidian vault via Browser Bridge. Automatically creates missing parent directories.',
    parameters: {
      type: 'OBJECT' as unknown as Type,
      properties: {
        title: strProp('Title of the markdown document'),
        path: strProp(
          'Target vault-relative file path, e.g. "Projects/Active/architecture.md"',
        ),
        content: strProp(
          'Complete formatted markdown content including YAML frontmatter and [[backlinks]]',
        ),
        createMissingFolders: boolProp(
          'Whether to automatically create missing parent directories (defaults to true)',
        ),
      },
      required: ['title', 'content'],
    },
  },
  {
    name: 'obsidian_create_daily_note',
    description:
      'MCP Obsidian Protocol: Creates or appends a timestamped log entry to the daily note in the Obsidian vault.',
    parameters: {
      type: 'OBJECT' as unknown as Type,
      properties: {
        section: strProp(
          'Section title, e.g. "Meeting Notes" or "Engineering Log"',
        ),
        text: strProp('Markdown log content to append to the daily note'),
        date: strProp(
          'Optional ISO date string (YYYY-MM-DD), defaults to today',
        ),
      },
      required: ['text'],
    },
  },
  {
    name: 'obsidian_delete_file',
    description:
      'MCP Obsidian Protocol: Safely deletes a file from the Obsidian vault.',
    parameters: {
      type: 'OBJECT' as unknown as Type,
      properties: {
        path: strProp('Vault-relative path of the file to delete'),
      },
      required: ['path'],
    },
  },
  {
    name: 'obsidian_move_file',
    description:
      'MCP Obsidian Protocol: Moves or renames a note/file in the Obsidian vault to a new destination path.',
    parameters: {
      type: 'OBJECT' as unknown as Type,
      properties: {
        sourcePath: strProp('Source vault-relative path'),
        targetPath: strProp('Destination vault-relative path'),
        overwrite: boolProp('Whether to overwrite destination file if exists'),
      },
      required: ['sourcePath', 'targetPath'],
    },
  },
  {
    name: 'obsidian_search_backlinks',
    description:
      'MCP Obsidian Protocol: Finds incoming backlinks and references pointing to a target note.',
    parameters: {
      type: 'OBJECT' as unknown as Type,
      properties: {
        targetNote: strProp('Target note name to find incoming links for'),
      },
      required: ['targetNote'],
    },
  },
  {
    name: 'notion_list_workspace_resources',
    description:
      'MCP Notion Protocol: Discovers and inventories all accessible Notion pages, child pages, and databases across the connected workspace with full pagination traversal. Use this when the user asks for a complete list, overview, or inventory of what is stored in Notion.',
    parameters: {
      type: 'OBJECT' as unknown as Type,
      properties: {
        filterType: strProp(
          'Optional resource type filter: "all", "page", or "database" (defaults to "all")',
        ),
      },
    },
  },
  {
    name: 'notion_get_tasks',
    description:
      'MCP Notion Protocol: Queries active tasks, action items, to-do lists, and Kanban board statuses from connected Notion workspace. Use directly when the user asks about tasks, backlog, or project board items.',
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
      'MCP Notion Protocol: Searches across connected Notion document pages, wikis, and meeting notes by specific keyword or topic.',
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
    name: 'notion_read_page',
    description:
      'MCP Notion Protocol: Reads structured markdown content, properties, and block hierarchy from a Notion page by its UUID or Page ID.',
    parameters: {
      type: 'OBJECT' as unknown as Type,
      properties: {
        pageId: strProp('The 32-character Notion Page ID or UUID'),
      },
      required: ['pageId'],
    },
  },
  {
    name: 'notion_create_page',
    description:
      'MCP Notion Protocol: Creates a new child page or document in Notion with title and markdown content.',
    parameters: {
      type: 'OBJECT' as unknown as Type,
      properties: {
        title: strProp('Title of the new Notion page'),
        content: strProp('Markdown text content of the page'),
        parentId: strProp('Optional parent Notion page ID'),
      },
      required: ['title'],
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
