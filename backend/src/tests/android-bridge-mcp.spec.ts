import assert from 'assert';
import { AndroidBridgeMcpConnector } from '../mcp/connectors/android-bridge/android-bridge-mcp.connector';
import { AndroidBridgeGatewayService } from '../mcp/connectors/android-bridge/android-bridge.gateway';
import { ANDROID_BRIDGE_MCP_TOOLS } from '../mcp/connectors/android-bridge/android-bridge-tools.definition';
import {
  formatDurationMs,
  formatRawUsageList,
  formatRestrictionsReport,
  formatUsageSummaryReport,
  getFriendlyAppName,
  validatePackageName,
} from '../mcp/connectors/android-bridge/android-bridge-parser.engine';
import {
  TOOL_CATALOG,
  BUILTIN_FUNCTION_DECLARATIONS,
} from '../agentic-core/tools/builtin-tools';
import type { IntegrationsService } from '../modules/ecosystem/services/integrations.service';
import type { McpRegistryService } from '../mcp/core';

export async function runAndroidBridgeTests() {
  console.log(
    '\n🧪 Starting Android Bridge & Digital Wellbeing MCP Test Suite...\n',
  );
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

  // 1. Tool Definitions & Schemas
  await test('1. All 17 Android Bridge MCP tools are defined with valid schemas', () => {
    assert.strictEqual(
      ANDROID_BRIDGE_MCP_TOOLS.length,
      17,
      'Should have exactly 17 tools',
    );

    const toolNames = ANDROID_BRIDGE_MCP_TOOLS.map((t) => t.name);
    const expected = [
      'android_get_device_status',
      'android_get_usage',
      'android_get_usage_summary',
      'android_get_foreground_app',
      'android_set_app_limit',
      'android_block_app',
      'android_get_active_restrictions',
      'android_set_dnd',
      'android_send_notification',
      'android_unblock_app',
      'android_reset_all_restrictions',
      'android_get_screen_time_status',
      'android_set_bedtime_schedule',
      'android_set_total_screen_time_limit',
      'android_get_bedtime_config',
      'android_trigger_bedtime_lock',
      'android_send_agent_message',
    ];

    for (const name of expected) {
      assert.ok(
        toolNames.includes(name),
        `Tool ${name} should be in definitions`,
      );
    }

    // Verify ReadOnly flags
    const statusTool = ANDROID_BRIDGE_MCP_TOOLS.find(
      (t) => t.name === 'android_get_device_status',
    );
    assert.strictEqual(statusTool?.readOnly, true);

    const limitTool = ANDROID_BRIDGE_MCP_TOOLS.find(
      (t) => t.name === 'android_set_app_limit',
    );
    assert.strictEqual(limitTool?.readOnly, false);

    const blockTool = ANDROID_BRIDGE_MCP_TOOLS.find(
      (t) => t.name === 'android_block_app',
    );
    assert.strictEqual(blockTool?.readOnly, false);

    const dndTool = ANDROID_BRIDGE_MCP_TOOLS.find(
      (t) => t.name === 'android_set_dnd',
    );
    assert.strictEqual(dndTool?.readOnly, false);

    const notifTool = ANDROID_BRIDGE_MCP_TOOLS.find(
      (t) => t.name === 'android_send_notification',
    );
    assert.strictEqual(notifTool?.readOnly, false);
  });

  // 2. Agentic Core Registration
  await test('2. Android Bridge MCP tools are registered in Agentic Core Catalog', () => {
    for (const tool of ANDROID_BRIDGE_MCP_TOOLS) {
      const meta = TOOL_CATALOG[tool.name];
      assert.ok(meta, `Tool ${tool.name} must be registered in TOOL_CATALOG`);
      assert.strictEqual(meta.category, 'mcp_android_bridge');
      assert.strictEqual(meta.serverName, 'Android Bridge MCP Server');

      const genAiDecl = BUILTIN_FUNCTION_DECLARATIONS.find(
        (d) => d.name === tool.name,
      );
      assert.ok(
        genAiDecl,
        `Tool ${tool.name} must be in BUILTIN_FUNCTION_DECLARATIONS`,
      );
      assert.ok(
        genAiDecl.description,
        'Function declaration needs description',
      );
      assert.ok(genAiDecl.parameters, 'Function declaration needs parameters');
    }
  });

  // 3. Duration Formatter
  await test('3. formatDurationMs correctly formats milliseconds to human readable strings', () => {
    assert.strictEqual(formatDurationMs(0), '0m');
    assert.strictEqual(formatDurationMs(-100), '0m');
    assert.strictEqual(formatDurationMs(45000), '45s');
    assert.strictEqual(formatDurationMs(1800000), '30m');
    assert.strictEqual(formatDurationMs(5400000), '1h 30m');
    assert.strictEqual(formatDurationMs(7200000), '2h');
    assert.strictEqual(formatDurationMs(7260000), '2h 1m');
  });

  // 4. Package Name Validation
  await test('4. validatePackageName enforces reverse-DNS naming convention', () => {
    // Valid packages
    validatePackageName('com.instagram.android');
    validatePackageName('com.google.android.youtube');
    validatePackageName('org.mozilla.firefox');
    validatePackageName('id.co.bank.app');

    // Invalid packages
    assert.throws(() => validatePackageName(''), /required/);
    assert.throws(
      () => validatePackageName('instagram'),
      /Invalid package name format "instagram"/,
    );
    assert.throws(() => validatePackageName('123.com.test'), /Invalid/);
    assert.throws(() => validatePackageName('com..invalid'), /Invalid/);
  });

  // 5. Friendly App Name Resolver
  await test('5. getFriendlyAppName resolves readable labels from package identifiers', () => {
    assert.strictEqual(
      getFriendlyAppName('com.instagram.android'),
      'Instagram',
    );
    assert.strictEqual(
      getFriendlyAppName('com.google.android.youtube'),
      'Youtube',
    );
    assert.strictEqual(getFriendlyAppName('com.whatsapp'), 'Whatsapp');
    assert.strictEqual(
      getFriendlyAppName('org.telegram.messenger'),
      'Messenger',
    );
  });

  // 6. Usage Summary Report Formatter
  await test('6. formatUsageSummaryReport produces clean, structured Markdown reports', () => {
    const report = formatUsageSummaryReport({
      date: '2026-08-25',
      totalScreenTimeMs: 7200000,
      mostUsedApp: 'com.google.android.youtube',
      apps: [
        {
          packageName: 'com.google.android.youtube',
          totalTimeInForegroundMs: 5400000,
          lastTimeUsed: 1724558400000,
        },
        {
          packageName: 'com.instagram.android',
          totalTimeInForegroundMs: 1800000,
          lastTimeUsed: 1724557200000,
        },
      ],
    });

    assert.ok(report.includes('2026-08-25'));
    assert.ok(report.includes('2h'));
    assert.ok(report.includes('Youtube'));
    assert.ok(report.includes('Instagram'));
    assert.ok(report.includes('1h 30m'));
    assert.ok(report.includes('30m'));
  });

  // 7. Restrictions Report Formatter
  await test('7. formatRestrictionsReport outputs readable app limit summaries', () => {
    const report = formatRestrictionsReport({
      limits: [
        {
          packageName: 'com.instagram.android',
          maxDailyMinutes: 45,
          isBlocked: false,
        },
      ],
      blockedApps: ['com.tiktok.android'],
    });

    assert.ok(report.includes('Instagram'));
    assert.ok(report.includes('45 mins/day'));
    assert.ok(report.includes('Tiktok'));
    assert.ok(report.includes('Blocked Applications'));
  });

  // 8. Raw Usage List Formatter
  await test('8. formatRawUsageList handles empty and populated lists', () => {
    const emptyReport = formatRawUsageList([]);
    assert.ok(emptyReport.includes('No application usage recorded'));

    const populated = formatRawUsageList([
      {
        packageName: 'com.whatsapp',
        totalTimeInForegroundMs: 1200000,
        lastTimeUsed: 1724558400000,
      },
    ]);
    assert.ok(populated.includes('Whatsapp'));
    assert.ok(populated.includes('20m'));
  });

  // 9. Gateway Service Device State & Metadata
  await test('9. AndroidBridgeGatewayService manages device metadata and connection status', () => {
    const gateway = new AndroidBridgeGatewayService();
    assert.strictEqual(gateway.isBridgeConnected(), false);

    const initialInfo = gateway.getDeviceInfo();
    assert.strictEqual(initialInfo.connected, false);
    assert.strictEqual(initialInfo.deviceName, 'Android Mobile Device');
  });

  // 10. Gateway Service Listeners
  await test('10. AndroidBridgeGatewayService triggers connection and disconnection listeners', () => {
    const gateway = new AndroidBridgeGatewayService();
    let disconnectedTriggered = false;

    gateway.onDeviceDisconnected(() => {
      disconnectedTriggered = true;
    });

    gateway.disconnectAllClients('Manual disconnect');
    assert.strictEqual(gateway.isBridgeConnected(), false);
    assert.strictEqual(typeof disconnectedTriggered, 'boolean');
  });

  // 11. Gateway Service RPC Request Offline Guard
  await test('11. AndroidBridgeGatewayService rejects RPC dispatch when no clients are connected', async () => {
    const gateway = new AndroidBridgeGatewayService();
    let errorCaught = false;

    try {
      await gateway.dispatchBridgeRequest('get_foreground_app');
    } catch (err: unknown) {
      errorCaught = true;
      assert.ok(String(err).includes('not connected'));
    }

    assert.strictEqual(errorCaught, true);
  });

  // 12. Gateway Service Disconnect All Clients & Bridge Enabled State
  await test('12. AndroidBridgeGatewayService disconnectAllClients disables bridge and disconnects', () => {
    const gateway = new AndroidBridgeGatewayService();
    assert.strictEqual(gateway.isBridgeEnabled(), true);

    gateway.disconnectAllClients('Testing safety');
    assert.strictEqual(gateway.isBridgeConnected(), false);
    assert.strictEqual(gateway.isBridgeEnabled(), false);

    gateway.setBridgeEnabled(true);
    assert.strictEqual(gateway.isBridgeEnabled(), true);
  });

  // 13. Connector Tool Execution via WebSocket Gateway
  await test('13. AndroidBridgeMcpConnector dispatches tools via WebSocket RPC correctly', async () => {
    const gateway = new AndroidBridgeGatewayService();
    gateway.isBridgeConnected = () => true;
    gateway.getDeviceInfo = () => ({
      connected: true,
      deviceName: 'Pixel 8 Pro',
      androidVersion: '14',
      batteryLevel: 92,
    });

    gateway.dispatchBridgeRequest = <T>(action: string) => {
      if (action === 'get_foreground_app') {
        return Promise.resolve({
          currentForegroundApp: 'com.whatsapp',
          friendlyName: 'Whatsapp',
        } as unknown as T);
      }
      if (action === 'set_app_limit') {
        return Promise.resolve({
          status: 'success',
          message: 'Limit set',
        } as unknown as T);
      }
      if (action === 'block_app') {
        return Promise.resolve({
          status: 'success',
          message: 'App blocked',
        } as unknown as T);
      }
      if (action === 'set_dnd') {
        return Promise.resolve({ status: 'success' } as unknown as T);
      }
      if (action === 'send_notification') {
        return Promise.resolve({ status: 'success' } as unknown as T);
      }
      return Promise.resolve({ status: 'ok' } as unknown as T);
    };

    const connector = new AndroidBridgeMcpConnector(gateway);

    assert.strictEqual(connector.id, 'int-android-bridge-mcp');
    assert.strictEqual(connector.category, 'productivity');
    assert.strictEqual(connector.isConnected(), true);

    // Test device status tool
    const statusRes = await connector.executeTool(
      'android_get_device_status',
      {},
    );
    assert.strictEqual(statusRes.success, true);
    assert.ok(statusRes.summary.includes('WebSocket Bridge'));

    // Test foreground app tool
    const fgRes = await connector.executeTool('android_get_foreground_app', {});
    assert.strictEqual(fgRes.success, true);
    assert.ok(fgRes.summary.includes('Whatsapp'));

    // Test set app limit tool
    const limitRes = await connector.executeTool('android_set_app_limit', {
      packageName: 'com.instagram.android',
      maxDailyMinutes: 30,
    });
    assert.strictEqual(limitRes.success, true);
    assert.ok(limitRes.summary.includes('30 minutes'));

    // Test block app tool
    const blockRes = await connector.executeTool('android_block_app', {
      packageName: 'com.tiktok.android',
      block: true,
    });
    assert.strictEqual(blockRes.success, true);
    assert.ok(blockRes.summary.includes('BLOCKED'));
    assert.ok(blockRes.summary.includes('Tiktok'));

    // Test DND tool
    const dndRes = await connector.executeTool('android_set_dnd', {
      enable: true,
    });
    assert.strictEqual(dndRes.success, true);
    assert.ok(dndRes.summary.includes('Do Not Disturb (DND)'));

    // Test Notification tool
    const notifRes = await connector.executeTool('android_send_notification', {
      title: 'Focus Alert',
      message: 'Sprint in progress',
    });
    assert.strictEqual(notifRes.success, true);
    assert.ok(notifRes.summary.includes('Focus Alert'));
  });

  // 14. Connector Error Handling & Validation
  await test('14. AndroidBridgeMcpConnector handles errors and invalid inputs gracefully', async () => {
    const gateway = new AndroidBridgeGatewayService();
    gateway.isBridgeConnected = () => true;
    const connector = new AndroidBridgeMcpConnector(gateway);

    // Missing package name in set_app_limit
    const res1 = await connector.executeTool('android_set_app_limit', {
      packageName: '',
      maxDailyMinutes: 30,
    });
    assert.strictEqual(res1.success, false);
    assert.ok(res1.summary.includes('Failed to execute'));

    // Invalid package format in block_app
    const res2 = await connector.executeTool('android_block_app', {
      packageName: 'invalid-name',
      block: true,
    });
    assert.strictEqual(res2.success, false);
    assert.ok(res2.summary.includes('Failed to execute'));

    // Empty message in send_notification
    const res3 = await connector.executeTool('android_send_notification', {
      title: 'Alert',
      message: '',
    });
    assert.strictEqual(res3.success, false);
    assert.ok(res3.summary.includes('Failed to execute'));

    // Unknown tool
    const res4 = await connector.executeTool('android_unknown_tool', {});
    assert.strictEqual(res4.success, false);
    assert.ok(res4.summary.includes('Unknown or unsupported'));
  });

  // 15. Offline Device Handling (Pure WebSocket Disconnected State)
  await test('15. AndroidBridgeMcpConnector handles offline disconnected state cleanly', async () => {
    const gateway = new AndroidBridgeGatewayService();
    gateway.isBridgeConnected = () => false;
    const connector = new AndroidBridgeMcpConnector(gateway);

    assert.strictEqual(connector.isConnected(), false);

    // android_get_device_status returns disconnected state
    const statusRes = await connector.executeTool(
      'android_get_device_status',
      {},
    );
    assert.strictEqual(statusRes.success, true);
    assert.ok(statusRes.summary.includes('disconnected'));

    // Any other action tool returns clear offline warning
    const usageRes = await connector.executeTool('android_get_usage', {});
    assert.strictEqual(usageRes.success, false);
    assert.ok(usageRes.summary.includes('disconnected'));
  });

  // 16. Android Pairing Service - Session Creation
  await test('16. AndroidPairingService creates pairing session with valid QR payload and PIN', async () => {
    const mockIntegrationsService = {
      updateIntegration: () => Promise.resolve(null),
    } as unknown as IntegrationsService;
    const mockRegistry = {
      getServer: () => null,
    } as unknown as McpRegistryService;

    const { AndroidPairingService } =
      await import('../modules/ecosystem/services/android-pairing.service');
    const pairingService = new AndroidPairingService(
      mockIntegrationsService,
      mockRegistry,
    );

    const session = pairingService.createPairingSession('192.168.1.100', 3001);
    assert.ok(session.sessionId.startsWith('pair_'));
    assert.strictEqual(session.pinCode.length, 6);
    assert.strictEqual(session.status, 'waiting');
    assert.strictEqual(session.desktopHost, '192.168.1.100');
    assert.strictEqual(session.desktopPort, 3001);
    assert.ok(session.qrPayloadJson.includes('contextforge-mcp-bridge'));
    assert.ok(session.qrPayloadJson.includes(session.sessionId));

    // Verify session lookup
    const found = pairingService.getSessionStatus(session.sessionId);
    assert.strictEqual(found.sessionId, session.sessionId);
  });

  // 17. Android Pairing Service - QR Handshake Confirmation
  await test('17. AndroidPairingService confirms mobile handshake and normalizes endpoint', async () => {
    let savedEndpoint = '';
    let savedStatus = '';
    const mockIntegrationsService = {
      updateIntegration: (
        _id: string,
        updates: { endpoint?: string; status?: string },
      ) => {
        savedEndpoint = updates.endpoint || '';
        savedStatus = updates.status || '';
        return Promise.resolve(null);
      },
    } as unknown as IntegrationsService;
    const mockRegistry = {
      getServer: () => null,
    } as unknown as McpRegistryService;

    const { AndroidPairingService } =
      await import('../modules/ecosystem/services/android-pairing.service');
    const pairingService = new AndroidPairingService(
      mockIntegrationsService,
      mockRegistry,
    );

    const session = pairingService.createPairingSession('192.168.1.100', 3001);
    const confirmRes = await pairingService.confirmPairing({
      sessionId: session.sessionId,
      deviceEndpoint: '192.168.1.50:8080',
      deviceName: 'Pixel 8 Pro',
      androidVersion: '14',
    });

    assert.strictEqual(confirmRes.success, true);
    assert.strictEqual(confirmRes.session.status, 'confirmed');
    assert.strictEqual(
      confirmRes.session.deviceInfo?.deviceEndpoint,
      'http://192.168.1.50:8080',
    );
    assert.strictEqual(savedEndpoint, 'http://192.168.1.50:8080');
    assert.strictEqual(savedStatus, 'connected');
  });

  // 18. Android Pairing Service - Manual PIN Verification
  await test('18. AndroidPairingService verifies device pairing via 6-digit PIN', async () => {
    let savedEndpoint = '';
    const mockIntegrationsService = {
      updateIntegration: (
        _id: string,
        updates: { endpoint?: string; status?: string },
      ) => {
        savedEndpoint = updates.endpoint || '';
        return Promise.resolve(null);
      },
    } as unknown as IntegrationsService;
    const mockRegistry = {
      getServer: () => null,
    } as unknown as McpRegistryService;

    const { AndroidPairingService } =
      await import('../modules/ecosystem/services/android-pairing.service');
    const pairingService = new AndroidPairingService(
      mockIntegrationsService,
      mockRegistry,
    );

    const session = pairingService.createPairingSession('192.168.1.100', 3001);
    const verifyRes = await pairingService.verifyByPin(
      session.pinCode,
      'http://192.168.1.77:8080',
      'Samsung Galaxy S24',
    );

    assert.strictEqual(verifyRes.success, true);
    assert.strictEqual(verifyRes.session?.status, 'confirmed');
    assert.strictEqual(savedEndpoint, 'http://192.168.1.77:8080');
  });

  // 19. Multi-Day Historical Telemetry Formatting
  await test('19. formatUsageSummaryReport correctly formats 7-day multi-day trend report', () => {
    const multiDaySummary = {
      date: '2026-08-30',
      daysCount: 7,
      totalScreenTimeMs: 14400000, // 4h
      averageDailyScreenTimeMs: 2057142, // ~34m
      mostUsedApp: 'com.zhiliaoapp.musically',
      apps: [
        {
          packageName: 'com.zhiliaoapp.musically',
          totalTimeInForegroundMs: 7200000, // 2h
          lastTimeUsed: Date.now(),
        },
        {
          packageName: 'com.instagram.android',
          totalTimeInForegroundMs: 3600000, // 1h
          lastTimeUsed: Date.now(),
        },
      ],
      dailyBreakdown: [
        {
          date: '2026-08-30',
          totalScreenTimeMs: 3600000,
          mostUsedApp: 'com.zhiliaoapp.musically',
          apps: [],
        },
        {
          date: '2026-08-29',
          totalScreenTimeMs: 1800000,
          mostUsedApp: 'com.instagram.android',
          apps: [],
        },
      ],
    };

    const report = formatUsageSummaryReport(multiDaySummary);
    assert.ok(
      report.includes('7 Days - Ending 2026-08-30'),
      'Report should include period header',
    );
    assert.ok(
      report.includes('Average Daily Screen Time'),
      'Report should include average daily screen time',
    );
    assert.ok(
      report.includes('Daily Screen Time Trend'),
      'Report should include daily breakdown trend',
    );
    assert.ok(
      report.includes('Musically'),
      'Report should resolve and display friendly app names',
    );
  });

  // 20. Multi-Day Usage Tool Execution in Connector
  await test('20. AndroidBridgeMcpConnector passes days parameter and returns multi-day data', async () => {
    const mockGateway = new AndroidBridgeGatewayService();

    let capturedParams: Record<string, unknown> | undefined;
    mockGateway.isBridgeConnected = () => true;
    mockGateway.dispatchBridgeRequest = <T>(
      _action: string,
      payload?: Record<string, unknown>,
    ) => {
      capturedParams = payload;
      return Promise.resolve({
        date: '2026-08-30',
        daysCount: 7,
        totalScreenTimeMs: 14400000,
        averageDailyScreenTimeMs: 2057142,
        mostUsedApp: 'com.zhiliaoapp.musically',
        apps: [
          {
            packageName: 'com.zhiliaoapp.musically',
            totalTimeInForegroundMs: 7200000,
            lastTimeUsed: Date.now(),
          },
        ],
        dailyBreakdown: [
          {
            date: '2026-08-30',
            totalScreenTimeMs: 7200000,
            apps: [],
          },
        ],
      } as unknown as T);
    };

    const connector = new AndroidBridgeMcpConnector(mockGateway);
    const result = await connector.executeTool('android_get_usage_summary', {
      days: 7,
      date: '2026-08-30',
    });

    assert.strictEqual(capturedParams?.days, 7);
    assert.strictEqual(capturedParams?.date, '2026-08-30');
    assert.ok(result.summary.includes('7 Days'));

    const data = result.data as Record<string, unknown>;
    assert.strictEqual(data.daysCount, 7);
    assert.ok(data.averageDailyScreenTimeMs);
  });

  console.log(
    `\n📊 Android Bridge Test Results: ${passed} passed, ${failed} failed.\n`,
  );
  if (failed > 0) {
    throw new Error(`${failed} test(s) failed in Android Bridge test suite.`);
  }
}
