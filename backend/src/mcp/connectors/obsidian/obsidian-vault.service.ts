import { Injectable, Logger } from '@nestjs/common';
import { ObsidianBridgeGatewayService } from './obsidian-bridge.gateway';

export interface VaultWriteResult {
  relativePath: string;
  bytesWritten: number;
  lineCount: number;
  title: string;
  formattedContent: string;
  durationMs: number;
  obsidianUri?: string;
  isBridgeWrite: boolean;
  foldersCreated?: string[];
}

export interface VaultFolderItem {
  path: string;
  name: string;
  subfolderCount: number;
  filesCount: number;
}

export interface VaultFileItem {
  path: string;
  name: string;
  extension: string;
  size: number;
  lastModified?: number;
}

@Injectable()
export class ObsidianVaultService {
  private readonly logger = new Logger(ObsidianVaultService.name);

  constructor(private readonly bridgeGateway: ObsidianBridgeGatewayService) {}

  /**
   * Refreshes active vault metadata from database or browser bridge
   */
  async refreshVaultRootFromDb(): Promise<void> {
    await this.verifyPathAccess();
  }

  /**
   * Sanitizes relative path to be strictly vault-relative and normalized
   */
  private sanitizeVaultRelativePath(
    rawPath: string,
    defaultName: string = 'Note.md',
  ): string {
    const clean = (rawPath || defaultName)
      .replace(/\\/g, '/')
      .replace(/\0/g, '')
      .replace(/^(\.\.(\/|\\|$))+/, '')
      .replace(/^\/+/, '');

    return clean.endsWith('.md') || clean.includes('.') ? clean : `${clean}.md`;
  }

  /**
   * Real-time connection and accessibility check via Browser Bridge
   */
  verifyPathAccess(): Promise<{
    isAccessible: boolean;
    isClientPaired?: boolean;
    path: string;
    reason?: string;
    vaultName?: string;
  }> {
    const info = this.bridgeGateway.getVaultInfo();
    const isBridgeLive = this.bridgeGateway.isBridgeConnected();

    if (!isBridgeLive || !info.connected) {
      return Promise.resolve({
        isAccessible: false,
        isClientPaired: false,
        path: info.vaultName || 'Obsidian Vault',
        reason:
          'Obsidian Vault is disconnected or not paired. Please select an Obsidian folder to connect.',
        vaultName: info.vaultName,
      });
    }

    return Promise.resolve({
      isAccessible: true,
      isClientPaired: true,
      path: info.vaultName || 'Active Vault',
      reason: `Obsidian Vault connected via Browser Bridge ("${info.vaultName}")`,
      vaultName: info.vaultName,
    });
  }

  /**
   * Discovers active vault information & connection state
   */
  async getVaultInfo(): Promise<Record<string, unknown>> {
    try {
      const liveInfo = await this.bridgeGateway.dispatchBridgeRequest<
        Record<string, unknown>
      >('get_vault_info', {}, 5000);
      return liveInfo;
    } catch {
      return this.bridgeGateway.getVaultInfo() as unknown as Record<
        string,
        unknown
      >;
    }
  }

  /**
   * Lists folder hierarchy in vault at given path
   */
  async getVaultFolders(
    targetSubpath = '',
    recursive = false,
  ): Promise<string[]> {
    try {
      const res = await this.bridgeGateway.dispatchBridgeRequest<{
        folders: Array<string | VaultFolderItem>;
      }>('list_folders', { path: targetSubpath, recursive });

      if (Array.isArray(res?.folders)) {
        const stringFolders: string[] = res.folders.map(
          (f: string | VaultFolderItem) => (typeof f === 'string' ? f : f.path),
        );
        this.bridgeGateway.setCachedFolders(stringFolders);
        return stringFolders;
      }
      return this.bridgeGateway.getCachedFolders();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Could not list vault folders over bridge: ${msg}`);
      return this.bridgeGateway.getCachedFolders();
    }
  }

  /**
   * Searches for folders matching a query name
   */
  async findFolder(query: string): Promise<string[]> {
    const cleanQuery = (query || '').toLowerCase().trim();
    if (!cleanQuery) return this.getVaultFolders();

    try {
      const res = await this.bridgeGateway.dispatchBridgeRequest<{
        folders: string[];
      }>('find_folder', { query: cleanQuery });
      if (Array.isArray(res?.folders)) {
        return res.folders;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Bridge find_folder fallback: ${msg}`);
    }

