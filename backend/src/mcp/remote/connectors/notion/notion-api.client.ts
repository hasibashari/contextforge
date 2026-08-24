import { Injectable, Logger } from '@nestjs/common';
import { NotionRawObject, NotionBlock, NotionRichText } from './notion.types';

@Injectable()
export class NotionApiClient {
  private readonly logger = new Logger(NotionApiClient.name);

  // ==========================================
  // DISCOVERY & INVENTORY
  // ==========================================

  async listWorkspaceResources(
    authHeaders: Record<string, string>,
    filterType?: 'page' | 'database',
  ): Promise<{
    totalCount: number;
    pages: Array<{
      id: string;
      title: string;
      url: string;
      type: 'page';
      parentType: string;
      lastEditedTime: string;
    }>;
    databases: Array<{
      id: string;
      title: string;
      url: string;
      type: 'database';
      lastEditedTime: string;
    }>;
    databaseEntries: Array<{
      id: string;
      title: string;
      url: string;
      databaseId: string;
      type: 'database_entry';
      lastEditedTime: string;
    }>;
  }> {
    const rawItems = await this.fetchPaginatedSearch(
      authHeaders,
      '',
      filterType,
    );

    const pages: Array<{
      id: string;
      title: string;
      url: string;
      type: 'page';
      parentType: string;
      lastEditedTime: string;
    }> = [];

    const databases: Array<{
      id: string;
      title: string;
      url: string;
      type: 'database';
      lastEditedTime: string;
    }> = [];

    const databaseEntries: Array<{
      id: string;
      title: string;
      url: string;
      databaseId: string;
      type: 'database_entry';
      lastEditedTime: string;
    }> = [];

    for (const item of rawItems) {
      const title = this.extractTitle(item);
      if (item.object === 'database') {
        databases.push({
          id: item.id,
          title,
          url: item.url,
          type: 'database',
          lastEditedTime: item.last_edited_time,
        });
      } else if (item.object === 'page') {
        if (item.parent?.type === 'database_id') {
          databaseEntries.push({
            id: item.id,
            title,
            url: item.url,
            databaseId: item.parent.database_id || '',
            type: 'database_entry',
            lastEditedTime: item.last_edited_time,
          });
        } else {
          pages.push({
            id: item.id,
            title,
            url: item.url,
            type: 'page',
            parentType: item.parent?.type || 'workspace',
            lastEditedTime: item.last_edited_time,
          });
        }
      }
    }

    return {
      totalCount: pages.length + databases.length + databaseEntries.length,
      pages,
      databases,
      databaseEntries,
    };
  }

  // ==========================================
  // SEARCH
  // ==========================================

  async search(
    authHeaders: Record<string, string>,
    query = '',
  ): Promise<
    Array<{
      id: string;
      type: 'page' | 'database';
      title: string;
      url: string;
      lastEditedTime: string;
      parentType: string;
    }>
  > {
    const rawItems = await this.fetchPaginatedSearch(
      authHeaders,
      query === '*' ? '' : query,
    );

    return rawItems.map((item) => ({
      id: item.id,
      type: item.object,
      title: this.extractTitle(item),
      url: item.url,
      lastEditedTime: item.last_edited_time,
      parentType: item.parent?.type || 'workspace',
    }));
  }

  // ==========================================
  // TASKS
  // ==========================================

  async getTasks(
    authHeaders: Record<string, string>,
    statusFilter = 'all',
    query = '',
  ): Promise<
    Array<{
      id: string;
      title: string;
      status: string;
      url: string;
      databaseTitle: string;
      lastEditedTime: string;
    }>
  > {
    const allDatabases = await this.fetchPaginatedSearch(
      authHeaders,
      '',
      'database',
    );

    const taskEntries: Array<{
      id: string;
      title: string;
      status: string;
      url: string;
      databaseTitle: string;
      lastEditedTime: string;
    }> = [];

    for (const db of allDatabases.slice(0, 3)) {
      const dbTitle = this.extractTitle(db);
      try {
        const queryRes = await fetch(
          `https://api.notion.com/v1/databases/${db.id}/query`,
          {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({ page_size: 50 }),
          },
        );

        if (queryRes.ok) {
          const queryJson = (await queryRes.json()) as {
            results?: NotionRawObject[];
          };
          for (const row of queryJson.results || []) {
            const title = this.extractTitle(row);
            const status = this.extractStatus(row);

            if (query && !title.toLowerCase().includes(query.toLowerCase())) {
              continue;
            }
            if (
              statusFilter !== 'all' &&
              statusFilter !== '' &&
              status.toLowerCase() !== statusFilter
            ) {
              continue;
            }

            taskEntries.push({
              id: row.id,
              title,
              status,
              url: row.url,
              databaseTitle: dbTitle,
              lastEditedTime: row.last_edited_time,
            });
          }
        }
      } catch {
        // Gracefully continue with other databases
      }
    }

    // Fallback: If no database rows found, find pages under database_id
    if (taskEntries.length === 0) {
      const allPages = await this.fetchPaginatedSearch(
        authHeaders,
        query || '',
        'page',
      );
      for (const p of allPages) {
        if (p.parent?.type === 'database_id') {
          taskEntries.push({
            id: p.id,
            title: this.extractTitle(p),
            status: this.extractStatus(p),
            url: p.url,
            databaseTitle: 'Notion Database',
            lastEditedTime: p.last_edited_time,
          });
        }
      }
    }

    return taskEntries;
  }

