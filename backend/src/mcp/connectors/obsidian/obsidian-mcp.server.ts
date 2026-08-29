import { Injectable } from '@nestjs/common';
import {
  McpTransportType,
  McpToolDefinition,
  McpToolCallResult,
  BaseMcpConnector,
} from '../../core';
import {
  ObsidianVaultService,
  VaultNoteResult,
} from './obsidian-vault.service';
import { OBSIDIAN_MCP_TOOLS } from './obsidian-tools.definition';

@Injectable()
export class ObsidianMcpServer extends BaseMcpConnector {
  readonly id = 'int-obsidian-vault-mcp';
  readonly name = 'Obsidian Vault MCP Bridge';
  readonly category = 'knowledge';
  readonly transportType: McpTransportType = 'in_process';
  readonly isInternal = true;

  constructor(private readonly vaultService: ObsidianVaultService) {
    super(ObsidianMcpServer.name);
  }

  getTools(): McpToolDefinition[] {
    return OBSIDIAN_MCP_TOOLS;
  }

  hasTool(toolName: string): boolean {
    return (
      OBSIDIAN_MCP_TOOLS.some((t) => t.name === toolName) ||
      toolName === 'dispatch_action_worker' ||
      toolName === 'dispatch_obsidian_worker'
    );
  }

