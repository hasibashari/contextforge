import { Injectable, Logger } from '@nestjs/common';
import { IMcpServer } from '../../interfaces/mcp-server.interface';
import { McpTransportType } from '../../interfaces/mcp-transport.types';
import {
  McpToolDefinition,
  McpToolCallResult,
} from '../../interfaces/mcp-tool.interface';
import { ObsidianVaultService } from './obsidian-vault.service';

@Injectable()
export class ObsidianMcpServer implements IMcpServer {
  private readonly logger = new Logger(ObsidianMcpServer.name);

  readonly id = 'int-obsidian-vault-mcp';
  readonly name = 'Obsidian Vault MCP Bridge';
  readonly category = 'knowledge';
  readonly transportType: McpTransportType = 'in_process';
  readonly isInternal = true;

  constructor(private readonly vaultService: ObsidianVaultService) {}

  getTools(): McpToolDefinition[] {
    return [
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
              description:
                'Document title for YAML frontmatter and note header',
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
  }

  hasTool(toolName: string): boolean {
    return (
      toolName.startsWith('obsidian_') ||
      toolName === 'dispatch_action_worker' ||
      toolName === 'dispatch_obsidian_worker'
    );
  }

  async executeTool(
    toolName: string,
    params: Record<string, unknown>,
  ): Promise<McpToolCallResult> {
    this.logger.log(
      `Executing Obsidian MCP tool: ${toolName} via Browser Bridge`,
    );

    switch (toolName) {
      case 'obsidian_get_vault_info': {
        const vaultInfo = await this.vaultService.getVaultInfo();
        const vaultName = (vaultInfo.vaultName as string) || 'Active Vault';
        const isLive = Boolean(vaultInfo.connected ?? true);
        return {
          success: true,
          server: this.name,
          toolName,
          data: vaultInfo,
          summary: `Obsidian Vault connected: "${vaultName}" (Bridge Live: ${String(isLive)}).`,
        };
      }

      case 'obsidian_list_folders': {
        const targetPath = (params.path as string) || '';
        const recursive = Boolean(params.recursive);
        const folders = await this.vaultService.getVaultFolders(
          targetPath,
          recursive,
        );

        return {
          success: true,
          server: this.name,
          toolName,
          data: { path: targetPath, folders, count: folders.length },
          summary: `Discovered ${folders.length} directories in Obsidian vault under "${targetPath || '/'}".`,
        };
      }

      case 'obsidian_find_folder': {
        const query = (params.query as string) || '';
        const folders = await this.vaultService.findFolder(query);

        return {
          success: true,
          server: this.name,
          toolName,
          data: { query, matchingFolders: folders },
          summary: `Found ${folders.length} folder(s) matching "${query}": [${folders.join(', ')}].`,
        };
      }

      case 'obsidian_create_folder': {
        const targetPath = (params.path as string) || '';
        const result = await this.vaultService.createFolder(targetPath);

        return {
          success: result.success,
          server: this.name,
          toolName,
          data: result,
          summary: `Folder "${targetPath}" created successfully in Obsidian vault.`,
          filesModified: [targetPath],
        };
      }

      case 'obsidian_list_files': {
        const folderPath = (params.folderPath as string) || '';
        const extension = (params.extension as string) || '';
        const recursive = Boolean(params.recursive);
        const files = await this.vaultService.listFiles(
          folderPath,
          extension,
          recursive,
        );

        return {
          success: true,
          server: this.name,
          toolName,
          data: { folderPath, files, count: files.length },
          summary: `Found ${files.length} file(s) in folder "${folderPath || '/'}".`,
        };
      }

      case 'obsidian_search_files': {
        const query = (params.query as string) || '';
        const folderPath = (params.folderPath as string) || '';
        const matches = await this.vaultService.searchFiles(query, folderPath);

        return {
          success: true,
          server: this.name,
          toolName,
          data: { query, matches, count: matches.length },
          summary: `Found ${matches.length} matching note(s) for query "${query}".`,
        };
      }

      case 'obsidian_read_note':
      case 'obsidian_vault_reader': {
        const targetPath =
          (params.path as string) || (params.target_resource as string) || '';
        const content = await this.vaultService.readNote(targetPath);

        if (content !== null) {
          return {
            success: true,
            server: this.name,
            toolName,
            data: { path: targetPath, content, found: true },
            summary: `Read note at "${targetPath}" (${content.length} characters).`,
          };
        }

        return {
          success: false,
          server: this.name,
          toolName,
          data: {
            path: targetPath,
            found: false,
            error: `Note at "${targetPath}" not found in connected Obsidian vault.`,
          },
          summary: `Note at "${targetPath}" not found in vault.`,
        };
      }

      case 'obsidian_write_note':
      case 'obsidian_vault_writer':
      case 'dispatch_action_worker':
      case 'dispatch_obsidian_worker': {
        const title =
          (params.title as string) ||
          (params.name as string) ||
          'Architecture Note';
        const rawContent =
          (params.content as string) ||
          (params.text as string) ||
          (params.summary as string) ||
          '# Note Content';
        const targetPath =
          (params.path as string) ||
          (params.target_resource as string) ||
          (params.filePath as string) ||
          `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;
        const createMissing =
          params.createMissingFolders !== undefined
            ? Boolean(params.createMissingFolders)
            : true;

        const writeResult = await this.vaultService.writeNote(
          title,
          targetPath,
          rawContent,
          params,
          createMissing,
        );

        return {
          success: true,
          server: this.name,
          toolName,
          data: writeResult as unknown as Record<string, unknown>,
          summary: `Note "${writeResult.title}" written to "${writeResult.relativePath}" (${writeResult.bytesWritten} bytes via Browser Bridge).`,
          filesModified: [writeResult.relativePath],
        };
      }

      case 'obsidian_create_daily_note': {
        const section = (params.section as string) || 'Log Activity';
        const text =
          (params.text as string) || (params.content as string) || '';
        const date = params.date as string | undefined;

        const writeResult = await this.vaultService.createDailyNote(
          section,
          text,
          date,
        );

        return {
          success: true,
          server: this.name,
          toolName,
          data: writeResult as unknown as Record<string, unknown>,
          summary: `Daily note updated at "${writeResult.relativePath}".`,
          filesModified: [writeResult.relativePath],
        };
      }

      case 'obsidian_delete_file': {
        const targetPath = (params.path as string) || '';
        const result = await this.vaultService.deleteFile(targetPath);

        return {
          success: result.success,
          server: this.name,
          toolName,
          data: result,
          summary: `File "${targetPath}" deleted from Obsidian vault.`,
          filesModified: [targetPath],
        };
      }

      case 'obsidian_move_file': {
        const sourcePath = (params.sourcePath as string) || '';
        const targetPath = (params.targetPath as string) || '';
        const overwrite = Boolean(params.overwrite);
        const result = await this.vaultService.moveFile(
          sourcePath,
          targetPath,
          overwrite,
        );

        return {
          success: result.success,
          server: this.name,
          toolName,
          data: result,
          summary: `Moved "${sourcePath}" to "${targetPath}" in Obsidian vault.`,
          filesModified: [sourcePath, targetPath],
        };
      }

      case 'obsidian_search_backlinks': {
        const targetNote = (params.targetNote as string) || '';
        const backlinks = await this.vaultService.searchBacklinks(targetNote);

        return {
          success: true,
          server: this.name,
          toolName,
          data: {
            targetNote,
            backlinks,
            count: backlinks.length,
          },
          summary: `Found ${backlinks.length} backlink reference(s) linked to [[${targetNote}]].`,
        };
      }

      default:
        return {
          success: false,
          server: this.name,
          toolName,
          data: {
            error: `Tool ${toolName} not supported by Obsidian MCP Server`,
          },
          summary: `Tool ${toolName} unrecognized.`,
        };
    }
  }

  async ping(): Promise<{
    status: 'connected' | 'disconnected' | 'error';
    message: string;
    latencyMs: number;
  }> {
    const startTime = Date.now();
    const probe = await this.vaultService.verifyPathAccess();
    const latencyMs = Math.max(5, Date.now() - startTime);

    return {
      status: probe.isAccessible ? 'connected' : 'disconnected',
      message: probe.reason || 'Obsidian Browser Bridge Status',
      latencyMs,
    };
  }
}
