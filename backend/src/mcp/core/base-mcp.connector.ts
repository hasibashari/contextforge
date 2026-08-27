import { Logger } from '@nestjs/common';
import {
  IMcpServer,
  McpToolDefinition,
  McpToolCallResult,
  McpTransportType,
} from './interfaces/mcp.types';

/**
 * Abstract base class for all MCP Connectors (remote SaaS, local tools, dynamic bridges)
 * Eliminates repetitive boilerplate for tool execution, token states, error sanitization, and logging.
 */
export abstract class BaseMcpConnector implements IMcpServer {
  protected readonly logger: Logger;
  protected authToken: string = '';

  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly category: string;
  abstract readonly transportType: McpTransportType;
  abstract readonly isInternal: boolean;

  constructor(loggerContext?: string) {
    this.logger = new Logger(loggerContext || this.constructor.name);
  }

  /**
   * Sets or updates the active authentication token
   */
  public setAuthToken(token: string): void {
    this.authToken = (token || '').trim();
  }

  /**
   * Checks whether the connector has an active credentials token
   */
  public isConnected(): boolean {
    return Boolean(this.authToken && this.authToken.length > 0);
  }

  /**
   * Returns all tool definitions declared by this connector
   */
  abstract getTools(): McpToolDefinition[];

  /**
   * Checks if this connector exposes a specific tool
   */
  public hasTool(toolName: string): boolean {
    return this.getTools().some((t) => t.name === toolName);
  }

  /**
   * Main entry point for executing a tool. Subclasses implement this.
   */
  abstract executeTool(
    toolName: string,
    params: Record<string, unknown>,
  ): Promise<McpToolCallResult>;

  /**
   * Executes a tool handler safely with automated logging, error sanitization, and timing.
   */
  protected async safeExecute(
    toolName: string,
    handler: () => Promise<{
      data: Record<string, unknown> | Array<Record<string, unknown>> | string;
      summary: string;
      filesModified?: string[];
    }>,
  ): Promise<McpToolCallResult> {
    this.logger.log(`Executing tool "${toolName}" on server "${this.name}"`);
    try {
      const result = await handler();
      return {
        success: true,
        server: this.name,
        toolName,
        data: result.data,
        summary: result.summary,
        filesModified: result.filesModified,
      };
    } catch (err: unknown) {
      const sanitizedError = this.sanitizeErrorMessage(err);
      this.logger.error(
        `Error executing tool "${toolName}" on "${this.name}": ${sanitizedError}`,
      );

      return {
        success: false,
        server: this.name,
        toolName,
        data: {
          error: sanitizedError,
          tool: toolName,
        },
        summary: `❌ Failed to execute ${toolName} on ${this.name}: ${sanitizedError}`,
      };
    }
  }

  /**
   * Returns a standard unauthenticated / disconnected error result
   */
  protected disconnectedResult(
    toolName: string,
    serviceDisplayName: string,
  ): McpToolCallResult {
    const msg = `${serviceDisplayName} integration is disconnected or credentials are not configured. Please connect in Workspace Integrations.`;
    this.logger.warn(
      `Tool "${toolName}" called on "${this.name}" without active credentials.`,
    );

    return {
      success: false,
      server: this.name,
      toolName,
      data: {
        connected: false,
        status: 'unauthenticated',
        message: msg,
      },
      summary: `⚠️ ${serviceDisplayName} Disconnected: ${msg}`,
    };
  }

  /**
   * Sanitizes error message to prevent leaking secrets, bearer tokens, or API keys
   */
  protected sanitizeErrorMessage(err: unknown): string {
    if (!err) return 'Unknown error occurred';
    let msg =
      err instanceof Error
        ? err.message
        : typeof err === 'string'
          ? err
          : JSON.stringify(err);

    // Strip out potential bearer tokens or query keys
    msg = msg.replace(/Bearer\s+[A-Za-z0-9_.-]+/gi, 'Bearer [REDACTED]');
    msg = msg.replace(/key=[A-Za-z0-9_.-]+/gi, 'key=[REDACTED]');
    msg = msg.replace(/secret=[A-Za-z0-9_.-]+/gi, 'secret=[REDACTED]');
    msg = msg.replace(/token=[A-Za-z0-9_.-]+/gi, 'token=[REDACTED]');

    return msg;
  }

  /**
   * Standard connectivity probe
   */
  public ping(): Promise<{
    status: 'connected' | 'disconnected' | 'error';
    message?: string;
    latencyMs: number;
  }> {
    const startTime = Date.now();
    return Promise.resolve({
      status: this.isConnected() ? 'connected' : 'disconnected',
      message: this.isConnected()
        ? `${this.name} is configured and ready`
        : `${this.name} is not connected`,
      latencyMs: Date.now() - startTime,
    });
  }
}
