import { McpToolDefinition } from '../../core';

/**
 * Declarative Tool Definitions for the Notion Remote MCP Server
 */
export const NOTION_MCP_TOOLS: McpToolDefinition[] = [
  {
    id: 't-notion-0',
    name: 'notion_list_workspace_resources',
    description:
      'Discovers and inventories all accessible Notion pages, child pages, and databases across the connected workspace with full pagination traversal. Use this when the user asks for a complete list, overview, or inventory of Notion resources.',
    parametersSchema: {
      type: 'object',
      properties: {
        filterType: {
          type: 'string',
          description:
            'Optional filter: "all", "page", or "database" (defaults to "all")',
        },
      },
    },
    readOnly: true,
  },
  {
    id: 't-notion-1',
    name: 'notion_search',
    description:
      'Searches document pages, meeting notes, and knowledge wikis in Notion. For tasks and to-dos, use notion_get_tasks directly.',
    parametersSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search keyword or title to find in Notion',
        },
      },
      required: ['query'],
    },
    readOnly: true,
  },
  {
    id: 't-notion-2',
    name: 'notion_get_tasks',
    description:
      'Queries active tasks, action items, to-do lists, and Kanban board statuses from Notion databases. Use this directly when asked about tasks, deadlines, or project boards.',
    parametersSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description:
            'Optional task status filter: "all", "in_progress", "todo", "done"',
        },
        query: {
          type: 'string',
          description: 'Optional filter query for task titles',
        },
      },
    },
    readOnly: true,
  },
  {
    id: 't-notion-3',
    name: 'notion_read_page',
    description:
      'Reads structured markdown content, properties, and block hierarchy from a Notion page by its UUID or Page ID.',
    parametersSchema: {
      type: 'object',
      properties: {
        pageId: {
          type: 'string',
          description: 'The 32-character Notion Page ID or UUID',
        },
      },
      required: ['pageId'],
    },
    readOnly: true,
  },
  {
    id: 't-notion-4',
    name: 'notion_create_page',
    description:
      'Creates a new child page or document in Notion with title and markdown content.',
    parametersSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Title of the new page' },
        content: {
          type: 'string',
          description: 'Markdown text content of the page',
        },
        parentId: {
          type: 'string',
          description:
            'Optional parent Notion page or database ID. If omitted, creates at authorized workspace root.',
        },
      },
      required: ['title'],
    },
    readOnly: false,
  },
  {
    id: 't-notion-5',
    name: 'notion_update_page',
    description:
      'Updates an existing Notion page or note. Supports updating title, appending or replacing markdown content blocks, updating database properties, and archiving notes.',
    parametersSchema: {
      type: 'object',
      properties: {
        pageId: {
          type: 'string',
          description: 'The 32-character Notion Page ID or UUID to update',
        },
        title: {
          type: 'string',
          description: 'Optional updated title for the page',
        },
        content: {
          type: 'string',
          description: 'Optional markdown text content to append or replace',
        },
        mode: {
          type: 'string',
          enum: ['append', 'replace'],
          description:
            'Content insertion mode: "append" (default, adds blocks to the bottom of the page) or "replace" (removes existing content blocks and writes new content)',
        },
        properties: {
          type: 'object',
          description:
            'Optional custom properties object for database entries (e.g. {"Status": "Done"})',
        },
        archived: {
          type: 'boolean',
          description:
            'Optional boolean flag to archive (trash) or unarchive the page',
        },
      },
      required: ['pageId'],
    },
    readOnly: false,
  },
];
