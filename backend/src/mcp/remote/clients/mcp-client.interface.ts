import { McpToolCallResult } from '../../interfaces/mcp-tool.interface';

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
