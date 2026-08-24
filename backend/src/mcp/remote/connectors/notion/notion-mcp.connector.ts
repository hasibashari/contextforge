import { Injectable, Logger } from '@nestjs/common';
import { IMcpServer } from '../../../interfaces/mcp-server.interface';
import { McpTransportType } from '../../../interfaces/mcp-transport.types';
import {
  McpToolDefinition,
  McpToolCallResult,
} from '../../../interfaces/mcp-tool.interface';
import { McpHttpClient } from '../../clients/mcp-http.client';
import { NotionApiClient } from './notion-api.client';

@Injectable()
export class NotionMcpConnector implements IMcpServer {
  private readonly logger = new Logger(NotionMcpConnector.name);

  readonly id = 'int-notion-mcp';
  readonly name = 'Notion Workspace MCP Server';
  readonly category = 'productivity';
  readonly transportType: McpTransportType = 'streamable_http';
  readonly isInternal = false;

  private endpoint = 'https://mcp.notion.com/mcp';
  private authToken = '';

  constructor(
    private readonly httpClient: McpHttpClient,
    private readonly apiClient: NotionApiClient,
  ) {}

  setEndpoint(endpoint: string, authToken = '') {
    if (endpoint) this.endpoint = endpoint;
    if (authToken !== undefined) this.authToken = authToken;
  }

  setAuthToken(authToken: string) {
    this.authToken = authToken || '';
  }

  getAuthToken(): string {
    return this.authToken;
  }

  configure(config: { endpoint?: string; token?: string; apiKey?: string }) {
    if (config.endpoint) this.endpoint = config.endpoint;
    if (config.token) this.authToken = config.token;
    else if (config.apiKey) this.authToken = config.apiKey;
  }

