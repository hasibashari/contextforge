import { Injectable } from '@nestjs/common';
import {
  McpTransportType,
  McpToolDefinition,
  McpToolCallResult,
  BaseMcpConnector,
  McpHttpTransport,
} from '../../core';
import { NotionApiClient } from './notion-api.client';
import { NOTION_MCP_TOOLS } from './notion-tools.definition';

@Injectable()
export class NotionMcpConnector extends BaseMcpConnector {
  readonly id = 'int-notion-mcp';
  readonly name = 'Notion Workspace MCP Server';
  readonly category = 'productivity';
  readonly transportType: McpTransportType = 'streamable_http';
  readonly isInternal = false;

  private endpoint = 'https://mcp.notion.com/mcp';

  constructor(
    private readonly httpTransport: McpHttpTransport,
    private readonly apiClient: NotionApiClient,
  ) {
    super(NotionMcpConnector.name);
  }

  setEndpoint(endpoint: string, authToken = '') {
    if (endpoint) this.endpoint = endpoint;
    if (authToken !== undefined) this.setAuthToken(authToken);
  }

  configure(config: { endpoint?: string; token?: string; apiKey?: string }) {
    if (config.endpoint) this.endpoint = config.endpoint;
    if (config.token) this.setAuthToken(config.token);
    else if (config.apiKey) this.setAuthToken(config.apiKey);
  }

  getTools(): McpToolDefinition[] {
    return NOTION_MCP_TOOLS;
  }

  hasTool(toolName: string): boolean {
    return (
      toolName.startsWith('notion_') || toolName === 'query_notion_workspace'
    );
  }

  private getEffectiveToken(): string {
    if (this.authToken && this.authToken.trim()) {
      return this.authToken.trim();
    }
    if (process.env.NOTION_API_KEY && process.env.NOTION_API_KEY.trim()) {
      return process.env.NOTION_API_KEY.trim();
    }
    if (process.env.NOTION_TOKEN && process.env.NOTION_TOKEN.trim()) {
      return process.env.NOTION_TOKEN.trim();
    }

    return '';
  }

  override isConnected(): boolean {
    return Boolean(this.getEffectiveToken());
  }

  async executeTool(
    toolName: string,
    params: Record<string, unknown>,
  ): Promise<McpToolCallResult> {
    const effectiveToken = this.getEffectiveToken();
    if (!effectiveToken) {
      return this.disconnectedResult(toolName, 'Notion');
    }

    const authHeaders = {
      Authorization: `Bearer ${effectiveToken}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    };

    return this.safeExecute(toolName, async () => {
      switch (toolName) {
        case 'notion_list_workspace_resources': {
          const res = await this.apiClient.listWorkspaceResources(authHeaders);
          const summary = `Ditemukan ${res.pages.length} halaman, ${res.databases.length} database, dan ${res.databaseEntries.length} entri di workspace Notion.`;
          return {
            data: res as unknown as Record<string, unknown>,
            summary,
          };
        }

        case 'query_notion_workspace':
        case 'notion_search': {
          const query = (params.query as string) || '';
          const searchResult = await this.apiClient.search(authHeaders, query);
          const summary = `Ditemukan ${searchResult.length} item di Notion untuk pencarian "${query}".`;
          return {
            data: searchResult as unknown as Record<string, unknown>,
            summary,
          };
        }

        case 'notion_get_tasks': {
          const statusFilter = (params.filter as string) || 'all';
          const tasksResult = await this.apiClient.getTasks(
            authHeaders,
            statusFilter,
          );
          const summary = `Ditemukan ${tasksResult.length} task aktif di Notion.`;
          return {
            data: tasksResult as unknown as Record<string, unknown>,
            summary,
          };
        }

        case 'notion_read_page': {
          const pageId = (params.pageId as string) || (params.id as string);
          if (!pageId) {
            throw new Error('Parameter "pageId" wajib diisi.');
          }

          const pageData = await this.apiClient.readPage(authHeaders, pageId);
          return {
            data: pageData as unknown as Record<string, unknown>,
            summary: `Halaman "${pageData.title}" (${pageData.content.length} karakter) berhasil dibaca dari Notion.`,
          };
        }

        case 'notion_create_page': {
          const parentId = params.parentId as string | undefined;
          const title = (params.title as string) || 'Untitled Note';
          const content = (params.content as string) || '';

          const newPage = await this.apiClient.createPage(
            authHeaders,
            title,
            content,
            parentId,
          );

          return {
            data: newPage as unknown as Record<string, unknown>,
            summary: `Halaman baru "${newPage.title}" (ID: ${newPage.id}) berhasil dibuat di Notion. Link: ${newPage.url}`,
          };
        }

        default:
          throw new Error(
            `Tool "${toolName}" tidak didukung oleh Notion MCP Server.`,
          );
      }
    });
  }

  override async ping(): Promise<{
    status: 'connected' | 'disconnected' | 'error';
    message?: string;
    latencyMs: number;
  }> {
    const token = this.getEffectiveToken();
    if (!token) {
      return {
        status: 'disconnected',
        message: 'Notion API token is not set.',
        latencyMs: 0,
      };
    }

    return await this.apiClient.ping(token);
  }
}