    // Fallback to searching cached folders
    const all = this.bridgeGateway.getCachedFolders();
    return all.filter((f) => f.toLowerCase().includes(cleanQuery));
  }

  /**
   * Explicitly creates a folder path in the vault
   */
  async createFolder(
    folderPath: string,
  ): Promise<{ success: boolean; path: string; message: string }> {
    const cleanPath = (folderPath || '')
      .replace(/\\/g, '/')
      .replace(/^\/+|\/+$/g, '');
    if (!cleanPath) {
      throw new Error('Folder path cannot be empty.');
    }

    return await this.bridgeGateway.dispatchBridgeRequest<{
      success: boolean;
      path: string;
      message: string;
    }>('create_folder', { path: cleanPath });
  }

  /**
   * Lists files in a vault folder
   */
  async listFiles(
    folderPath = '',
    extension = '',
    recursive = false,
  ): Promise<VaultFileItem[]> {
    const cleanFolder = (folderPath || '')
      .replace(/\\/g, '/')
      .replace(/^\/+|\/+$/g, '');
    return await this.bridgeGateway.dispatchBridgeRequest<VaultFileItem[]>(
      'list_files',
      {
        folderPath: cleanFolder,
        extension,
        recursive,
      },
    );
  }

  /**
   * Searches files by filename or content
   */
  async searchFiles(
    query: string,
    folderPath = '',
  ): Promise<Array<{ path: string; matchType: string; snippet?: string }>> {
    const cleanQuery = (query || '').trim();
    return await this.bridgeGateway.dispatchBridgeRequest<
      Array<{ path: string; matchType: string; snippet?: string }>
    >('search_files', { query: cleanQuery, folderPath });
  }

  /**
   * Reads a Markdown note from the connected vault via Browser Bridge
   */
  async readNote(targetRelPath: string): Promise<string | null> {
    const cleanRelPath = this.sanitizeVaultRelativePath(targetRelPath);
    try {
      const res = await this.bridgeGateway.dispatchBridgeRequest<{
        content: string;
        path: string;
      }>('read_note', { path: cleanRelPath });
      return res.content;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `Failed to read note "${cleanRelPath}" via Browser Bridge: ${msg}`,
      );
      return null;
    }
  }

  /**
   * Writes/updates a Markdown note with frontmatter and bi-directional linking via Browser Bridge
   */
  async writeNote(
    title: string,
    targetRelPath: string,
    rawContent: string,
    metadata: Record<string, unknown> = {},
    createMissingFolders = true,
  ): Promise<VaultWriteResult> {
    const startTime = Date.now();
    const cleanRelPath = this.sanitizeVaultRelativePath(
      targetRelPath,
      `${title}.md`,
    );

    // Format frontmatter if not already present
    let formattedContent = (rawContent || '').trim();
    if (!formattedContent.startsWith('---')) {
      const isoDate = new Date().toISOString().slice(0, 10);
      const tagsList = Array.isArray(metadata.tags)
        ? metadata.tags.join(', ')
        : 'contextforge, notes';

      const frontmatter = [
        '---',
        `title: "${title.replace(/"/g, '\\"')}"`,
        `date: ${isoDate}`,
        `tags: [${tagsList}]`,
        `status: active`,
        `created_by: ContextForge Assistant`,
        '---',
        '',
      ].join('\n');

      formattedContent = `${frontmatter}\n${formattedContent}`;
    }

    const lineCount = formattedContent.split('\n').length;
    const bytesWritten = Buffer.byteLength(formattedContent, 'utf-8');

    // Build standard Obsidian deep link URI
    const vaultName = (
      this.bridgeGateway.getVaultInfo().vaultName || 'Obsidian Vault'
    ).trim();
    const cleanFileUri = encodeURIComponent(cleanRelPath.replace(/\.md$/, ''));
    const obsidianUri = `obsidian://open?vault=${encodeURIComponent(vaultName)}&file=${cleanFileUri}`;

    // Dispatch write over Browser Bridge
    await this.bridgeGateway.dispatchBridgeRequest('write_note', {
      path: cleanRelPath,
      title,
      content: formattedContent,
      createMissingFolders,
    });

    const durationMs = Date.now() - startTime;
    this.logger.log(
      `✅ [Browser Bridge] Successfully written note: "${cleanRelPath}" (${bytesWritten} bytes)`,
    );

    return {
      relativePath: cleanRelPath,
      bytesWritten,
      lineCount,
      title,
      formattedContent,
      durationMs,
      obsidianUri,
      isBridgeWrite: true,
    };
  }

  /**
   * Creates or appends to a Daily Note
   */
  async createDailyNote(
    section = 'Log Activity',
    text = '',
    targetDate?: string,
  ): Promise<VaultWriteResult> {
    const today = targetDate || new Date().toISOString().slice(0, 10);
    const dailyPath = `DailyNotes/${today}.md`;

    const existingContent = (await this.readNote(dailyPath)) || '';
    const timeStr = new Date().toLocaleTimeString();
    const newEntry = `\n\n### [${timeStr}] ${section}\n${text}`;
    const updatedContent = existingContent
      ? `${existingContent}${newEntry}`
      : `# Daily Note - ${today}${newEntry}`;

    return await this.writeNote(
      `Daily Note ${today}`,
      dailyPath,
      updatedContent,
      {
        tags: ['daily-note', 'journal'],
      },
    );
  }

  /**
   * Deletes a file from the vault via Browser Bridge
   */
  async deleteFile(
    targetRelPath: string,
  ): Promise<{ success: boolean; path: string }> {
    const cleanRelPath = this.sanitizeVaultRelativePath(targetRelPath);
    return await this.bridgeGateway.dispatchBridgeRequest<{
      success: boolean;
      path: string;
    }>('delete_file', { path: cleanRelPath });
  }

  /**
   * Moves or renames a file in the vault via Browser Bridge
   */
  async moveFile(
    sourcePath: string,
    targetPath: string,
    overwrite = false,
  ): Promise<{ success: boolean; sourcePath: string; targetPath: string }> {
    const cleanSource = this.sanitizeVaultRelativePath(sourcePath);
    const cleanTarget = this.sanitizeVaultRelativePath(targetPath);

    return await this.bridgeGateway.dispatchBridgeRequest<{
      success: boolean;
      sourcePath: string;
      targetPath: string;
    }>('move_file', {
      sourcePath: cleanSource,
      targetPath: cleanTarget,
      overwrite,
    });
  }

  /**
   * Searches for actual backlinks / references across the connected vault notes
   */
  async searchBacklinks(
    targetNote: string,
  ): Promise<Array<{ notePath: string; lineSnippet: string }>> {
    const cleanTarget = targetNote.replace(/\.md$/, '').trim();
    if (!cleanTarget) return [];

    try {
      const res = await this.bridgeGateway.dispatchBridgeRequest<
        Array<{ notePath: string; lineSnippet: string }>
      >('search_backlinks', { targetNote: cleanTarget });
      return Array.isArray(res) ? res : [];
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Bridge search_backlinks failed: ${msg}`);
      return [];
    }
  }
}
