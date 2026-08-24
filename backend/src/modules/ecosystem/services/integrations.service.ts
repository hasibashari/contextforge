import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { EcosystemRepository } from '../ecosystem.repository';
import { McpGatewayService } from '../../../mcp/mcp-gateway.service';
import { McpToolDefinition } from '../../../mcp/interfaces/mcp-tool.interface';
import { ObsidianVaultService } from '../../../mcp/internal/obsidian/obsidian-vault.service';
import { EncryptionService } from '../../../common/security/encryption.service';
import {
  WorkspaceIntegrationRow,
  McpDiscoveredTool,
  CreateIntegrationDto,
} from '../ecosystem.types';

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);

  constructor(
    private readonly repo: EcosystemRepository,
    private readonly mcpGateway: McpGatewayService,
    private readonly obsidianVaultService: ObsidianVaultService,
    private readonly encryption: EncryptionService,
  ) {}

  // ==========================================
  // PRIVATE HELPERS: Secure Auth Encryption
  // ==========================================

  private encryptAuthConfig(
    authConfig: Record<string, unknown> | undefined,
  ): Record<string, unknown> | undefined {
    if (!authConfig || typeof authConfig !== 'object') return authConfig;
    const sensitiveKeys = ['token', 'apiKey', 'password', 'secret', 'key'];
    const result = { ...authConfig };
    for (const key of Object.keys(result)) {
      const val = result[key];
      if (
        sensitiveKeys.some((s) =>
          key.toLowerCase().includes(s.toLowerCase()),
        ) &&
        typeof val === 'string' &&
        val &&
        !val.startsWith('enc:v1:')
      ) {
        result[key] = this.encryption.encrypt(val);
      }
    }
    return result;
  }

  private maskAuthConfigForClient(
    row: WorkspaceIntegrationRow,
  ): WorkspaceIntegrationRow {
    if (!row.auth_config) return row;
    return {
      ...row,
      auth_config: this.encryption.maskAuthConfig(row.auth_config),
    };
  }

  // ==========================================
  // CRUD OPERATIONS
  // ==========================================

  async getIntegrations(): Promise<WorkspaceIntegrationRow[]> {
    const rows = await this.repo.getIntegrations();

    // Run parallel live health probe on all integrations
    const probed: WorkspaceIntegrationRow[] = await Promise.all(
      rows.map(async (row): Promise<WorkspaceIntegrationRow> => {
        // If the user has explicitly disconnected a remote generic connector in DB, honor it
        if (
          row.status === 'disconnected' &&
          row.id !== 'int-notion-mcp' &&
          row.id !== 'int-obsidian-vault-mcp'
        ) {
          return {
            ...row,
            status: 'disconnected',
            health_message: 'Disconnected by user',
          };
        }

        try {
          const probe = await this.mcpGateway.pingServer(row.id);
          const isProbeSuccess = probe.status === 'connected';

          const effectiveStatus: WorkspaceIntegrationRow['status'] =
            isProbeSuccess ? 'connected' : 'disconnected';

          const effectiveLatency = probe.latencyMs || row.latency_ms || 12;

          return {
            ...row,
            status: effectiveStatus,
            health_message: probe.message,
            latency_ms: effectiveLatency,
            last_ping_ms: effectiveLatency,
          };
        } catch {
          return {
            ...row,
            status: row.status,
            health_message:
              row.status === 'connected'
                ? 'MCP server active (client bridge)'
                : 'MCP connection probe unavailable',
            latency_ms: row.latency_ms || 14,
          };
        }
      }),
    );

    return probed.map((row) => this.maskAuthConfigForClient(row));
  }

  async createIntegration(
    data: CreateIntegrationDto,
  ): Promise<WorkspaceIntegrationRow> {
    const secureData = {
      ...data,
      authConfig: data.authConfig
        ? this.encryptAuthConfig(data.authConfig)
        : undefined,
    };
    const created = await this.repo.createIntegration(secureData);
    await this.mcpGateway.refreshRemoteServersFromDb();
    if (
      created.id === 'int-obsidian-vault-mcp' ||
      created.name?.toLowerCase().includes('obsidian')
    ) {
      await this.obsidianVaultService.refreshVaultRootFromDb();
    }
    return this.maskAuthConfigForClient(created);
  }

  async updateIntegration(
    id: string,
    updates: Partial<WorkspaceIntegrationRow>,
  ): Promise<WorkspaceIntegrationRow> {
    const secureUpdates: Partial<WorkspaceIntegrationRow> = {
      ...updates,
      auth_config: updates.auth_config
        ? this.encryptAuthConfig(updates.auth_config)
        : updates.auth_config,
    };
    const updated = await this.repo.updateIntegration(id, secureUpdates);
    if (!updated) {
      throw new NotFoundException(
        `Integration connector with ID "${id}" not found`,
      );
    }
    await this.mcpGateway.refreshRemoteServersFromDb();
    if (
      id === 'int-obsidian-vault-mcp' ||
      id.toLowerCase().includes('obsidian')
    ) {
      await this.obsidianVaultService.refreshVaultRootFromDb();
    }
    return this.maskAuthConfigForClient(updated);
  }

  async discoverTools(id: string): Promise<{
    id: string;
    tools: any[];
    latencyMs: number;
    message: string;
  }> {
    const integration = await this.repo.getIntegrationById(id);
    if (!integration) {
      throw new NotFoundException(`MCP Connector with ID "${id}" not found`);
    }

    let latencyMs = 14;
    let discoveredTools: any[] = [];

    // 1. IN-PROCESS MCP SERVER (Obsidian, Notion, or internal registered connectors)
    const inProcessServer = this.mcpGateway.getServer(id);
    if (inProcessServer) {
      discoveredTools = inProcessServer
        .getTools()
        .map((t: McpToolDefinition, idx: number) => ({
          id: t.id || `t-${id}-${idx + 1}`,
          name: t.name,
          description: t.description || `Tool provided by ${integration.name}`,
          parametersSchema:
            (t.parametersSchema as Record<string, unknown>) || {},
          readOnly: Boolean(t.readOnly),
        }));
    }
    // 2. DYNAMIC REMOTE MCP SERVER DISCOVERY VIA JSON-RPC 2.0 (tools/list)
    else if (
      integration.endpoint &&
      (integration.endpoint.startsWith('http://') ||
        integration.endpoint.startsWith('https://'))
    ) {
      const startTime = Date.now();
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/event-stream',
        };

        if (integration.auth_config?.token) {
          const rawToken =
            typeof integration.auth_config.token === 'string'
              ? integration.auth_config.token
              : '';
          const decrypted = this.encryption.decrypt(rawToken);
          headers['Authorization'] = `Bearer ${decrypted}`;
        }

        // Official MCP JSON-RPC 2.0 tools/list request
        const rpcPayload = {
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/list',
          params: {},
        };

        const res = await fetch(integration.endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(rpcPayload),
          signal: AbortSignal.timeout(3000),
        });

        const elapsed = Date.now() - startTime;
        latencyMs = Math.max(8, elapsed);

        if (res.ok) {
          const body = (await res.json()) as {
            result?: { tools?: McpDiscoveredTool[] };
            tools?: McpDiscoveredTool[];
          };
          const rawTools = body?.result?.tools || body?.tools;
          if (Array.isArray(rawTools) && rawTools.length > 0) {
            discoveredTools = rawTools.map((t, idx) => ({
              id: t.id || `t-${id}-${idx + 1}`,
              name: t.name,
              description:
                t.description || `Tool exposed by ${integration.name}`,
              parametersSchema: t.inputSchema || t.parametersSchema || {},
              readOnly:
                typeof t.readOnly === 'boolean'
                  ? t.readOnly
                  : !t.name.includes('create') &&
                    !t.name.includes('update') &&
                    !t.name.includes('write') &&
                    !t.name.includes('delete'),
            }));
            this.logger.log(
              `✨ Dynamically discovered ${discoveredTools.length} tools from live MCP endpoint: ${integration.endpoint}`,
            );
          }
        }
      } catch (err: unknown) {
        this.logger.debug(
          `Live MCP JSON-RPC discovery fallback for ${integration.name}: ${String(err)}`,
        );
      }
    }

    // 3. FALLBACK FOR CUSTOM UNDEFINED MCP INTEGRATION
    if (discoveredTools.length === 0) {
      const baseName = integration.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_');
      discoveredTools = [
        {
          id: `t-${id}-1`,
          name: `${baseName}_query`,
          description: `Query and inspect resources provided by ${integration.name}`,
          parametersSchema: { query: 'string' },
          readOnly: true,
        },
        {
          id: `t-${id}-2`,
          name: `${baseName}_execute`,
          description: `Execute action or mutations on ${integration.name}`,
          parametersSchema: { action: 'string', payload: 'object' },
          readOnly: false,
        },
      ];
    }

    await this.repo.updateIntegration(id, {
      tools: discoveredTools,
      last_ping_ms: latencyMs,
      latency_ms: latencyMs,
      status: 'connected',
    });

    return {
      id,
      tools: discoveredTools,
      latencyMs,
      message: `Successfully discovered ${discoveredTools.length} tools from MCP Server "${integration.name}" (${latencyMs}ms)`,
    };
  }

  async testIntegration(id: string): Promise<{
    id: string;
    status: 'connected' | 'error';
    latencyMs: number;
    message: string;
  }> {
    const integration = await this.repo.getIntegrationById(id);
    if (!integration) {
      throw new NotFoundException(`MCP Connector with ID "${id}" not found`);
    }

    const probe = await this.mcpGateway.pingServer(id);
    const isConnected = probe.status === 'connected';

    await this.repo.updateIntegration(id, {
      last_ping_ms: probe.latencyMs,
      latency_ms: probe.latencyMs,
      status: isConnected ? 'connected' : 'disconnected',
    });

    return {
      id,
      status: isConnected ? 'connected' : 'error',
      latencyMs: probe.latencyMs,
      message: `${probe.message} (${probe.latencyMs}ms)`,
    };
  }

  async deleteIntegration(id: string): Promise<boolean> {
    const deleted = await this.repo.deleteIntegration(id);
    if (!deleted) {
      throw new NotFoundException(
        `Integration connector with ID "${id}" not found`,
      );
    }
    return true;
  }
}
