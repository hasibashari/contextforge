import { Logger } from '@nestjs/common';
import { IMcpServer } from '../../interfaces/mcp-server.interface';
import { McpTransportType } from '../../interfaces/mcp-transport.types';
import {
  McpToolDefinition,
  McpToolCallResult,
} from '../../interfaces/mcp-tool.interface';
import { McpHttpClient } from '../clients/mcp-http.client';
import { McpSseClient } from '../clients/mcp-sse.client';

export interface GenericRemoteConfig {
  id: string;
  name: string;
  category?: string;
  endpoint: string;
  transport: McpTransportType;
  tools?: McpToolDefinition[];
  authConfig?: Record<string, string>;
}

export class GenericRemoteConnector implements IMcpServer {
  private readonly logger = new Logger(GenericRemoteConnector.name);

  public id: string;
  public name: string;
  public category: string;
  public transportType: McpTransportType;
  readonly isInternal = false;

  private endpoint: string;
  private tools: McpToolDefinition[];
  private authConfig: Record<string, string>;

  constructor(
    private readonly httpClient: McpHttpClient,
    private readonly sseClient: McpSseClient,
    config?: GenericRemoteConfig,
  ) {
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
    this.logger.log(
      `Dispatching remote tool "${toolName}" to ${this.name} (${this.endpoint})`,
    );

    const headers: Record<string, string> = {};
    if (this.authConfig.token) {
      headers.Authorization = `Bearer ${this.authConfig.token}`;
    } else if (this.authConfig.apiKey) {
      headers['X-API-Key'] = this.authConfig.apiKey;
    }

    if (this.transportType === 'sse') {
      return await this.sseClient.callRemoteTool(
        this.endpoint,
        toolName,
        params,
        headers,
      );
    }

    return await this.httpClient.callRemoteTool(
      this.endpoint,
      toolName,
      params,
      headers,
    );
  }

  async ping(): Promise<{ status: 'connected' | 'error'; latencyMs: number }> {
    if (!this.endpoint) {
      return { status: 'error', latencyMs: 0 };
    }
    return await this.httpClient.pingRemoteEndpoint(this.endpoint);
  }
}
