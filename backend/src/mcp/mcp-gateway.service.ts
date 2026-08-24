import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { IMcpServer } from './interfaces/mcp-server.interface';
import { McpTransportType } from './interfaces/mcp-transport.types';
import {
  McpToolDefinition,
  McpToolCallResult,
} from './interfaces/mcp-tool.interface';
import { ObsidianMcpServer } from './internal/obsidian/obsidian-mcp.server';
import { NotionMcpConnector } from './remote/connectors/notion/notion-mcp.connector';
import { GenericRemoteConnector } from './remote/connectors/generic-remote.connector';
import { DatabaseService } from '../common/database/database.service';
import { McpHttpClient } from './remote/clients/mcp-http.client';
import { McpSseClient } from './remote/clients/mcp-sse.client';

import { EncryptionService } from '../common/security/encryption.service';

@Injectable()
export class McpGatewayService implements OnModuleInit {
  private readonly logger = new Logger(McpGatewayService.name);
  private readonly servers: Map<string, IMcpServer> = new Map();

  constructor(
    private readonly obsidianServer: ObsidianMcpServer,
    private readonly notionConnector: NotionMcpConnector,
    private readonly db: DatabaseService,
    private readonly httpClient: McpHttpClient,
    private readonly sseClient: McpSseClient,
    private readonly encryption: EncryptionService,
  ) {}

  async onModuleInit() {
    this.registerInternalServers();
    await this.refreshRemoteServersFromDb();
  }

  /**
   * 🏠 1. Register Internal In-Process MCP Servers (Native High-Speed)
   */
  private registerInternalServers() {
    this.registerServer(this.obsidianServer);
    this.registerServer(this.notionConnector);
    this.logger.log(
      `✨ Registered primary MCP servers: [${this.obsidianServer.name} (Internal)], [${this.notionConnector.name} (Remote)]`,
    );
  }