  // ==========================================
  // READ PAGE
  // ==========================================

  async readPage(
    authHeaders: Record<string, string>,
    pageId: string,
  ): Promise<{
    id: string;
    title: string;
    url: string;
    createdTime: string;
    lastEditedTime: string;
    content: string;
  }> {
    const [pageRes, blocksRes] = await Promise.all([
      fetch(`https://api.notion.com/v1/pages/${pageId}`, {
        headers: authHeaders,
      }),
      fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
        headers: authHeaders,
      }),
    ]);

    if (!pageRes.ok) {
      throw new Error(
        `Failed to read page from Notion (HTTP ${pageRes.status}: ${pageRes.statusText})`,
      );
    }

    const pageJson = (await pageRes.json()) as NotionRawObject;
    const blocksJson = blocksRes.ok
      ? ((await blocksRes.json()) as { results?: NotionBlock[] })
      : { results: [] };

    const pageTitle = this.extractTitle(pageJson);
    const markdownContent = this.convertBlocksToMarkdown(
      blocksJson.results || [],
    );

    return {
      id: pageJson.id,
      title: pageTitle,
      url: pageJson.url,
      createdTime: pageJson.created_time,
      lastEditedTime: pageJson.last_edited_time,
      content: markdownContent,
    };
  }

  // ==========================================
  // CREATE PAGE
  // ==========================================

  async createPage(
    authHeaders: Record<string, string>,
    title: string,
    content = '',
    parentId?: string,
  ): Promise<{
    id: string;
    title: string;
    url: string;
    createdTime: string;
  }> {
    let resolvedParent = parentId ? { page_id: parentId } : undefined;

    if (!resolvedParent) {
      const existingPages = await this.fetchPaginatedSearch(
        authHeaders,
        '',
        'page',
      );
      if (existingPages.length > 0) {
        resolvedParent = { page_id: existingPages[0].id };
      }
    }

    if (!resolvedParent) {
      throw new Error(
        'No accessible parent page found in Notion to attach this document to.',
      );
    }

    const bodyPayload: Record<string, unknown> = {
      parent: resolvedParent,
      properties: {
        title: {
          title: [{ text: { content: title } }],
        },
      },
    };

    if (content) {
      bodyPayload.children = [
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{ type: 'text', text: { content } }],
          },
        },
      ];
    }

    const createRes = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(bodyPayload),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      throw new Error(
        `Failed to create page in Notion (HTTP ${createRes.status}): ${errText}`,
      );
    }

    const createdJson = (await createRes.json()) as NotionRawObject;

    return {
      id: createdJson.id,
      title,
      url: createdJson.url,
      createdTime: createdJson.created_time,
    };
  }

  // ==========================================
  // PAGINATION TRAVERSAL
  // ==========================================

  private async fetchPaginatedSearch(
    authHeaders: Record<string, string>,
    query = '',
    filterType?: 'page' | 'database',
  ): Promise<NotionRawObject[]> {
    const allResults: NotionRawObject[] = [];
    let hasMore = true;
    let nextCursor: string | undefined = undefined;
    const MAX_PAGES_TO_FETCH = 5;
    let pageCount = 0;

    while (hasMore && pageCount < MAX_PAGES_TO_FETCH) {
      pageCount++;
      const payload: Record<string, unknown> = {
        page_size: 100,
      };

      if (query && query.trim()) {
        payload.query = query.trim();
      }

      if (filterType) {
        payload.filter = {
          value: filterType,
          property: 'object',
        };
      }

      if (nextCursor) {
        payload.start_cursor = nextCursor;
      }

      try {
        const response = await fetch('https://api.notion.com/v1/search', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          this.logger.warn(
            `Notion API search returned status ${response.status}: ${response.statusText}`,
          );
          break;
        }

        const json = (await response.json()) as {
          results?: NotionRawObject[];
          has_more?: boolean;
          next_cursor?: string | null;
        };

        if (json.results && json.results.length > 0) {
          allResults.push(...json.results);
        }

        hasMore = Boolean(json.has_more && json.next_cursor);
        nextCursor = json.next_cursor || undefined;
      } catch (err) {
        this.logger.error('Failed to fetch Notion search pagination page', err);
        break;
      }
    }

    return allResults;
  }

  // ==========================================
  // PARSING HELPERS
  // ==========================================

  private extractTitle(obj: NotionRawObject): string {
    if (obj.title && Array.isArray(obj.title) && obj.title.length > 0) {
      const text = obj.title
        .map((t) => t.plain_text || '')
        .filter(Boolean)
        .join('');
      if (text) return text;
    }

    if (obj.properties && typeof obj.properties === 'object') {
      for (const key of Object.keys(obj.properties)) {
        const prop = obj.properties[key];
        if (prop && typeof prop === 'object') {
          if (
            prop.type === 'title' &&
            'title' in prop &&
            Array.isArray(prop.title)
          ) {
            const text = prop.title
              .map((t: NotionRichText) => t.plain_text || '')
              .filter(Boolean)
              .join('');
            if (text) return text;
          }
          if (
            prop.type === 'rich_text' &&
            key.toLowerCase().includes('name') &&
            'rich_text' in prop &&
            Array.isArray(prop.rich_text)
          ) {
            const text = prop.rich_text
              .map((t: NotionRichText) => t.plain_text || '')
              .filter(Boolean)
              .join('');
            if (text) return text;
          }
        }
      }
    }

    return 'Untitled Page';
  }

  private extractStatus(obj: NotionRawObject): string {
    if (obj.properties && typeof obj.properties === 'object') {
      for (const key of Object.keys(obj.properties)) {
        const prop = obj.properties[key];
        if (prop && typeof prop === 'object') {
          if (
            prop.type === 'status' &&
            'status' in prop &&
            prop.status &&
            typeof prop.status === 'object' &&
            'name' in prop.status &&
            typeof prop.status.name === 'string'
          ) {
            return prop.status.name;
          }
          if (
            prop.type === 'select' &&
            'select' in prop &&
            prop.select &&
            typeof prop.select === 'object' &&
            'name' in prop.select &&
            typeof prop.select.name === 'string'
          ) {
            return prop.select.name;
          }
        }
      }
    }
    return 'Active';
  }

  private convertBlocksToMarkdown(blocks: NotionBlock[]): string {
    const lines: string[] = [];

    for (const block of blocks) {
      const type = block.type;
      const data = block[type] as
        { rich_text?: NotionRichText[]; checked?: boolean } | undefined;
      const text =
        data?.rich_text && Array.isArray(data.rich_text)
          ? data.rich_text.map((t) => t.plain_text || '').join('')
          : '';

      switch (type) {
        case 'heading_1':
          lines.push(`# ${text}\n`);
          break;
        case 'heading_2':
          lines.push(`## ${text}\n`);
          break;
        case 'heading_3':
          lines.push(`### ${text}\n`);
          break;
        case 'bulleted_list_item':
          lines.push(`- ${text}`);
          break;
        case 'numbered_list_item':
          lines.push(`1. ${text}`);
          break;
        case 'to_do':
          lines.push(`- [${data?.checked ? 'x' : ' '}] ${text}`);
          break;
        case 'code':
          lines.push(`\`\`\`\n${text}\n\`\`\`\n`);
          break;
        case 'paragraph':
        default:
          if (text.trim()) lines.push(`${text}\n`);
          break;
      }
    }

    return lines.join('\n').trim() || '*(Halaman kosong)*';
  }

  async ping(token: string): Promise<{
    status: 'connected' | 'disconnected' | 'error';
    message: string;
    latencyMs: number;
  }> {
    if (!token) {
      return {
        status: 'disconnected',
        message: 'Notion integration requires API token',
        latencyMs: 0,
      };
    }

    const start = Date.now();
    try {
      const res = await fetch('https://api.notion.com/v1/users/me', {
        headers: {
          Authorization: `Bearer ${token.trim()}`,
          'Notion-Version': '2022-06-28',
        },
      });

      if (res.ok) {
        return {
          status: 'connected',
          message: 'Notion API live connection established',
          latencyMs: Date.now() - start,
        };
      }
      return {
        status: 'disconnected',
        message: `Notion token invalid (HTTP ${res.status})`,
        latencyMs: Date.now() - start,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        status: 'error',
        message: `Failed to reach Notion API: ${msg}`,
        latencyMs: Date.now() - start,
      };
    }
  }
}
