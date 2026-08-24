import { McpToolDefinition } from '../../mcp.types';

/**
 * Declarative Tool Definitions for the Obsidian Vault Internal MCP Server
 */
export const OBSIDIAN_MCP_TOOLS: McpToolDefinition[] = [
  {
    id: 't-obsidian-get-vault-info',
    name: 'obsidian_get_vault_info',
    description:
      'Discovers the currently connected Obsidian Vault, connection health, and active subfolder scope over the Browser Bridge.',
    parametersSchema: {
      type: 'object',
      properties: {},
    },
    readOnly: true,
  },
  {
    id: 't-obsidian-list-folders',
    name: 'obsidian_list_folders',
    description:
      'Inspects directory folder hierarchy in the connected Obsidian Vault. Specify a relative path to inspect subdirectories, or leave empty for root.',
    parametersSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description:
            'Optional vault-relative subfolder path e.g. "Projects" or "Work/Notes". Defaults to root.',
        },
        recursive: {
          type: 'boolean',
          description: 'Whether to recursively inspect nested subfolders.',
        },
      },
    },
    readOnly: true,
  },
  {
    id: 't-obsidian-find-folder',
    name: 'obsidian_find_folder',
    description:
      'Searches for existing vault folders matching a keyword or phrase to determine the best destination for a note.',
    parametersSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Folder name or topic keyword to search for',
        },
      },
      required: ['query'],
    },
    readOnly: true,
  },
  {
    id: 't-obsidian-create-folder',
    name: 'obsidian_create_folder',
    description:
      'Explicitly creates a new directory or nested folder path in the Obsidian Vault.',
    parametersSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description:
            'Vault-relative directory path to create, e.g. "Projects/ContextForge"',
        },
      },
      required: ['path'],
    },
    readOnly: false,
  },
  {
    id: 't-obsidian-list-files',
    name: 'obsidian_list_files',
    description:
      'Lists files within a specified vault folder, with optional file extension filter.',
    parametersSchema: {
      type: 'object',
      properties: {
        folderPath: {
          type: 'string',
          description:
            'Vault-relative folder path to inspect, e.g. "Projects". Empty for root.',
        },
        extension: {
          type: 'string',
          description: 'Optional file extension filter, e.g. ".md"',
        },
        recursive: {
          type: 'boolean',
          description: 'Whether to list files recursively in subfolders.',
        },
      },
    },
    readOnly: true,
  },
  {
    id: 't-obsidian-search-files',
    name: 'obsidian_search_files',
    description:
      'Searches for notes across the Obsidian Vault by title, file name, or text content.',
    parametersSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search keyword or question to find in vault notes',
        },
        folderPath: {
          type: 'string',
          description: 'Optional folder path to narrow search scope',
        },
      },
      required: ['query'],
    },
    readOnly: true,
  },
  {
    id: 't-obsidian-read-note',
    name: 'obsidian_read_note',
    description:
      'Reads markdown note contents and frontmatter from the connected Obsidian Vault using a vault-relative path.',
    parametersSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description:
            'Vault-relative file path e.g. "Projects/Project Alpha/architecture.md"',
        },
      },
      required: ['path'],
    },
    readOnly: true,
  },
  {
    id: 't-obsidian-write-note',
    name: 'obsidian_write_note',
    description:
      'Creates or updates a Markdown document with YAML frontmatter and bi-directional [[wikilinks]] inside the Obsidian Vault. Automatically creates missing parent folders.',
    parametersSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Document title for YAML frontmatter and note header',
        },
        path: {
          type: 'string',
          description:
            'Target vault-relative file path e.g. "Projects/Active/architecture.md"',
        },
        content: {
          type: 'string',
          description:
            'Complete Markdown content including headings, callouts, and [[wikilinks]]',
        },
        createMissingFolders: {
          type: 'boolean',
          description:
            'Automatically create parent directories if they do not exist (defaults to true).',
        },
      },
      required: ['title', 'content'],
    },
    readOnly: false,
  },
  {
    id: 't-obsidian-create-daily-note',
    name: 'obsidian_create_daily_note',
    description:
      'Creates or appends a timestamped log entry to the daily note in the Obsidian Vault.',
    parametersSchema: {
      type: 'object',
      properties: {
        section: {
          type: 'string',
          description:
            'Section heading name, e.g. "Meeting Notes" or "Log Activity"',
        },
        text: {
          type: 'string',
          description: 'Log entry or note body to append to daily note',
        },
        date: {
          type: 'string',
          description:
            'Optional ISO date string (YYYY-MM-DD), defaults to today',
        },
      },
      required: ['text'],
    },
    readOnly: false,
  },
  {
    id: 't-obsidian-delete-file',
    name: 'obsidian_delete_file',
    description:
      'Safely deletes a note or file from the connected Obsidian Vault.',
    parametersSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description:
            'Vault-relative file path to delete, e.g. "Temp/draft.md"',
        },
      },
      required: ['path'],
    },
    readOnly: false,
  },
  {
    id: 't-obsidian-move-file',
    name: 'obsidian_move_file',
    description:
      'Moves or renames a note/file in the Obsidian Vault to a new destination path.',
    parametersSchema: {
      type: 'object',
      properties: {
        sourcePath: {
          type: 'string',
          description: 'Existing vault-relative file path',
        },
        targetPath: {
          type: 'string',
          description: 'New destination vault-relative file path',
        },
        overwrite: {
          type: 'boolean',
          description: 'Whether to overwrite destination if it exists',
        },
      },
      required: ['sourcePath', 'targetPath'],
    },
    readOnly: false,
  },
  {
    id: 't-obsidian-search-backlinks',
    name: 'obsidian_search_backlinks',
    description:
      'Finds all incoming references and [[wikilinks]] pointing to a target note across the entire Obsidian Vault.',
    parametersSchema: {
      type: 'object',
      properties: {
        targetNote: {
          type: 'string',
          description: 'Target note name or title to search references for',
        },
      },
      required: ['targetNote'],
    },
    readOnly: true,
  },
];