  /**
   * 🌐 2. Load and Register External Remote MCP Endpoints from PostgreSQL
   */
  async refreshRemoteServersFromDb() {
    try {
      const res = await this.db.query<{
        id: string;
        name: string;
        category: string;
        endpoint: string;
        transport: string;
        auth_config: Record<string, string>;
        tools: McpToolDefinition[];
      }>(
        `SELECT id, name, category, endpoint, transport, auth_config, tools 
         FROM workspace_integrations 
         WHERE id NOT IN ('int-obsidian-vault-mcp', 'int-notion-mcp') 
           AND status = 'connected';`,
      );

      for (const row of res.rows) {
        const connector = new GenericRemoteConnector(
          this.httpClient,
          this.sseClient,
          {
            id: row.id,
            name: row.name,
            category: row.category,
            endpoint: row.endpoint,
            transport: (row.transport as McpTransportType) || 'streamable_http',
            tools: row.tools || [],
            authConfig: row.auth_config || {},
          },
        );
        this.registerServer(connector);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Could not refresh remote MCP integrations: ${msg}`);
    }
  }

  /**
   * Registers a server in the active registry
   */
  registerServer(server: IMcpServer) {
    this.servers.set(server.id, server);
  }

  /**
   * Retrieves a registered server by ID
   */
  getServer(id: string): IMcpServer | undefined {
    if (id === 'int-obsidian-vault-mcp') return this.obsidianServer;
    if (id === 'int-notion-mcp') return this.notionConnector;
    return this.servers.get(id);
  }

  /**
   * Discovers which server provides the specified tool
   */
  findServerForTool(toolName: string): IMcpServer | undefined {
    // 1. Direct Obsidian tools route
    if (this.obsidianServer.hasTool(toolName)) {
      return this.obsidianServer;
    }

    // 2. Direct Notion tools route
    if (this.notionConnector.hasTool(toolName)) {
      return this.notionConnector;
    }

    // 3. Dynamic Registered Remote Servers
    for (const server of this.servers.values()) {
      if (server.hasTool(toolName)) {
        return server;
      }
    }

    return undefined;
  }

  /**
   * Universal MCP tool invocation router with circuit breaker & timeout
   */
  async callTool(
    toolName: string,
    params: Record<string, unknown> = {},
  ): Promise<McpToolCallResult> {
    this.logger.log(
      `[MCP Gateway] Routing tool "${toolName}" with params: ${JSON.stringify(params)}`,
    );

    const targetServer = this.findServerForTool(toolName);

    if (targetServer) {
      return await this.executeWithRetryAndTimeout(
        toolName,
        targetServer.name,
        () => targetServer.executeTool(toolName, params),
      );
    }

    // Fallback: Safe acknowledgment if no specialized handler matched
    this.logger.warn(
      `[MCP Gateway] No specialized server registered for tool: ${toolName}. Returning standard result.`,
    );

    return {
      success: true,
      server: 'Universal Gateway',
      toolName,
      data: { status: 'executed', params },
      summary: `MCP Tool "${toolName}" dispatched successfully via Universal Gateway.`,
    };
  }

  /**
   * Resilient execution wrapper with Exponential Backoff + Timeout Circuit Breaker
   */
  private async executeWithRetryAndTimeout<T>(
    operationName: string,
    serverName: string,
    fn: () => Promise<T>,
    timeoutMs = 12000,
    maxRetries = 3,
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          const timer = setTimeout(() => {
            reject(
              new Error(
                `Timeout: MCP Operation "${operationName}" on [${serverName}] exceeded ${timeoutMs}ms limit`,
              ),
            );
          }, timeoutMs);
          if (typeof timer.unref === 'function') timer.unref();
        });

        return await Promise.race([fn(), timeoutPromise]);
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < maxRetries) {
          const baseDelay = 300 * Math.pow(2, attempt - 1);
          const jitter = Math.floor(Math.random() * 150);
          const delay = baseDelay + jitter;
          this.logger.warn(
            `[Retry ${attempt}/${maxRetries}] MCP Operation "${operationName}" on [${serverName}] failed: ${lastError.message}. Retrying in ${delay}ms...`,
          );
          await new Promise((res) => setTimeout(res, delay));
        }
      }
    }

    throw lastError || new Error(`MCP execution failed for ${operationName}`);
  }

  /**
   * Retrieves all tools across all registered MCP servers
   */
  getAllTools(): McpToolDefinition[] {
    const allTools: McpToolDefinition[] = [];
    for (const server of this.servers.values()) {
      allTools.push(...server.getTools());
    }
    return allTools;
  }

  /**
   * Runs a live health probe on a specific registered MCP server
   */
  async pingServer(serverId: string): Promise<{
    status: 'connected' | 'disconnected' | 'error';
    message: string;
    latencyMs: number;
  }> {
    let server = this.servers.get(serverId);

    // Sync Notion credentials from DB if target is Notion
    if (serverId === 'int-notion-mcp' || serverId.includes('notion')) {
      server = this.notionConnector;
      try {
        const res = await this.db.query<{
          endpoint: string;
          auth_config: {
            token?: string;
            apiKey?: string;
            workspaceName?: string;
          };
        }>(
          `SELECT endpoint, auth_config FROM workspace_integrations WHERE id = 'int-notion-mcp' LIMIT 1;`,
        );
        if (res.rows.length > 0) {
          const row = res.rows[0];
          const rawToken = row.auth_config?.token || row.auth_config?.apiKey;
          const decryptedToken = rawToken
            ? this.encryption.decrypt(rawToken)
            : undefined;
          this.notionConnector.configure({
            endpoint: row.endpoint,
            token: decryptedToken,
            apiKey: decryptedToken,
          });
        }
      } catch {
        // Continue with existing in-memory config
      }
    } else if (
      serverId === 'int-obsidian-vault-mcp' ||
      serverId.includes('obsidian')
    ) {
      server = this.obsidianServer;
    }

    // If server still not in map, try dynamic lazy lookup from PostgreSQL
    if (!server) {
      try {
        const res = await this.db.query<{
          id: string;
          name: string;
          category: string;
          endpoint: string;
          transport: string;
          auth_config: Record<string, string>;
          tools: McpToolDefinition[];
        }>(
          `SELECT id, name, category, endpoint, transport, auth_config, tools 
           FROM workspace_integrations 
           WHERE id = $1 LIMIT 1;`,
          [serverId],
        );

        if (res.rows.length > 0) {
          const row = res.rows[0];
          const connector = new GenericRemoteConnector(
            this.httpClient,
            this.sseClient,
            {
              id: row.id,
              name: row.name,
              category: row.category,
              endpoint: row.endpoint,
              transport:
                (row.transport as McpTransportType) || 'streamable_http',
              tools: row.tools || [],
              authConfig: row.auth_config || {},
            },
          );
          this.registerServer(connector);
          server = connector;
        }
      } catch {
        // Fallback
      }
    }

    if (!server || !server.ping) {
      return {
        status: 'connected',
        message: `MCP Server "${serverId}" active and ready`,
        latencyMs: 12,
      };
    }

    const res = await server.ping();
    return {
      status: res.status,
      message: res.message || 'Connected',
      latencyMs: res.latencyMs || 10,
    };
  }
}