  getTools(): McpToolDefinition[] {
    return [
      {
        id: 't-notion-0',
        name: 'notion_list_workspace_resources',
        description:
          'Discovers and inventories all accessible Notion pages, child pages, and databases across the connected workspace with full pagination traversal.',
        parametersSchema: {
          type: 'object',
          properties: {
            filterType: {
              type: 'string',
              description:
                'Optional filter: "all", "page", or "database" (defaults to "all")',
            },
          },
        },
        readOnly: true,
      },
      {
        id: 't-notion-1',
        name: 'notion_search',
        description:
          'Searches pages, documentation, and database records across Notion workspace by keyword or topic.',
        parametersSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search keyword or title to find in Notion',
            },
          },
          required: ['query'],
        },
        readOnly: true,
      },
      {
        id: 't-notion-2',
        name: 'notion_get_tasks',
        description:
          'Queries tasks, action items, to-do lists, and Kanban board statuses from Notion databases.',
        parametersSchema: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              description:
                'Optional task status filter: "all", "in_progress", "todo", "done"',
            },
            query: {
              type: 'string',
              description: 'Optional filter query for task titles',
            },
          },
        },
        readOnly: true,
      },
      {
        id: 't-notion-3',
        name: 'notion_read_page',
        description:
          'Reads structured markdown content, properties, and block hierarchy from a Notion page by its UUID.',
        parametersSchema: {
          type: 'object',
          properties: {
            pageId: {
              type: 'string',
              description: 'The 32-character Notion Page ID or UUID',
            },
          },
          required: ['pageId'],
        },
        readOnly: true,
      },
      {
        id: 't-notion-4',
        name: 'notion_create_page',
        description:
          'Creates a new child page or database entry in Notion with markdown content.',
        parametersSchema: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Title of the new page' },
            content: {
              type: 'string',
              description: 'Markdown text content of the page',
            },
            parentId: {
              type: 'string',
              description:
                'Optional parent Notion page or database ID. If omitted, creates at workspace root if allowed.',
            },
          },
          required: ['title'],
        },
        readOnly: false,
      },
      {
        id: 't-notion-5',
        name: 'notion_query_database',
        description:
          'Filters and sorts structured records inside a specific Notion database.',
        parametersSchema: {
          type: 'object',
          properties: {
            databaseId: {
              type: 'string',
              description: 'The 32-character Notion Database ID or UUID',
            },
            filter: {
              type: 'object',
              description: 'Optional Notion database filter JSON object',
            },
          },
          required: ['databaseId'],
        },
        readOnly: true,
      },
    ];
  }

  hasTool(toolName: string): boolean {
    return (
      toolName.startsWith('notion_') || toolName === 'query_notion_workspace'
    );
  }

  async executeTool(
    toolName: string,
    params: Record<string, unknown>,
  ): Promise<McpToolCallResult> {
    this.logger.log(`Executing Notion MCP tool: ${toolName}`);

    const effectiveToken =
      this.authToken ||
      process.env.NOTION_API_KEY ||
      process.env.NOTION_TOKEN ||
      '';

    // 1. Transparent Disconnected State Handling
    if (!effectiveToken) {
      this.logger.warn(
        `Notion tool "${toolName}" called without an active NOTION_API_KEY or connection token.`,
      );
      return {
        success: false,
        server: this.name,
        toolName,
        data: {
          connected: false,
          status: 'unauthenticated',
          message:
            'Notion integration is currently disconnected. No active API key or OAuth token is configured.',
          help: 'To access live Notion workspace pages and databases, please connect your token in Settings -> Integrations or add NOTION_API_KEY to backend/.env.',
        },
        summary:
          'Integrasi Notion saat ini belum terhubung. Silakan masukkan Token Integrasi Notion Anda di menu Integrations atau di file .env untuk mengakses workspace Anda.',
      };
    }

    // 2. Connected Mode: Delegate to NotionApiClient
    const authHeaders = {
      Authorization: `Bearer ${effectiveToken.trim()}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    };

    try {
      switch (toolName) {
        case 'notion_list_workspace_resources': {
          const filterType = (
            (params.filterType as string) || 'all'
          ).toLowerCase();
          const filterParam =
            filterType === 'page' || filterType === 'database'
              ? filterType
              : undefined;

          const res = await this.apiClient.listWorkspaceResources(
            authHeaders,
            filterParam,
          );

          return {
            success: true,
            server: this.name,
            toolName,
            data: {
              connected: true,
              totalDiscovered: res.totalCount,
              pagesCount: res.pages.length,
              databasesCount: res.databases.length,
              databaseEntriesCount: res.databaseEntries.length,
              pages: res.pages,
              databases: res.databases,
              databaseEntries: res.databaseEntries.slice(0, 20),
              scopeNote:
                'Resource yang ditampilkan adalah yang dibagikan ke integrasi Notion saat ini.',
            },
            summary: `Berhasil menemukan ${res.totalCount} resource Notion (${res.pages.length} Halaman Dokumen, ${res.databases.length} Database, ${res.databaseEntries.length} Entri Data).`,
          };
        }

        case 'notion_search': {
          const query = ((params.query as string) || '').trim();
          const results = await this.apiClient.search(authHeaders, query);

          return {
            success: true,
            server: this.name,
            toolName,
            data: {
              query,
              totalMatches: results.length,
              results,
            },
            summary: `Ditemukan ${results.length} dokumen/halaman yang cocok dengan "${query}" di Notion.`,
          };
        }

        case 'notion_get_tasks': {
          const statusFilter = (
            (params.status as string) || 'all'
          ).toLowerCase();
          const query = ((params.query as string) || '').toLowerCase().trim();

          const tasks = await this.apiClient.getTasks(
            authHeaders,
            statusFilter,
            query,
          );

          return {
            success: true,
            server: this.name,
            toolName,
            data: {
              filter: statusFilter,
              totalTasks: tasks.length,
              tasks,
            },
            summary: `Berhasil mengambil ${tasks.length} tugas dari database Notion.`,
          };
        }

        case 'notion_read_page': {
          const pageId = (
            (params.pageId as string) || (params.id as string)
          )?.trim();
          if (!pageId) {
            return {
              success: false,
              server: this.name,
              toolName,
              data: { error: 'pageId is required' },
              summary: 'Parameter pageId wajib diisi.',
            };
          }

          const pageData = await this.apiClient.readPage(authHeaders, pageId);

          return {
            success: true,
            server: this.name,
            toolName,
            data: pageData,
            summary: `Berhasil membaca halaman "${pageData.title}" dari Notion (${pageData.content.length} karakter).`,
          };
        }

        case 'notion_create_page': {
          const title = (params.title as string) || 'Untitled Document';
          const content = (params.content as string) || '';
          const parentId = (params.parentId as string)?.trim();

          const created = await this.apiClient.createPage(
            authHeaders,
            title,
            content,
            parentId,
          );

          return {
            success: true,
            server: this.name,
            toolName,
            data: created,
            summary: `Berhasil membuat halaman baru di Notion: "${title}" (${created.url}).`,
          };
        }

        default:
          return await this.httpClient.callRemoteTool(
            this.endpoint,
            toolName,
            params,
            authHeaders,
          );
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Error executing Notion API tool "${toolName}": ${errorMsg}`,
      );
      return {
        success: false,
        server: this.name,
        toolName,
        data: { error: errorMsg },
        summary: `Terjadi kendala saat memanggil API Notion: ${errorMsg}`,
      };
    }
  }

  async ping(): Promise<{
    status: 'connected' | 'disconnected' | 'error';
    message: string;
    latencyMs: number;
  }> {
    const effectiveToken =
      this.authToken ||
      process.env.NOTION_API_KEY ||
      process.env.NOTION_TOKEN ||
      '';

    return this.apiClient.ping(effectiveToken);
  }
}
