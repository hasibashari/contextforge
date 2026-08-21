import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
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
  private vaultRoot: string = '';

  constructor() {}

  onModuleInit() {
    this.logger.log(
      '📁 Obsidian Protocol Bridge active (Client-side HTML5 File System Access & Dynamic MCP Pairing enabled)',
    );
  }

  /**
   * Sets or updates active mounted vault root (e.g. from MCP connection target)
   */
  setVaultRoot(vaultPath: string): void {
    this.vaultRoot = vaultPath ? path.resolve(vaultPath) : '';
  }

  /**
   * Returns the canonical root path of the local vault if mounted
   */
  getVaultRoot(): string {
    return this.vaultRoot || 'dynamic-client-vault';
  }

  /**
   * Safely formats and writes a Markdown note with YAML frontmatter
   */
  async writeNote(
    title: string,
    targetRelPath: string,
    rawContent: string,
    metadata: Record<string, unknown> = {},
  ): Promise<VaultWriteResult> {
    const startTime = Date.now();

    // 1. Sanitize relative path
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

    // 3. If a physical vault path is mounted via MCP, write to disk
    if (this.vaultRoot) {
      try {
        const resolvedPath = path.resolve(this.vaultRoot, normalizedRelPath);
        const resolvedRootWithSep = this.vaultRoot.endsWith(path.sep)
          ? this.vaultRoot
          : this.vaultRoot + path.sep;

        if (
          resolvedPath.startsWith(resolvedRootWithSep) ||
          resolvedPath === this.vaultRoot
        ) {
          const targetDir = path.dirname(resolvedPath);
          await fs.mkdir(targetDir, { recursive: true });
          await fs.writeFile(resolvedPath, formattedContent, 'utf-8');
          const durationMs = Date.now() - startTime;

          this.logger.log(
            `✅ Wrote note "${title}" (${bytesWritten} bytes) to mounted vault at: ${resolvedPath}`,
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
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Failed to write note to mounted disk path: ${msg}`);
      }
    }

    // 4. Default: Return clean formatted artifact for client HTML5 pairing / Aside view
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
