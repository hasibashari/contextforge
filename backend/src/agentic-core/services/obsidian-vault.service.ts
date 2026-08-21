import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';

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
  private vaultRoot: string;

  constructor(private readonly configService: ConfigService) {
    const configuredPath =
      this.configService.get<string>('OBSIDIAN_VAULT_PATH') ||
      this.configService.get<string>('app.obsidianVaultPath') ||
      '';
    this.vaultRoot = configuredPath ? path.resolve(configuredPath) : '';
  }

  async onModuleInit() {
    if (!this.vaultRoot) {
      this.logger.log(
        '📁 Obsidian Local Vault backend path not set (client-side HTML5 File System Access & dynamic pairing active)',
      );
      return;
    }

    try {
      await fs.mkdir(this.vaultRoot, { recursive: true });
      this.logger.log(
        `📁 Obsidian Local Vault initialized at root: ${this.vaultRoot}`,
      );
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Failed to initialize Obsidian vault directory: ${errorMsg}`,
      );
    }
  }

  /**
   * Returns the canonical root path of the local vault
   */
  getVaultRoot(): string {
    return this.vaultRoot || 'dynamic-client-vault';
  }

  /**
   * Safely writes a formatted Markdown note with YAML frontmatter to the Obsidian vault
   */
  async writeNote(
    title: string,
    targetRelPath: string,
    rawContent: string,
    metadata: Record<string, unknown> = {},
  ): Promise<VaultWriteResult> {
    if (!this.vaultRoot) {
      throw new Error(
        'Obsidian Vault directory is not configured in backend environment. Please mount your vault dynamically from the ContextForge dashboard.',
      );
    }

    const startTime = Date.now();

    // 1. Sanitize relative path
    const sanitizedRelPath = (targetRelPath || `${title}.md`)
      .replace(/\0/g, '') // remove null bytes
      .replace(/^(\.\.(\/|\\|$))+/, ''); // strip leading traversal sequences

    const normalizedRelPath = sanitizedRelPath.endsWith('.md')
      ? sanitizedRelPath
      : `${sanitizedRelPath}.md`;

    // 2. Strict boundary check against path traversal
    const resolvedPath = path.resolve(this.vaultRoot, normalizedRelPath);
    const resolvedRootWithSep = this.vaultRoot.endsWith(path.sep)
      ? this.vaultRoot
      : this.vaultRoot + path.sep;

    if (
      !resolvedPath.startsWith(resolvedRootWithSep) &&
      resolvedPath !== this.vaultRoot
    ) {
      throw new Error(
        `Security Exception: Target path "${sanitizedRelPath}" resolves outside vault boundary "${this.vaultRoot}".`,
      );
    }

    // 3. Format frontmatter if not already included
    let formattedContent = rawContent.trim();
    if (!formattedContent.startsWith('---')) {
      const isoDate = new Date().toISOString();
      const tagsList = Array.isArray(metadata.tags)
        ? metadata.tags.join(', ')
        : 'contextforge, automated-note';

      const frontmatter = [
        '---',
        `title: "${title.replace(/"/g, '\\"')}"`,
        `date: ${isoDate}`,
        `tags: [${tagsList}]`,
        `status: active`,
        `created_by: ContextForge Core Orchestrator`,
        '---',
        '',
      ].join('\n');

      formattedContent = `${frontmatter}\n${formattedContent}`;
    }

    // 4. Ensure target directory exists
    const targetDir = path.dirname(resolvedPath);
    await fs.mkdir(targetDir, { recursive: true });

    // 5. Write file to disk
    await fs.writeFile(resolvedPath, formattedContent, 'utf-8');

    const stats = await fs.stat(resolvedPath);
    const durationMs = Date.now() - startTime;

    this.logger.log(
      `✅ Wrote note "${title}" (${stats.size} bytes) to disk at: ${resolvedPath} in ${durationMs}ms`,
    );

    return {
      absolutePath: resolvedPath,
      relativePath: path.relative(this.vaultRoot, resolvedPath),
      bytesWritten: stats.size,
      lineCount: formattedContent.split('\n').length,
      title,
      formattedContent,
      durationMs,
    };
  }

  /**
   * Safely reads a note from the vault
   */
  async readNote(targetRelPath: string): Promise<string | null> {
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
}
