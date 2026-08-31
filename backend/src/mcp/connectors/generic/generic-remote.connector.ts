import {
  McpTransportType,
  McpToolDefinition,
  McpToolCallResult,
  BaseMcpConnector,
  McpHttpTransport,
  McpSseTransport,
} from '../../core';

export interface GenericRemoteConfig {
  id: string;
  name: string;
  category?: string;
  endpoint: string;
  transport: McpTransportType;
  tools?: McpToolDefinition[];
  authConfig?: Record<string, string>;
}

export class GenericRemoteConnector extends BaseMcpConnector {
  public id: string;
  public name: string;
  public category: string;
  public transportType: McpTransportType;
  readonly isInternal = false;

  private endpoint: string;
  private tools: McpToolDefinition[];
  private authConfig: Record<string, string>;

  constructor(
    private readonly httpTransport: McpHttpTransport,
    private readonly sseTransport: McpSseTransport,
    config?: GenericRemoteConfig,
  ) {
    super(config?.name || GenericRemoteConnector.name);
    this.id = config?.id || 'dynamic-remote-mcp';
    this.name = config?.name || 'Custom Remote MCP Server';
    this.category = config?.category || 'productivity';
    this.transportType = config?.transport || 'streamable_http';
    this.endpoint = config?.endpoint || '';
    this.tools = config?.tools || [];
    this.authConfig = config?.authConfig || {};
  }

  configure(config: GenericRemoteConfig) {
    this.id = config.id;
    this.name = config.name;
    this.category = config.category || 'productivity';
    this.transportType = config.transport;
    this.endpoint = config.endpoint;
    this.tools = config.tools || [];
    this.authConfig = config.authConfig || {};
  }

  override disconnect(): void {
    this.authConfig = {};
    this.setAuthToken('');
  }

  getTools(): McpToolDefinition[] {
    return this.tools;
  }

  hasTool(toolName: string): boolean {
    return this.tools.some((t) => t.name === toolName);
  }

  async executeTool(
    toolName: string,
    params: Record<string, unknown>,
  ): Promise<McpToolCallResult> {
    const headers: Record<string, string> = {};
    if (this.authConfig.token) {
      headers.Authorization = `Bearer ${this.authConfig.token}`;
    } else if (this.authConfig.apiKey) {
      headers['X-API-Key'] = this.authConfig.apiKey;
    }

    if (this.transportType === 'sse') {
      return await this.sseTransport.callRemoteTool(
        this.endpoint,
        toolName,
        params,
        headers,
      );
    }

    return await this.httpTransport.callRemoteTool(
      this.endpoint,
      toolName,
      params,
      headers,
    );
  }

  override async ping(): Promise<{
    status: 'connected' | 'disconnected' | 'error';
    message?: string;
    latencyMs: number;
  }> {
    if (!this.endpoint) {
      return {
        status: 'disconnected',
        message: 'Endpoint is not configured',
        latencyMs: 0,
      };
    }
    const res = await this.httpTransport.pingRemoteEndpoint(this.endpoint);
    return {
      status: res.status === 'connected' ? 'connected' : 'error',
      message:
        res.status === 'connected'
          ? `${this.name} is reachable`
          : 'Connection failed',
      latencyMs: res.latencyMs,
    };
  }
}
