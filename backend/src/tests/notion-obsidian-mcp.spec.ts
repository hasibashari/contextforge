import assert from 'assert';
import { ObsidianMcpServer } from '../mcp/connectors/obsidian/obsidian-mcp.server';
import { ObsidianVaultService } from '../mcp/connectors/obsidian/obsidian-vault.service';
import { ObsidianBridgeGatewayService } from '../mcp/connectors/obsidian/obsidian-bridge.gateway';
import { NotionMcpConnector } from '../mcp/connectors/notion/notion-mcp.connector';
import { NotionApiClient } from '../mcp/connectors/notion/notion-api.client';
import { McpHttpTransport } from '../mcp/core';

export async function runNotionAndObsidianTests() {
  console.log('\n🧪 Starting Notion & Obsidian MCP Compatibility Tests...\n');
  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void> | void) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err: unknown) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(err);
      failed++;
    }
  }

  // 1. Obsidian Server Tests
  await test('1. Obsidian MCP Server has expected tool catalog', () => {
    const bridgeGateway = new ObsidianBridgeGatewayService();
    const vaultService = new ObsidianVaultService(bridgeGateway);
    const obsidianServer = new ObsidianMcpServer(vaultService);

    assert.strictEqual(obsidianServer.id, 'int-obsidian-vault-mcp');
    assert.strictEqual(obsidianServer.isInternal, true);
    assert.strictEqual(obsidianServer.hasTool('obsidian_read_note'), true);
    assert.strictEqual(obsidianServer.hasTool('obsidian_create_note'), true);
    assert.strictEqual(obsidianServer.hasTool('obsidian_update_note'), true);
    assert.strictEqual(obsidianServer.hasTool('obsidian_delete_file'), true);
    assert.strictEqual(obsidianServer.hasTool('obsidian_search_files'), true);
    assert.strictEqual(
      obsidianServer.hasTool('dispatch_obsidian_worker'),
      true,
    );

    const tools = obsidianServer.getTools();
    assert.ok(
      tools.length >= 10,
      `Expected at least 10 tools, got ${tools.length}`,
    );

    const createTool = tools.find((t) => t.name === 'obsidian_create_note');
    assert.ok(createTool, 'obsidian_create_note tool must exist');
    assert.strictEqual(createTool?.readOnly, false);

    const updateTool = tools.find((t) => t.name === 'obsidian_update_note');
    assert.ok(updateTool, 'obsidian_update_note tool must exist');
    assert.strictEqual(updateTool?.readOnly, false);
  });

  await test('2. Obsidian ping probe handles offline bridge gracefully', async () => {
    const bridgeGateway = new ObsidianBridgeGatewayService();
    const vaultService = new ObsidianVaultService(bridgeGateway);
    const obsidianServer = new ObsidianMcpServer(vaultService);

    const ping = await obsidianServer.ping();
    assert.ok(ping.status === 'connected' || ping.status === 'disconnected');
    assert.ok(typeof ping.latencyMs === 'number');
  });

  // 2. Notion Server Tests
  await test('3. Notion MCP Server has expected tool catalog', () => {
    const httpTransport = new McpHttpTransport();
    const apiClient = new NotionApiClient();
    const notionServer = new NotionMcpConnector(httpTransport, apiClient);

    assert.strictEqual(notionServer.id, 'int-notion-mcp');
    assert.strictEqual(notionServer.isInternal, false);
    assert.strictEqual(
      notionServer.hasTool('notion_list_workspace_resources'),
      true,
    );
    assert.strictEqual(notionServer.hasTool('notion_search'), true);
    assert.strictEqual(notionServer.hasTool('query_notion_workspace'), true);
    assert.strictEqual(notionServer.hasTool('notion_get_tasks'), true);
    assert.strictEqual(notionServer.hasTool('notion_read_page'), true);
    assert.strictEqual(notionServer.hasTool('notion_create_page'), true);
    assert.strictEqual(notionServer.hasTool('notion_update_page'), true);

    const tools = notionServer.getTools();
    assert.ok(
      tools.length >= 6,
      `Expected at least 6 tools, got ${tools.length}`,
    );

    const updateTool = tools.find((t) => t.name === 'notion_update_page');
    const reqFields = (updateTool?.parametersSchema as { required?: string[] })
      ?.required;
    assert.ok(reqFields && reqFields.includes('pageId'));
  });

  await test('4. Notion connector returns disconnected guidance when token is not present', async () => {
    const savedApiKey = process.env.NOTION_API_KEY;
    const savedToken = process.env.NOTION_TOKEN;
    delete process.env.NOTION_API_KEY;
    delete process.env.NOTION_TOKEN;

    try {
      const httpTransport = new McpHttpTransport();
      const apiClient = new NotionApiClient();
      const notionServer = new NotionMcpConnector(httpTransport, apiClient);
      notionServer.setAuthToken('');

      const result = await notionServer.executeTool('notion_get_tasks', {});
      assert.strictEqual(result.success, false);
      assert.strictEqual(
        (result.data as Record<string, unknown>).connected,
        false,
      );
      assert.strictEqual(
        (result.data as Record<string, unknown>).status,
        'unauthenticated',
      );
      assert.ok(result.summary.includes('Disconnected'));

      const updateResult = await notionServer.executeTool(
        'notion_update_page',
        {
          pageId: 'test-page-123',
          title: 'Updated Test Page',
        },
      );
      assert.strictEqual(updateResult.success, false);
      assert.ok(updateResult.summary.includes('Disconnected'));
    } finally {
      if (savedApiKey) process.env.NOTION_API_KEY = savedApiKey;
      if (savedToken) process.env.NOTION_TOKEN = savedToken;
    }
  });

  console.log(
    `\n📊 Notion & Obsidian Test Results: ${passed} passed, ${failed} failed.\n`,
  );
  if (failed > 0) {
    throw new Error(`${failed} Notion & Obsidian tests failed!`);
  }
}
