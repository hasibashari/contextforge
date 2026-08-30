/**
 * Model Context Protocol (MCP) Domain Types & Contracts
 */

export type McpTransportType =
  'in_process' | 'stdio' | 'sse' | 'streamable_http' | 'rest' | 'websocket';

/**
 * Schema definition for an individual MCP Tool parameter
 */
export interface McpToolParameterSchema {
  type: string;
  description?: string;
  properties?: Record<
    string,
    {
      type: string;
      description?: string;
      enum?: string[];
      items?: Record<string, unknown>;
    }
  >;
  required?: string[];
}

/**
 * Standard declaration of an executable tool exposed by an MCP Server
 */
export interface McpToolDefinition {
  id?: string;
  name: string;
  description: string;
  parametersSchema?: Record<string, unknown> | McpToolParameterSchema;
  readOnly?: boolean;
}

/**
 * Execution result returned from an MCP Tool invocation
 */
export interface McpToolCallResult {
  success: boolean;
  server: string;
  toolName: string;
  data: Record<string, unknown> | Array<Record<string, unknown>> | string;
  summary: string;
  filesModified?: string[];
}

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

/**
 * Client interface for communicating with remote HTTP / SSE MCP servers
 */
export interface IMcpRemoteClient {
  callRemoteTool(
    endpoint: string,
    toolName: string,
    params: Record<string, unknown>,
    authHeaders?: Record<string, string>,
  ): Promise<McpToolCallResult>;

  pingRemoteEndpoint(
    endpoint: string,
    authHeaders?: Record<string, string>,
  ): Promise<{ status: 'connected' | 'error'; latencyMs: number }>;
}
