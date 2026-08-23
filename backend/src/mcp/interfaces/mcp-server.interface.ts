import { McpTransportType } from './mcp-transport.types';
import { McpToolDefinition, McpToolCallResult } from './mcp-tool.interface';

/**
 * Standard contract for both Internal (In-Process) and Remote (Network) MCP Servers
 */
export interface IMcpServer {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly transportType: McpTransportType;
  readonly isInternal: boolean;

  /**
   * Returns all available tools declared by this MCP server
   */
  getTools(): McpToolDefinition[];

  /**
   * Checks if this server provides a given tool name
   */
  hasTool(toolName: string): boolean;

  /**
   * Executes a tool provided by this MCP server
   */
  executeTool(
    toolName: string,
    params: Record<string, unknown>,
  ): Promise<McpToolCallResult>;

  /**
   * Optional health check or connectivity test
   */
  ping?(): Promise<{
    status: 'connected' | 'disconnected' | 'error';
    message?: string;
    latencyMs: number;
  }>;
}