  async executeTool(
    toolName: string,
    params: Record<string, unknown>,
  ): Promise<McpToolCallResult> {
    return this.safeExecute(toolName, async () => {
      switch (toolName) {
        case 'obsidian_get_vault_info': {
          const vaultInfo = await this.vaultService.getVaultInfo();
          const vaultName = (vaultInfo.vaultName as string) || 'Active Vault';
          const isLive = Boolean(vaultInfo.connected ?? true);
          return {
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
            data: { path: targetPath, folders, count: folders.length },
            summary: `Discovered ${folders.length} directories in Obsidian vault under "${targetPath || '/'}".`,
          };
        }

        case 'obsidian_find_folder': {
          const query = (params.query as string) || '';
          const folders = await this.vaultService.findFolder(query);

          return {
            data: { query, matchingFolders: folders },
            summary: `Found ${folders.length} folder(s) matching "${query}": [${folders.join(', ')}].`,
          };
        }

        case 'obsidian_create_folder': {
          const targetPath = (params.path as string) || '';
          const result = await this.vaultService.createFolder(targetPath);

          return {
            data: result,
            summary: `Folder "${targetPath}" created successfully in Obsidian vault.`,
            filesModified: [targetPath],
          };
        }

        case 'obsidian_list_files': {
          const folder = (params.folder as string) || '';
          const ext = params.extension as string | undefined;
          const files = await this.vaultService.listFiles(folder, ext);

          return {
            data: { folder, files, count: files.length },
            summary: `Listed ${files.length} file(s) in vault folder "${folder || '/'}".`,
          };
        }

        case 'obsidian_search_files': {
          const query = (params.query as string) || '';
          const folderPath = (params.folderPath as string) || '';
          const results = await this.vaultService.searchFiles(
            query,
            folderPath,
          );

          return {
            data: {
              query,
              matchCount: results.length,
              results,
            },
            summary: `Found ${results.length} item(s) matching query "${query}" in Obsidian vault.`,
          };
        }

        case 'obsidian_read_note': {
          const notePath =
            (params.path as string) || (params.relativePath as string) || '';
          if (!notePath) {
            throw new Error('Parameter "path" wajib disertakan.');
          }

          const content = await this.vaultService.readNote(notePath);
          if (content === null) {
            throw new Error(`Note not found at path: ${notePath}`);
          }

          return {
            data: {
              path: notePath,
              content,
              lineCount: content.split('\n').length,
            },
            summary: `Read note (${content.length} characters) from "${notePath}".`,
          };
        }

        case 'obsidian_create_note': {
          const notePath =
            (params.path as string) || (params.relativePath as string) || '';
          const title = (params.title as string) || 'Note';
          const content = (params.content as string) || '';
          const tags = Array.isArray(params.tags) ? params.tags : undefined;
          const preventOverwrite = Boolean(params.preventOverwrite);
          const createMissingFolders = params.createMissingFolders !== false;

          if (!notePath && !title) {
            throw new Error('Parameter "path" atau "title" wajib disertakan.');
          }

          const result: VaultNoteResult = await this.vaultService.createNote(
            title,
            notePath,
            content,
            { tags },
            preventOverwrite,
            createMissingFolders,
          );

          return {
            data: result as unknown as Record<string, unknown>,
            summary: `New note "${result.title}" created in Obsidian vault at "${result.relativePath}".`,
            filesModified: [result.relativePath],
          };
        }

        case 'obsidian_update_note': {
          const notePath =
            (params.path as string) || (params.relativePath as string) || '';
          const content = (params.content as string) || '';
          const mode = (params.mode as 'append' | 'replace') || 'append';
          const section = params.section as string | undefined;
          const title = params.title as string | undefined;

          if (!notePath) {
            throw new Error(
              'Parameter "path" wajib disertakan untuk update catatan.',
            );
          }
          if (!content) {
            throw new Error('Parameter "content" tidak boleh kosong.');
          }

          const result: VaultNoteResult = await this.vaultService.updateNote(
            notePath,
            content,
            {
              title,
              mode,
              section,
            },
          );

          return {
            data: result as unknown as Record<string, unknown>,
            summary: `Note at "${result.relativePath}" successfully updated (${mode === 'replace' ? 'content replaced' : 'content appended'}).`,
            filesModified: [result.relativePath],
          };
        }

        case 'dispatch_action_worker':
        case 'dispatch_obsidian_worker': {
          const notePath =
            (params.path as string) || (params.relativePath as string) || '';
          const title = (params.title as string) || 'Note';
          const content = (params.content as string) || '';
          const metadata = (params.metadata as Record<string, unknown>) || {};

          if (!notePath && !title) {
            throw new Error('Parameter "path" atau "title" wajib disertakan.');
          }

          const createResult: VaultNoteResult =
            await this.vaultService.createNote(
              title,
              notePath,
              content,
              metadata,
            );

          return {
            data: createResult as unknown as Record<string, unknown>,
            summary: `Note "${createResult.title}" successfully created in Obsidian vault at "${createResult.relativePath}".`,
            filesModified: [createResult.relativePath],
          };
        }

        case 'obsidian_create_daily_note': {
          const section = (params.section as string) || 'Log Activity';
          const text =
            (params.text as string) || (params.content as string) || '';
          const date = params.date as string | undefined;

          const dailyResult: VaultNoteResult =
            await this.vaultService.createDailyNote(section, text, date);

          return {
            data: dailyResult as unknown as Record<string, unknown>,
            summary: `Daily note updated at "${dailyResult.relativePath}".`,
            filesModified: [dailyResult.relativePath],
          };
        }

        case 'obsidian_delete_file': {
          const targetPath = (params.path as string) || '';
          const result = await this.vaultService.deleteFile(targetPath);

          return {
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
            data: result,
            summary: `Moved "${sourcePath}" to "${targetPath}" in Obsidian vault.`,
            filesModified: [sourcePath, targetPath],
          };
        }

        case 'obsidian_search_backlinks': {
          const targetNote = (params.targetNote as string) || '';
          const backlinks = await this.vaultService.searchBacklinks(targetNote);

          return {
            data: {
              targetNote,
              backlinks,
              count: backlinks.length,
            },
            summary: `Found ${backlinks.length} backlink reference(s) linked to [[${targetNote}]].`,
          };
        }

        default:
          throw new Error(
            `Tool ${toolName} not supported by Obsidian MCP Server`,
          );
      }
    });
  }

  override async ping(): Promise<{
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
