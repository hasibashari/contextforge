import {
  Injectable,
  Inject,
  Optional,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { IMcpServer, McpToolDefinition } from './interfaces/mcp.types';
import { IMcpOAuthHandler } from './interfaces/mcp-oauth.interface';
import { MCP_SERVERS, MCP_OAUTH_HANDLERS } from './mcp.tokens';

/**
 * Central Registry for discovering, routing, and executing tools across all registered MCP servers.
 * Supports multi-provider injection from NestJS modules as well as dynamic runtime registration.
 */
@Injectable()
export class McpRegistryService implements OnModuleInit {
  private readonly logger = new Logger(McpRegistryService.name);
  private readonly serversById = new Map<string, IMcpServer>();
  private readonly toolToServerMap = new Map<string, IMcpServer>();
  private readonly oauthHandlers = new Map<string, IMcpOAuthHandler>();

  constructor(
    @Optional()
    @Inject(MCP_SERVERS)
    injectedServers: IMcpServer[] = [],
    @Optional()
    @Inject(MCP_OAUTH_HANDLERS)
    injectedOAuthHandlers: IMcpOAuthHandler[] = [],
  ) {
    if (Array.isArray(injectedServers)) {
      for (const server of injectedServers) {
        if (server) {
          this.registerServer(server);
        }
      }
    }

    if (Array.isArray(injectedOAuthHandlers)) {
      for (const handler of injectedOAuthHandlers) {
        if (handler) {
          this.registerOAuthHandler(handler);
        }
      }
    }
  }

  onModuleInit() {
    this.logger.log(
      `McpRegistry initialized with ${this.serversById.size} servers, ${this.toolToServerMap.size} tools, and ${this.oauthHandlers.size} OAuth handlers.`,
    );
  }

  /**
   * Registers a server in the central registry and indexes its exposed tools
   */
  public registerServer(server: IMcpServer): void {
    if (!server || !server.id) return;

    this.serversById.set(server.id, server);
    const tools = server.getTools() || [];
    for (const tool of tools) {
      this.toolToServerMap.set(tool.name, server);
    }
    this.logger.debug(
      `Registered MCP Server "${server.name}" (${server.id}) with ${tools.length} tools`,
    );
  }

  /**
   * Unregisters a server from the registry
   */
  public unregisterServer(serverId: string): void {
    const server = this.serversById.get(serverId);
    if (!server) return;

    const tools = server.getTools() || [];
    for (const tool of tools) {
      this.toolToServerMap.delete(tool.name);
    }
    this.serversById.delete(serverId);
    this.logger.debug(`Unregistered MCP Server "${server.name}" (${serverId})`);
  }

  /**
   * Registers an OAuth handler by providerId
   */
  public registerOAuthHandler(handler: IMcpOAuthHandler): void {
    if (!handler || !handler.providerId) return;
    this.oauthHandlers.set(handler.providerId, handler);
    this.logger.debug(
      `Registered OAuth Handler for provider "${handler.providerId}"`,
    );
  }

  /**
   * Look up a server by unique server ID
   */
  public getServer(serverId: string): IMcpServer | undefined {
    return this.serversById.get(serverId);
  }

  /**
   * Look up which server provides a specific tool name
   */
  public findServerForTool(toolName: string): IMcpServer | undefined {
    return this.toolToServerMap.get(toolName);
  }

  /**
   * Returns all registered MCP servers
   */
  public getAllServers(): IMcpServer[] {
    return Array.from(this.serversById.values());
  }

  /**
   * Aggregates all tool definitions across all active servers
   */
  public getAllTools(): McpToolDefinition[] {
    const allTools: McpToolDefinition[] = [];
    for (const server of this.serversById.values()) {
      allTools.push(...server.getTools());
    }
    return allTools;
  }

  /**
   * Look up an OAuth handler by provider ID
   */
  public getOAuthHandler(providerId: string): IMcpOAuthHandler | undefined {
    return this.oauthHandlers.get(providerId);
  }

  /**
   * Returns all registered OAuth handlers
   */
  public getAllOAuthHandlers(): IMcpOAuthHandler[] {
    return Array.from(this.oauthHandlers.values());
  }
}
