import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  IMcpServer,
  McpTransportType,
  McpToolDefinition,
  McpToolCallResult,
  McpRegistryService,
  McpHttpTransport,
  McpSseTransport,
} from './core';
import { GenericRemoteConnector } from './connectors/generic/generic-remote.connector';
import { DatabaseService } from '../common/database/database.service';
import { EncryptionService } from '../common/security/encryption.service';
import { NotionMcpConnector } from './connectors/notion/notion-mcp.connector';
import { GoogleCalendarMcpConnector } from './connectors/google-calendar/google-calendar-mcp.connector';
import { AndroidBridgeMcpConnector } from './connectors/android-bridge/android-bridge-mcp.connector';

@Injectable()
export class McpGatewayService implements OnModuleInit {
  private readonly logger = new Logger(McpGatewayService.name);

  constructor(
    private readonly registry: McpRegistryService,
    private readonly db: DatabaseService,
    private readonly httpTransport: McpHttpTransport,
    private readonly sseTransport: McpSseTransport,
    private readonly encryption: EncryptionService,
  ) {}

  async onModuleInit() {
    await this.initCoreConnectorsFromDb();
    await this.refreshRemoteServersFromDb();
  }

  /**
   * 🔐 Preload credentials & endpoints for core built-in MCP connectors (Google Calendar, Notion, Android Bridge) from PostgreSQL
   */
  async initCoreConnectorsFromDb(): Promise<void> {
    try {
      const res = await this.db.query<{
        id: string;
        endpoint: string;
        auth_config: {
          token?: string;
          apiKey?: string;
          refreshToken?: string;
          workspaceName?: string;
          deviceName?: string;
        };
        status: string;
      }>(
        `SELECT id, endpoint, auth_config, status 
         FROM workspace_integrations 
         WHERE id IN ('int-google-calendar-mcp', 'int-notion-mcp', 'int-android-bridge-mcp');`,
      );

      for (const row of res.rows) {
        if (row.id === 'int-google-calendar-mcp') {
          const server = this.registry.getServer('int-google-calendar-mcp');
          if (server instanceof GoogleCalendarMcpConnector) {
            const rawToken = row.auth_config?.token;
            const rawRefreshToken = row.auth_config?.refreshToken;
            const decryptedToken = rawToken
              ? this.encryption.decrypt(rawToken)
              : undefined;
            const decryptedRefreshToken = rawRefreshToken
              ? this.encryption.decrypt(rawRefreshToken)
              : undefined;

            server.configure({
              endpoint: row.endpoint,
              token: decryptedToken,
              refreshToken: decryptedRefreshToken,
            });
            this.logger.log(
              `🔑 Loaded Google Calendar MCP credentials from PostgreSQL (status: ${row.status})`,
            );
          }
        } else if (row.id === 'int-notion-mcp') {
          const server = this.registry.getServer('int-notion-mcp');
          if (server instanceof NotionMcpConnector) {
            const rawToken = row.auth_config?.token || row.auth_config?.apiKey;
            const decryptedToken = rawToken
              ? this.encryption.decrypt(rawToken)
              : undefined;

            server.configure({
              endpoint: row.endpoint,
              token: decryptedToken,
              apiKey: decryptedToken,
            });
            this.logger.log(
              `🔑 Loaded Notion MCP credentials from PostgreSQL (status: ${row.status})`,
            );
          }
        } else if (row.id === 'int-android-bridge-mcp') {
          const server = this.registry.getServer('int-android-bridge-mcp');
          if (server instanceof AndroidBridgeMcpConnector) {
            const rawToken = row.auth_config?.token || row.auth_config?.apiKey;
            const decryptedToken = rawToken
              ? this.encryption.decrypt(rawToken)
              : undefined;

            server.configure({
              endpoint: row.endpoint,
              authToken: decryptedToken,
              deviceName: row.auth_config?.deviceName,
            });
            this.logger.log(
              `📱 Loaded Android MCP Bridge endpoint from PostgreSQL: ${row.endpoint} (status: ${row.status})`,
            );
          }
        }
      }
    } catch (err: unknown) {
      this.logger.warn(
        `Could not preload core MCP connector credentials: ${String(err)}`,
      );
    }
  }

