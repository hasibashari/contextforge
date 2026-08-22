import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { DatabaseService } from '../../common/database/database.service';

export interface VaultWriteResult {
  absolutePath: string;
  relativePath: string;
  bytesWritten: number;
  lineCount: number;
  title: string;
  formattedContent: string;
  durationMs: number;
}

@Injectable()
export class ObsidianVaultService implements OnModuleInit {
  private readonly logger = new Logger(ObsidianVaultService.name);
  private vaultRoot: string = '';

  constructor(private readonly db: DatabaseService) {}

  async onModuleInit() {
    await this.refreshVaultRootFromDb();
  }

  /**
   * Helper to expand tilde `~` to the system user home directory
   */
  private expandHomeDir(targetPath: string): string {
    if (!targetPath) return '';
    const clean = targetPath.trim();
    if (clean.startsWith('~')) {
      return path.join(os.homedir(), clean.slice(1));
    }
    return path.resolve(clean);
  }

  /**
   * Extracts the folder path from an MCP integration endpoint string or auth config
   */
  private parseVaultPathFromEndpoint(
    endpoint?: string,
    authConfig?: { vaultPath?: string },
  ): string {
    if (authConfig?.vaultPath) {
      return this.expandHomeDir(authConfig.vaultPath);
    }
    if (!endpoint) return '';

    const clean = endpoint.trim();
    // Direct path (e.g. /home/user/vault or ~/Documents/vault or D:/vault)
    if (
      clean.startsWith('/') ||
      clean.startsWith('~') ||
      clean.startsWith('./') ||
      /^[a-zA-Z]:[\\/]/.test(clean)
    ) {
      return this.expandHomeDir(clean);
    }

    // CLI command pattern: "npx -y @modelcontextprotocol/server-obsidian ~/Documents/ObsidianVault"
    const parts = clean.split(/\s+/);
    const lastArg = parts[parts.length - 1];
    if (
      lastArg &&
      (lastArg.startsWith('/') ||
        lastArg.startsWith('~') ||
        lastArg.startsWith('./') ||
        /^[a-zA-Z]:[\\/]/.test(lastArg))
    ) {
      return this.expandHomeDir(lastArg);
    }

    return '';
  }

  /**
   * Refreshes active vault root from PostgreSQL workspace_integrations or environment
   */
  async refreshVaultRootFromDb(): Promise<string> {
    try {
      // 1. Check environment variable override
      const envVaultPath = process.env.OBSIDIAN_VAULT_PATH;
      if (envVaultPath) {
        this.setVaultRoot(this.expandHomeDir(envVaultPath));
        return this.vaultRoot;
      }

      // 2. Query active MCP integration from PostgreSQL
      const res = await this.db.query<{
        endpoint: string;
        auth_config: { vaultPath?: string };
      }>(
        `SELECT endpoint, auth_config 
         FROM workspace_integrations 
         WHERE id = 'int-obsidian-vault-mcp' 
            OR name ILIKE '%obsidian%' 
         LIMIT 1;`,
      );

      if (res.rows.length > 0) {
        const row = res.rows[0];
        const parsedPath = this.parseVaultPathFromEndpoint(
          row.endpoint,
          row.auth_config,
        );
        if (parsedPath) {
          this.setVaultRoot(parsedPath);
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
   * Sets or updates active mounted vault root (e.g. from MCP connection target)
   */
  setVaultRoot(vaultPath: string): void {
    if (vaultPath) {
      this.vaultRoot = this.expandHomeDir(vaultPath);
      this.logger.log(
        `🔗 [Obsidian MCP] Mounted Obsidian Vault root locked to: ${this.vaultRoot}`,
      );
    } else {
      this.vaultRoot = '';
    }
  }

  /**
   * Returns the canonical root path of the local vault if mounted
   */
  getVaultRoot(): string {
    return this.vaultRoot || 'dynamic-client-vault';
  }

  /**
   * Safely formats and writes a Markdown note with YAML frontmatter directly to the MCP vault folder
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
        `created_by: ContextForge Action Agent`,
        '---',
        '',
      ].join('\n');

      formattedContent = `${frontmatter}\n${formattedContent}`;
    }

    const lineCount = formattedContent.split('\n').length;
    const bytesWritten = Buffer.byteLength(formattedContent, 'utf-8');

    // 3. If a physical vault path is mounted via MCP, write directly to disk
    if (this.vaultRoot) {
      try {
        const resolvedPath = path.resolve(this.vaultRoot, normalizedRelPath);
        const resolvedRootWithSep = this.vaultRoot.endsWith(path.sep)
          ? this.vaultRoot
          : this.vaultRoot + path.sep;

        // Security check: Must reside strictly within the user's selected MCP vault folder
        if (
          resolvedPath.startsWith(resolvedRootWithSep) ||
          resolvedPath === this.vaultRoot
        ) {
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
          };
        } else {
          this.logger.warn(
            `⚠️ Security Block: Attempted write outside mounted vault sandbox (${resolvedPath})`,
          );
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.error(
          `❌ Failed to write note to mounted disk path: ${msg}`,
        );
      }
    }

    // 4. Default: Return clean formatted artifact for client view
    const durationMs = Date.now() - startTime;
    return {
      absolutePath: normalizedRelPath,
      relativePath: normalizedRelPath,
      bytesWritten,
      lineCount,
      title,
      formattedContent,
      durationMs,
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

    const sanitized = targetRelPath.replace(/\0/g, '');
    const resolvedPath = path.resolve(this.vaultRoot, sanitized);
    const resolvedRootWithSep = this.vaultRoot.endsWith(path.sep)
      ? this.vaultRoot
      : this.vaultRoot + path.sep;

    if (!resolvedPath.startsWith(resolvedRootWithSep)) {
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
