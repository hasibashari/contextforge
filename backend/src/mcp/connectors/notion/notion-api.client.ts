import { Injectable, Logger } from '@nestjs/common';
import { NotionRawObject, NotionBlock } from './notion.types';
import {
  extractTitle,
  extractStatus,
  splitIntoRichText,
  convertMarkdownToBlocks,
  convertBlocksToMarkdown,
} from './notion-parser.engine';

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
      parentType: string;
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
      parentType: string;
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
      const title = extractTitle(item);
      if (item.object === 'database') {
        databases.push({
          id: item.id,
          title,
          url: item.url,
          type: 'database',
          parentType: item.parent?.type || 'workspace',
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
      title: extractTitle(item),
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
      const dbTitle = extractTitle(db);
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
            const title = extractTitle(row);
            const status = extractStatus(row);

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
            title: extractTitle(p),
            status: extractStatus(p),
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

    const pageTitle = extractTitle(pageJson);
    const markdownContent = convertBlocksToMarkdown(blocksJson.results || []);

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
    let resolvedParent: { page_id?: string; database_id?: string } | undefined =
      parentId ? { page_id: parentId } : undefined;

    let titlePropKey = 'title';

    if (!resolvedParent) {
      const inventory = await this.listWorkspaceResources(authHeaders);

      // 1. If user authorized a Database (top-level), attach directly as a new entry in that database
      const rootDb =
        inventory.databases.find((db) => db.parentType === 'workspace') ||
        inventory.databases[0];

      // 2. If user authorized a Page (top-level), attach as a child page under that root page
      const rootPage =
        inventory.pages.find((p) => p.parentType === 'workspace') ||
        inventory.pages[0];

      if (rootDb) {
        resolvedParent = { database_id: rootDb.id };
      } else if (rootPage) {
        resolvedParent = { page_id: rootPage.id };
      }
    }

    if (!resolvedParent) {
      throw new Error(
        'No accessible page or database found in Notion. Please ensure at least one page or database is shared with the integration.',
      );
    }

    // If target parent is a database, resolve the exact title property name
    if (resolvedParent.database_id) {
      try {
        const dbRes = await fetch(
          `https://api.notion.com/v1/databases/${resolvedParent.database_id}`,
          { headers: authHeaders },
        );
        if (dbRes.ok) {
          const dbMeta = (await dbRes.json()) as {
            properties?: Record<string, { type?: string }>;
          };
          if (dbMeta.properties) {
            for (const key of Object.keys(dbMeta.properties)) {
              if (dbMeta.properties[key]?.type === 'title') {
                titlePropKey = key;
                break;
              }
            }
          }
        }
      } catch {
        titlePropKey = 'Name';
      }
    }

    const allBlocks = convertMarkdownToBlocks(content);
    const initialBlocks = allBlocks.slice(0, 90);
    const remainingBlocks = allBlocks.slice(90);

    const bodyPayload: Record<string, unknown> = {
      parent: resolvedParent,
      properties: {
        [titlePropKey]: {
          title: splitIntoRichText(title || 'Untitled Document'),
        },
      },
    };

    if (initialBlocks.length > 0) {
      bodyPayload.children = initialBlocks;
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

    // Append any overflow blocks if markdown exceeded 90 blocks
    if (remainingBlocks.length > 0) {
      for (let i = 0; i < remainingBlocks.length; i += 90) {
        const batch = remainingBlocks.slice(i, i + 90);
        try {
          await fetch(
            `https://api.notion.com/v1/blocks/${createdJson.id}/children`,
            {
              method: 'PATCH',
              headers: authHeaders,
              body: JSON.stringify({ children: batch }),
            },
          );
        } catch (appendErr) {
          this.logger.warn(
            `Failed to append overflow blocks to page ${createdJson.id}: ${String(appendErr)}`,
          );
        }
      }
    }

    return {
      id: createdJson.id,
      title,
      url: createdJson.url,
      createdTime: createdJson.created_time,
    };
  }

  // ==========================================
  // UPDATE PAGE
  // ==========================================

  async updatePage(
    authHeaders: Record<string, string>,
    pageId: string,
    options: {
      title?: string;
      content?: string;
      mode?: 'append' | 'replace';
      properties?: Record<string, unknown>;
      archived?: boolean;
    },
  ): Promise<{
    id: string;
    title: string;
    url: string;
    lastEditedTime: string;
    archived?: boolean;
    blocksAppended?: number;
  }> {
    const cleanPageId = pageId.replace(/-/g, '');
    const updatePayload: Record<string, unknown> = {};

    // 1. If archiving/unarchiving
    if (typeof options.archived === 'boolean') {
      updatePayload.archived = options.archived;
    }

    // 2. If title or properties provided, resolve page schema/title property
    let pageTitle = options.title || '';
    if (options.title || options.properties) {
      const propertiesPayload: Record<string, unknown> = {};

      if (options.title) {
        try {
          const pageGetRes = await fetch(
            `https://api.notion.com/v1/pages/${cleanPageId}`,
            { headers: authHeaders },
          );
          if (pageGetRes.ok) {
            const pageObj = (await pageGetRes.json()) as NotionRawObject;
            let titlePropKey = 'title';
            if (pageObj.properties) {
              for (const [k, v] of Object.entries(pageObj.properties)) {
                if (
                  v &&
                  typeof v === 'object' &&
                  'type' in v &&
                  v.type === 'title'
                ) {
                  titlePropKey = k;
                  break;
                }
              }
            }
            propertiesPayload[titlePropKey] = {
              title: splitIntoRichText(options.title),
            };
          } else {
            propertiesPayload['title'] = {
              title: splitIntoRichText(options.title),
            };
          }
        } catch {
          propertiesPayload['title'] = {
            title: splitIntoRichText(options.title),
          };
        }
      }

      // Merge additional custom properties if supplied
      if (options.properties) {
        for (const [key, val] of Object.entries(options.properties)) {
          if (typeof val === 'object' && val !== null) {
            propertiesPayload[key] = val;
          } else if (typeof val === 'string') {
            propertiesPayload[key] = {
              status: { name: val },
            };
          }
        }
      }

      if (Object.keys(propertiesPayload).length > 0) {
        updatePayload.properties = propertiesPayload;
      }
    }

    // 3. Send PATCH to update page properties / metadata if any payload exists
    let updatedPageJson: NotionRawObject | undefined;
    if (Object.keys(updatePayload).length > 0) {
      const updateRes = await fetch(
        `https://api.notion.com/v1/pages/${cleanPageId}`,
        {
          method: 'PATCH',
          headers: authHeaders,
          body: JSON.stringify(updatePayload),
        },
      );

      if (!updateRes.ok) {
        const errText = await updateRes.text();
        throw new Error(
          `Failed to update Notion page properties (HTTP ${updateRes.status}): ${errText}`,
        );
      }

      updatedPageJson = (await updateRes.json()) as NotionRawObject;
    } else {
      const getRes = await fetch(
        `https://api.notion.com/v1/pages/${cleanPageId}`,
        { headers: authHeaders },
      );
      if (getRes.ok) {
        updatedPageJson = (await getRes.json()) as NotionRawObject;
      }
    }

    if (!pageTitle && updatedPageJson) {
      pageTitle = extractTitle(updatedPageJson);
    }

    // 4. Update content blocks if markdown content provided
    let blocksAppendedCount = 0;
    if (typeof options.content === 'string' && options.content.trim()) {
      const mode = options.mode || 'append';

      // If mode is 'replace', remove existing child blocks first
      if (mode === 'replace') {
        try {
          const blocksRes = await fetch(
            `https://api.notion.com/v1/blocks/${cleanPageId}/children?page_size=100`,
            { headers: authHeaders },
          );
          if (blocksRes.ok) {
            const blocksJson = (await blocksRes.json()) as {
              results?: NotionBlock[];
            };
            for (const b of blocksJson.results || []) {
              if (b.id) {
                await fetch(`https://api.notion.com/v1/blocks/${b.id}`, {
                  method: 'DELETE',
                  headers: authHeaders,
                }).catch(() => null);
              }
            }
          }
        } catch (delErr) {
          this.logger.warn(
            `Failed to clear existing blocks on page ${cleanPageId}: ${String(delErr)}`,
          );
        }
      }

      // Convert new markdown content to blocks and append in batches
      const blocksToAppend = convertMarkdownToBlocks(options.content);
      blocksAppendedCount = blocksToAppend.length;

      for (let i = 0; i < blocksToAppend.length; i += 90) {
        const batch = blocksToAppend.slice(i, i + 90);
        const appendRes = await fetch(
          `https://api.notion.com/v1/blocks/${cleanPageId}/children`,
          {
            method: 'PATCH',
            headers: authHeaders,
            body: JSON.stringify({ children: batch }),
          },
        );

        if (!appendRes.ok) {
          const errText = await appendRes.text();
          this.logger.warn(
            `Failed to append blocks to page ${cleanPageId}: ${errText}`,
          );
        }
      }
    }

    return {
      id: updatedPageJson?.id || cleanPageId,
      title: pageTitle || 'Untitled Note',
      url: updatedPageJson?.url || `https://notion.so/${cleanPageId}`,
      lastEditedTime:
        updatedPageJson?.last_edited_time || new Date().toISOString(),
      archived: updatedPageJson?.archived,
      blocksAppended: blocksAppendedCount,
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
  // PING / HEALTH CHECK
  // ==========================================

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