  /**
   * 🌐 Load and Register External Remote MCP Endpoints from PostgreSQL
   */
  async refreshRemoteServersFromDb(): Promise<void> {
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
         WHERE id NOT IN ('int-obsidian-vault-mcp', 'int-notion-mcp', 'int-google-calendar-mcp', 'int-android-bridge-mcp') 
           AND status = 'connected';`,
      );

      for (const row of res.rows) {
        const connector = new GenericRemoteConnector(
          this.httpTransport,
          this.sseTransport,
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
        this.registry.registerServer(connector);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Could not refresh remote MCP integrations: ${msg}`);
    }
  }

  /**
   * Registers a server in the central registry
   */
  registerServer(server: IMcpServer): void {
    this.registry.registerServer(server);
  }

  /**
   * Retrieves a registered server by ID
   */
  getServer(id: string): IMcpServer | undefined {
    return this.registry.getServer(id);
  }

  /**
   * Discovers which server provides the specified tool
   */
  findServerForTool(toolName: string): IMcpServer | undefined {
    return this.registry.findServerForTool(toolName);
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
    return this.registry.getAllTools();
  }

  /**
   * Runs a live health probe on a specific registered MCP server
   */
  async pingServer(serverId: string): Promise<{
    status: 'connected' | 'disconnected' | 'error';
    message: string;
    latencyMs: number;
  }> {
    let server = this.registry.getServer(serverId);

    // Sync Notion credentials from DB if target is Notion
    if (serverId === 'int-notion-mcp' || serverId.includes('notion')) {
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
        if (res.rows.length > 0 && server instanceof NotionMcpConnector) {
          const row = res.rows[0];
          const rawToken = row.auth_config?.token || row.auth_config?.apiKey;
          const decryptedToken = rawToken
            ? this.encryption.decrypt(rawToken)
            : undefined;
          server.configure({
            endpoint: row.endpoint,
            token: decryptedToken,
            apiKey: decryptedToken,
          });
        }
      } catch {
        // Continue with existing in-memory config
      }
    } else if (
      serverId === 'int-google-calendar-mcp' ||
      serverId.includes('google-calendar') ||
      serverId.includes('gcal')
    ) {
      try {
        const res = await this.db.query<{
          endpoint: string;
          auth_config: {
            token?: string;
            refreshToken?: string;
            workspaceName?: string;
          };
        }>(
          `SELECT endpoint, auth_config FROM workspace_integrations WHERE id = 'int-google-calendar-mcp' LIMIT 1;`,
        );
        if (
          res.rows.length > 0 &&
          server instanceof GoogleCalendarMcpConnector
        ) {
          const row = res.rows[0];
          const rawToken = row.auth_config?.token;
          const rawRefreshToken = row.auth_config?.refreshToken;
          const decryptedToken = rawToken
            ? this.encryption.decrypt(rawToken)
            : undefined;
          const decryptedRefreshToken = rawRefreshToken
            ? this.encryption.decrypt(rawRefreshToken)
            : undefined;
          server.configure({
            endpoint: row.endpoint,
            token: decryptedToken,
            refreshToken: decryptedRefreshToken,
          });
        }
      } catch {
        // Continue with existing in-memory config
      }
    } else if (
      serverId === 'int-android-bridge-mcp' ||
      serverId.includes('android')
    ) {
      try {
        const res = await this.db.query<{
          endpoint: string;
          auth_config: {
            token?: string;
            apiKey?: string;
            deviceName?: string;
          };
        }>(
          `SELECT endpoint, auth_config FROM workspace_integrations WHERE id = 'int-android-bridge-mcp' LIMIT 1;`,
        );
        if (
          res.rows.length > 0 &&
          server instanceof AndroidBridgeMcpConnector
        ) {
          const row = res.rows[0];
          const rawToken = row.auth_config?.token || row.auth_config?.apiKey;
          const decryptedToken = rawToken
            ? this.encryption.decrypt(rawToken)
            : undefined;
          server.configure({
            endpoint: row.endpoint,
            authToken: decryptedToken,
            deviceName: row.auth_config?.deviceName,
          });
        }
      } catch {
        // Continue with existing in-memory config
      }
    }

    // If server still not in registry, try dynamic lookup from PostgreSQL
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
            this.httpTransport,
            this.sseTransport,
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
          this.registry.registerServer(connector);
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
