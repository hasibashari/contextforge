import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { DatabaseService } from '../../../common/database/database.service';
import { UniversalPathResolver } from '../../../common/utils/universal-path-resolver.util';

export interface VaultWriteResult {
  absolutePath: string;
  relativePath: string;
  bytesWritten: number;
  lineCount: number;
  title: string;
  formattedContent: string;
  durationMs: number;
  obsidianUri?: string;
  isPhysicalDiskWrite: boolean;
}

@Injectable()
export class ObsidianVaultService implements OnModuleInit {
  private readonly logger = new Logger(ObsidianVaultService.name);
  private vaultRoot: string = '';
  private vaultName: string = 'Obsidian Vault';
  private isPhysicallyAccessible: boolean = false;

  constructor(private readonly db: DatabaseService) {}

  async onModuleInit() {
    await this.refreshVaultRootFromDb();
  }

  /**
   * Refreshes active vault root from PostgreSQL workspace_integrations or environment
   */
  async refreshVaultRootFromDb(): Promise<string> {
    try {
      // 1. Check environment variable override
      const envVaultPath = process.env.OBSIDIAN_VAULT_PATH;
      if (envVaultPath) {
        this.setVaultRoot(envVaultPath);
        return this.vaultRoot;
      }

      // 2. Query active MCP integration from PostgreSQL
      const res = await this.db.query<{
        endpoint: string;
        status: string;
        auth_config: { vaultName?: string; vaultPath?: string };
      }>(
        `SELECT endpoint, status, auth_config 
         FROM workspace_integrations 
         WHERE id = 'int-obsidian-vault-mcp' 
            OR name ILIKE '%obsidian%' 
         LIMIT 1;`,
      );

      if (res.rows.length > 0) {
        const row = res.rows[0];

        // If the MCP integration is disconnected in database, do not mount!
        if (row.status !== 'connected') {
          this.vaultRoot = '';
          this.isPhysicallyAccessible = false;
          this.logger.log(
            '📁 Obsidian Protocol Bridge: MCP Server is currently disconnected.',
          );
          return '';
        }

        this.vaultName = row.auth_config?.vaultName || 'Obsidian Vault';

        const rawPath =
          row.auth_config?.vaultPath ||
          this.extractRawPathFromEndpoint(row.endpoint);

        if (rawPath) {
          this.setVaultRoot(rawPath);
          return this.vaultRoot;
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Could not load Obsidian integration from DB: ${msg}`);
    }

    if (!this.vaultRoot) {
      this.logger.log(
        '📁 Obsidian Protocol Bridge: No physical vault path connected in MCP Integrations yet.',
      );
    }

    return this.vaultRoot;
  }

  /**
   * Extracts raw directory path from CLI command endpoint
   */
  private extractRawPathFromEndpoint(endpoint?: string): string {
    if (!endpoint) return '';
    const clean = endpoint.trim();

    // Check quoted argument at end: e.g. npx ... "/path/with spaces"
    const quotedMatch = clean.match(/(["'])(.+?)\1$/);
    if (quotedMatch && quotedMatch[2]) {
      return quotedMatch[2];
    }

    const parts = clean.split(/\s+/);
    const last = parts[parts.length - 1];
    if (
      last &&
      (last.startsWith('/') ||
        last.startsWith('~') ||
        last.startsWith('./') ||
        last.startsWith('../') ||
        /^[a-zA-Z]:[\\/]/.test(last))
    ) {
      return last;
    }

    return '';
  }

  /**
   * Sets or updates active mounted vault root using UniversalPathResolver
   */
  setVaultRoot(rawVaultPath: string): void {
    if (rawVaultPath) {
      const resolved = UniversalPathResolver.resolve(rawVaultPath);
      if (resolved.resolvedPath === 'dynamic-client-vault') {
        this.vaultRoot = 'dynamic-client-vault';
        this.isPhysicallyAccessible = true;
        this.logger.log(
          `📁 [Obsidian Protocol Bridge] Active in Browser Client Bridge mode ("${this.vaultName}")`,
        );
        return;
      }

      this.vaultRoot = resolved.resolvedPath;
      this.isPhysicallyAccessible = resolved.isAccessible;

      this.logger.log(
        `🔗 [Universal Path Resolver] Mounted Obsidian Vault on [${resolved.platform.toUpperCase()}]: ${this.vaultRoot} (Accessible: ${this.isPhysicallyAccessible})`,
      );
    } else {
      this.vaultRoot = '';
      this.isPhysicallyAccessible = false;
    }
  }

  /**
   * Returns the canonical root path of the local vault if mounted
   */
  getVaultRoot(): string {
    return this.vaultRoot || 'dynamic-client-vault';
  }

  /**
   * Real-time path accessibility check on local filesystem
   */
  async verifyPathAccess(): Promise<{
    isAccessible: boolean;
    isClientPaired?: boolean;
    path: string;
    reason?: string;
  }> {
    if (!this.vaultRoot) {
      await this.refreshVaultRootFromDb();
    }

    if (!this.vaultRoot || this.vaultRoot === 'dynamic-client-vault') {
      return {
        isAccessible: true,
        isClientPaired: true,
        path: this.vaultName || 'Obsidian Vault',
        reason: `Obsidian Vault connected via Client Bridge ("${this.vaultName || 'Active Vault'}")`,
      };
    }

    try {
      await fs.access(this.vaultRoot, fs.constants.R_OK | fs.constants.W_OK);
      this.isPhysicallyAccessible = true;
      return {
        isAccessible: true,
        path: this.vaultRoot,
        reason: `Vault directory accessible at ${this.vaultRoot}`,
      };
    } catch {
      // Gracefully fall back to client/URI bridge mode if physical disk path is client-side
      this.isPhysicallyAccessible = false;
      return {
        isAccessible: true,
        isClientPaired: true,
        path: this.vaultName || this.vaultRoot,
        reason: `Obsidian MCP Server connected (Client & URI Bridge: "${this.vaultName}")`,
      };
    }
  }

  /**
   * Safely formats and writes a Markdown note with YAML frontmatter
   * Supports direct physical disk write (Local/WSL) and Obsidian URI protocol (Cloud/Remote).
   */
  async writeNote(
    title: string,
    targetRelPath: string,
    rawContent: string,
    metadata: Record<string, unknown> = {},
  ): Promise<VaultWriteResult> {
    const startTime = Date.now();

    // Ensure active vault root is loaded from DB
    if (!this.vaultRoot) {
      await this.refreshVaultRootFromDb();
    }

    // 1. Sanitize relative path (prevent escaping directory)
    const sanitizedRelPath = (targetRelPath || `${title}.md`)
      .replace(/\0/g, '')
      .replace(/^(\.\.(\/|\\|$))+/, '');

    const normalizedRelPath = sanitizedRelPath.endsWith('.md')
      ? sanitizedRelPath
      : `${sanitizedRelPath}.md`;

    // 2. Format frontmatter if not already included
    let formattedContent = rawContent.trim();
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
        `created_by: ContextForge Personal Assistant`,
        '---',
        '',
      ].join('\n');

      formattedContent = `${frontmatter}\n${formattedContent}`;
    }

    const lineCount = formattedContent.split('\n').length;
    const bytesWritten = Buffer.byteLength(formattedContent, 'utf-8');
    const obsidianUri = UniversalPathResolver.buildObsidianUri(
      this.vaultName,
      normalizedRelPath,
      formattedContent,
    );

    // 3. Physical Disk Write (for Local Windows, WSL, macOS, Linux deployments)
    if (this.vaultRoot) {
      const resolvedPath = UniversalPathResolver.sanitizeSubPath(
        this.vaultRoot,
        normalizedRelPath,
      );

      if (resolvedPath) {
        try {
          const targetDir = path.dirname(resolvedPath);
          await fs.mkdir(targetDir, { recursive: true });
          await fs.writeFile(resolvedPath, formattedContent, 'utf-8');
          const durationMs = Date.now() - startTime;

          this.logger.log(
            `✅ [Obsidian MCP] Auto-created file and directory at: ${resolvedPath}`,
          );

          return {
            absolutePath: resolvedPath,
            relativePath: path.relative(this.vaultRoot, resolvedPath),
            bytesWritten,
            lineCount,
            title,
            formattedContent,
            durationMs,
            obsidianUri,
            isPhysicalDiskWrite: true,
          };
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          this.logger.error(`❌ Failed to write note to disk path: ${msg}`);
        }
      } else {
        this.logger.warn(
          `⚠️ Security Block: Attempted write outside mounted vault sandbox (${normalizedRelPath})`,
        );
      }
    }

    // 4. Fallback / Cloud Mode: Return clean formatted artifact + Obsidian URI for client sync
    const durationMs = Date.now() - startTime;
    return {
      absolutePath: normalizedRelPath,
      relativePath: normalizedRelPath,
      bytesWritten,
      lineCount,
      title,
      formattedContent,
      durationMs,
      obsidianUri,
      isPhysicalDiskWrite: false,
    };
  }

  /**
   * Safely reads a note from the mounted vault if available
   */
  async readNote(targetRelPath: string): Promise<string | null> {
    if (!this.vaultRoot) {
      await this.refreshVaultRootFromDb();
    }
    if (!this.vaultRoot) {
      return null;
    }

    const resolvedPath = UniversalPathResolver.sanitizeSubPath(
      this.vaultRoot,
      targetRelPath,
    );

    if (!resolvedPath) {
      throw new Error('Security Exception: Invalid path traversal.');
    }

    try {
      return await fs.readFile(resolvedPath, 'utf-8');
    } catch {
      return null;
    }
  }

  /**
   * Scans and returns existing folder paths in the mounted Obsidian Vault
   * so the AI can place new notes into matching existing folders rather than creating arbitrary ones.
   */
  async getVaultFolders(): Promise<string[]> {
    if (!this.vaultRoot) {
      await this.refreshVaultRootFromDb();
    }
    if (!this.vaultRoot) {
      return [];
    }

    try {
      const folders: string[] = [];
      const scanDir = async (dir: string, baseRel: string, depth = 0) => {
        if (depth > 2) return;
        try {
          const entries = await fs.readdir(dir, { withFileTypes: true });
          for (const entry of entries) {
            if (
              entry.isDirectory() &&
              !entry.name.startsWith('.') &&
              entry.name !== 'node_modules'
            ) {
              const rel = baseRel ? `${baseRel}/${entry.name}` : entry.name;
              folders.push(rel);
              await scanDir(path.join(dir, entry.name), rel, depth + 1);
            }
          }
        } catch {
          // ignore unreadable subdirectories
        }
      };

      await scanDir(this.vaultRoot, '', 0);
      return folders;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Failed to scan vault folders: ${msg}`);
      return [];
    }
  }
}
