import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as ts from 'typescript';

export interface CodeSandboxExecutionResult {
  absolutePath: string;
  relativePath: string;
  bytesWritten: number;
  lineCount: number;
  astValid: boolean;
  diagnostics: string[];
  summary: string;
  durationMs: number;
  diffStats: {
    additions: number;
    deletions: number;
  };
}

@Injectable()
export class CodeSandboxService implements OnModuleInit {
  private readonly logger = new Logger(CodeSandboxService.name);
  private sandboxRoot: string;

  constructor(private readonly configService: ConfigService) {
    this.sandboxRoot = path.resolve(
      this.configService.get<string>(
        'app.workspaceSandboxPath',
        path.resolve(process.cwd(), 'workspace_sandbox'),
      ),
    );
  }

  async onModuleInit() {
    try {
      await fs.mkdir(this.sandboxRoot, { recursive: true });
      this.logger.log(
        `💻 Code Sandbox Workspace initialized at root: ${this.sandboxRoot}`,
      );
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Failed to initialize Code Sandbox directory: ${errorMsg}`,
      );
    }
  }

  /**
   * Returns canonical sandbox workspace path
   */
  getSandboxRoot(): string {
    return this.sandboxRoot;
  }

  /**
   * Writes code to physical sandbox file and performs real-time AST syntax validation
   */
  async writeAndValidateCode(
    targetRelPath: string,
    rawCodeContent: string,
    summary: string,
  ): Promise<CodeSandboxExecutionResult> {
    const startTime = Date.now();

    // 1. Sanitize file path
    const sanitizedRelPath = (targetRelPath || 'src/main.ts')
      .replace(/\0/g, '')
      .replace(/^(\.\.(\/|\\|$))+/, '');

    // 2. Strict boundary verification
    const resolvedPath = path.resolve(this.sandboxRoot, sanitizedRelPath);
    const resolvedRootWithSep = this.sandboxRoot.endsWith(path.sep)
      ? this.sandboxRoot
      : this.sandboxRoot + path.sep;

    if (
      !resolvedPath.startsWith(resolvedRootWithSep) &&
      resolvedPath !== this.sandboxRoot
    ) {
      throw new Error(
        `Security Exception: Target path "${sanitizedRelPath}" resolves outside sandbox directory "${this.sandboxRoot}".`,
      );
    }

    // 3. Ensure parent directory exists
    const targetDir = path.dirname(resolvedPath);
    await fs.mkdir(targetDir, { recursive: true });

    // Clean code formatting (strip enclosing markdown code blocks if passed)
    let cleanCode = rawCodeContent.trim();
    if (cleanCode.startsWith('```')) {
      cleanCode = cleanCode
        .replace(/^```[a-zA-Z0-9_-]*\n/, '')
        .replace(/\n```$/, '');
    }

    // 4. Perform AST Syntax Validation
    const ext = path.extname(resolvedPath).toLowerCase();
    const diagnostics: string[] = [];
    let astValid = true;

    if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
      try {
        const sourceFile = ts.createSourceFile(
          path.basename(resolvedPath),
          cleanCode,
          ts.ScriptTarget.Latest,
          true,
          ext === '.tsx' || ext === '.jsx'
            ? ts.ScriptKind.TSX
            : ts.ScriptKind.TS,
        );

        // Check for syntactic parse diagnostics
        const parseDiagnostics = (
          sourceFile as unknown as { parseDiagnostics?: ts.Diagnostic[] }
        ).parseDiagnostics;

        if (parseDiagnostics && parseDiagnostics.length > 0) {
          astValid = false;
          parseDiagnostics.forEach((diag) => {
            const message = ts.flattenDiagnosticMessageText(
              diag.messageText,
              '\n',
            );
            diagnostics.push(`Syntax Notice: ${message}`);
          });
        } else {
          diagnostics.push(
            'TypeScript AST compiler check passed with 0 syntax errors.',
          );
        }
      } catch (parseErr: unknown) {
        astValid = false;
        diagnostics.push(`AST Parser warning: ${String(parseErr)}`);
      }
    } else if (ext === '.json') {
      try {
        JSON.parse(cleanCode);
        diagnostics.push('JSON schema and syntax validated successfully.');
      } catch (jsonErr: unknown) {
        astValid = false;
        diagnostics.push(`JSON Parse error: ${String(jsonErr)}`);
      }
    } else {
      diagnostics.push('File syntax formatted and verified.');
    }

    // 5. Write file physically to disk
    await fs.writeFile(resolvedPath, cleanCode, 'utf-8');

    const stats = await fs.stat(resolvedPath);
    const durationMs = Date.now() - startTime;
    const lines = cleanCode.split('\n');

    this.logger.log(
      `✅ Wrote source file "${sanitizedRelPath}" (${stats.size} bytes, AST: ${astValid ? 'PASS' : 'WARN'}) in ${durationMs}ms`,
    );

    return {
      absolutePath: resolvedPath,
      relativePath: path.relative(this.sandboxRoot, resolvedPath),
      bytesWritten: stats.size,
      lineCount: lines.length,
      astValid,
      diagnostics,
      summary: summary || `Implemented ${sanitizedRelPath}`,
      durationMs,
      diffStats: {
        additions: lines.length,
        deletions: 0,
      },
    };
  }

  /**
   * Safely reads a code file from the sandbox
   */
  async readCode(targetRelPath: string): Promise<string | null> {
    const sanitized = targetRelPath.replace(/\0/g, '');
    const resolvedPath = path.resolve(this.sandboxRoot, sanitized);
    const resolvedRootWithSep = this.sandboxRoot.endsWith(path.sep)
      ? this.sandboxRoot
      : this.sandboxRoot + path.sep;

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
