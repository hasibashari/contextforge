import { Injectable, Logger } from '@nestjs/common';
import {
  IMcpServer,
  McpTransportType,
  McpToolDefinition,
  McpToolCallResult,
} from '../../mcp.types';
import { ObsidianVaultService } from './obsidian-vault.service';
import { OBSIDIAN_MCP_TOOLS } from './obsidian-tools.definition';

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
    return OBSIDIAN_MCP_TOOLS;
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
