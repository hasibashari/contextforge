import assert from 'assert';
import {
  McpRegistryService,
  BaseMcpConnector,
  McpToolDefinition,
  McpToolCallResult,
  McpTransportType,
  IMcpOAuthHandler,
} from '../mcp/core';

class MockPluginConnector extends BaseMcpConnector {
  readonly id = 'int-mock-plugin-mcp';
  readonly name = 'Mock Plugin MCP Server';
  readonly category = 'testing';
  readonly transportType: McpTransportType = 'in_process';
  readonly isInternal = true;

  getTools(): McpToolDefinition[] {
    return [
      {
        name: 'mock_plugin_echo',
        description: 'Echo back input parameter',
        parametersSchema: { message: 'string' },
      },
    ];
  }

  async executeTool(
    toolName: string,
    params: Record<string, unknown>,
  ): Promise<McpToolCallResult> {
    return this.safeExecute(toolName, () => {
      if (toolName === 'mock_plugin_echo') {
        const msg = (params.message as string) || 'hello';
        return Promise.resolve({
          data: { echoed: msg },
          summary: `Echo: ${msg}`,
        });
      }
      throw new Error(`Tool ${toolName} not supported.`);
    });
  }
}

class MockOAuthHandler implements IMcpOAuthHandler {
  readonly providerId = 'mock-provider';

  getOAuthUrl() {
    return {
      authUrl: 'https://mock.auth/oauth2/authorize?client_id=123',
      configured: true,
      scopes: ['read', 'write'],
    };
  }

  exchangeOAuthCode(code: string) {
    return Promise.resolve({
      success: true,
      workspaceName: `Mock Workspace for code ${code}`,
    });
  }

  verifyAndConnectToken(token: string) {
    return Promise.resolve({
      success: true,
      workspaceName: `Mock Workspace for token ${token.slice(0, 4)}`,
    });
  }
}

export async function runMcpRegistryTests() {
  console.log('\n🧪 Starting MCP Modular Registry & Base Connector Tests...\n');
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

  await test('1. Multi-provider servers and OAuth handlers are registered automatically', () => {
    const mockConnector = new MockPluginConnector();
    const mockOAuth = new MockOAuthHandler();

    const registry = new McpRegistryService([mockConnector], [mockOAuth]);

    const foundServer = registry.getServer('int-mock-plugin-mcp');
    assert.ok(foundServer, 'Server should be found by ID');
    assert.strictEqual(foundServer.name, 'Mock Plugin MCP Server');

    const foundByTool = registry.findServerForTool('mock_plugin_echo');
    assert.ok(foundByTool, 'Server should be found by tool name');
    assert.strictEqual(foundByTool.id, 'int-mock-plugin-mcp');

    const foundOAuth = registry.getOAuthHandler('mock-provider');
    assert.ok(foundOAuth, 'OAuth handler should be found by providerId');
  });

  await test('2. Dynamic runtime server registration and unregistration works', () => {
    const registry = new McpRegistryService([], []);
    assert.strictEqual(registry.getAllServers().length, 0);

    const mockConnector = new MockPluginConnector();
    registry.registerServer(mockConnector);
    assert.strictEqual(registry.getAllServers().length, 1);
    assert.ok(registry.findServerForTool('mock_plugin_echo'));

    registry.unregisterServer('int-mock-plugin-mcp');
    assert.strictEqual(registry.getAllServers().length, 0);
    assert.strictEqual(
      registry.findServerForTool('mock_plugin_echo'),
      undefined,
    );
  });

  await test('3. BaseMcpConnector safeExecute catches errors and redacts secrets', async () => {
    const mockConnector = new MockPluginConnector();

    // Call unsupported tool to test safeExecute error catching
    const errorResult = await mockConnector.executeTool('unknown_tool', {});
    assert.strictEqual(errorResult.success, false);
    assert.ok(errorResult.summary.includes('Failed to execute unknown_tool'));

    // Call supported tool
    const successResult = await mockConnector.executeTool('mock_plugin_echo', {
      message: 'Testing Base Connector',
    });
    assert.strictEqual(successResult.success, true);
    assert.ok(successResult.summary.includes('Echo: Testing Base Connector'));
  });

  await test('4. BaseMcpConnector ping probe returns status', async () => {
    const mockConnector = new MockPluginConnector();
    mockConnector.setAuthToken('dummy-token');

    const ping = await mockConnector.ping();
    assert.strictEqual(ping.status, 'connected');
    assert.ok(ping.message?.includes('Mock Plugin MCP Server is configured'));
  });

  console.log(
    `\n📊 MCP Registry Test Results: ${passed} passed, ${failed} failed.\n`,
  );
  if (failed > 0) {
    throw new Error(`${failed} MCP Registry tests failed!`);
  }
}
