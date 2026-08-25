import assert from 'assert';
import { AndroidBridgeMcpConnector } from '../mcp/connectors/android-bridge/android-bridge-mcp.connector';
import { AndroidBridgeApiClient } from '../mcp/connectors/android-bridge/android-bridge-api.client';
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

let originalFetch: typeof global.fetch;

function setupFetchMock(
  mockHandler: (url: string, init?: RequestInit) => Promise<Response>,
) {
  originalFetch = global.fetch;
  global.fetch = mockHandler;
}

function restoreFetchMock() {
  if (originalFetch) {
    global.fetch = originalFetch;
  }
}

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
  await test('1. All 9 Android Bridge MCP tools are defined with valid schemas', () => {
    assert.strictEqual(
      ANDROID_BRIDGE_MCP_TOOLS.length,
      9,
      'Should have exactly 9 tools',
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
    assert.throws(() => validatePackageName(''), /wajib diisi/);
    assert.throws(
      () => validatePackageName('instagram'),
      /Format package name "instagram" tidak valid/,
    );
    assert.throws(() => validatePackageName('123.com.test'), /tidak valid/);
    assert.throws(() => validatePackageName('com..invalid'), /tidak valid/);
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
    assert.ok(report.includes('45 menit/hari'));
    assert.ok(report.includes('Tiktok'));
    assert.ok(report.includes('Aplikasi Diblokir'));
  });

  // 8. Raw Usage List Formatter
  await test('8. formatRawUsageList handles empty and populated lists', () => {
    const emptyReport = formatRawUsageList([]);
    assert.ok(emptyReport.includes('Tidak ada data'));

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

  // 9. API Client Ping Probe
  await test('9. AndroidBridgeApiClient ping returns status & device metadata', async () => {
    setupFetchMock(async (url) => {
      assert.ok(url.includes('/ping'));
      return new Response(
        JSON.stringify({ status: 'ok', device: 'Android Native MCP' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    });

    const client = new AndroidBridgeApiClient();
    const probe = await client.ping('http://127.0.0.1:8080');

    assert.strictEqual(probe.status, 'connected');
    assert.strictEqual(probe.device, 'Android Native MCP');
    assert.ok(probe.latencyMs >= 0);

    restoreFetchMock();
  });

  // 10. API Client Usage Telemetry
  await test('10. AndroidBridgeApiClient getUsage and getUsageSummary fetch telemetry correctly', async () => {
    setupFetchMock(async (url) => {
      if (url.includes('/mcp/tools/get_usage_summary')) {
        return new Response(
          JSON.stringify({
            date: '2026-08-25',
            totalScreenTimeMs: 7200000,
            mostUsedApp: 'com.google.android.youtube',
            apps: [
              {
                packageName: 'com.google.android.youtube',
                totalTimeInForegroundMs: 5400000,
                lastTimeUsed: 1724558400000,
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }
      if (url.includes('/mcp/tools/get_usage')) {
        return new Response(
          JSON.stringify([
            {
              packageName: 'com.instagram.android',
              totalTimeInForegroundMs: 1800000,
              lastTimeUsed: 1724557200000,
            },
          ]),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }
      throw new Error(`Unexpected url: ${url}`);
    });

    const client = new AndroidBridgeApiClient();
    const usage = await client.getUsage('http://127.0.0.1:8080');
    assert.strictEqual(usage.length, 1);
    assert.strictEqual(usage[0].packageName, 'com.instagram.android');

    const summary = await client.getUsageSummary('http://127.0.0.1:8080');
    assert.strictEqual(summary.date, '2026-08-25');
    assert.strictEqual(summary.mostUsedApp, 'com.google.android.youtube');

    restoreFetchMock();
  });

  // 11. API Client Foreground App Detection
  await test('11. AndroidBridgeApiClient getForegroundApp detects active application', async () => {
    setupFetchMock(async (url) => {
      assert.ok(url.includes('/mcp/tools/get_foreground_app'));
      return new Response(
        JSON.stringify({ currentForegroundApp: 'com.whatsapp' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    });

    const client = new AndroidBridgeApiClient();
    const res = await client.getForegroundApp('http://127.0.0.1:8080');
    assert.strictEqual(res.currentForegroundApp, 'com.whatsapp');

    restoreFetchMock();
  });

  // 12. API Client Focus Controls (Limit, Block, Restrictions, DND)
  await test('12. AndroidBridgeApiClient focus controls dispatch correct payloads', async () => {
    const capturedCalls: Array<{ url: string; body?: unknown }> = [];

    setupFetchMock(async (url, init) => {
      const body = init?.body ? JSON.parse(init.body as string) : undefined;
      capturedCalls.push({ url, body });

      if (url.includes('/mcp/tools/set_app_limit')) {
        return new Response(
          JSON.stringify({
            status: 'success',
            message: 'Limit of 45 mins set',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }
      if (url.includes('/mcp/tools/block_app')) {
        return new Response(
          JSON.stringify({
            status: 'success',
            message: 'App blocked',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }
      if (url.includes('/mcp/tools/set_dnd')) {
        return new Response(JSON.stringify({ status: 'success' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (url.includes('/mcp/tools/send_notification')) {
        return new Response(JSON.stringify({ status: 'success' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (url.includes('/mcp/tools/get_active_restrictions')) {
        return new Response(
          JSON.stringify({
            limits: [
              {
                packageName: 'com.instagram.android',
                maxDailyMinutes: 45,
                isBlocked: false,
              },
            ],
            blockedApps: ['com.tiktok.android'],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }
      throw new Error(`Unexpected URL: ${url}`);
    });

    const client = new AndroidBridgeApiClient();

    const limitRes = await client.setAppLimit(
      'http://127.0.0.1:8080',
      'com.instagram.android',
      45,
    );
    assert.strictEqual(limitRes.status, 'success');

    const blockRes = await client.blockApp(
      'http://127.0.0.1:8080',
      'com.tiktok.android',
      true,
    );
    assert.strictEqual(blockRes.status, 'success');

    const dndRes = await client.setDnd('http://127.0.0.1:8080', true);
    assert.strictEqual(dndRes.status, 'success');

    const notifRes = await client.sendNotification(
      'http://127.0.0.1:8080',
      'Focus Session',
      'Stay productive!',
    );
    assert.strictEqual(notifRes.status, 'success');

    const restrictions = await client.getActiveRestrictions(
      'http://127.0.0.1:8080',
    );
    assert.strictEqual(restrictions.limits.length, 1);
    assert.strictEqual(restrictions.blockedApps[0], 'com.tiktok.android');

    restoreFetchMock();
  });

  // 13. End-to-End Connector Tool Execution
  await test('13. AndroidBridgeMcpConnector routes all tools via executeTool safely', async () => {
    setupFetchMock(async (url) => {
      if (url.includes('/ping')) {
        return new Response(
          JSON.stringify({ status: 'ok', device: 'Android Pixel 8' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }
      if (url.includes('/mcp/tools/get_foreground_app')) {
        return new Response(
          JSON.stringify({ currentForegroundApp: 'com.whatsapp' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }
      if (url.includes('/mcp/tools/set_app_limit')) {
        return new Response(
          JSON.stringify({
            status: 'success',
            message: 'Limit configured',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }
      if (url.includes('/mcp/tools/block_app')) {
        return new Response(
          JSON.stringify({ status: 'success', message: 'Blocked' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }
      if (url.includes('/mcp/tools/set_dnd')) {
        return new Response(JSON.stringify({ status: 'success' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (url.includes('/mcp/tools/send_notification')) {
        return new Response(JSON.stringify({ status: 'success' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    const client = new AndroidBridgeApiClient();
    const gateway = new AndroidBridgeGatewayService();
    const connector = new AndroidBridgeMcpConnector(client, gateway);
    connector.configure({ endpoint: 'http://127.0.0.1:8080' });

    assert.strictEqual(connector.id, 'int-android-bridge-mcp');
    assert.strictEqual(connector.category, 'productivity');

    // Test device status tool
    const statusRes = await connector.executeTool(
      'android_get_device_status',
      {},
    );
    assert.strictEqual(statusRes.success, true);
    assert.ok(statusRes.summary.includes('Android Bridge terhubung'));

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
    assert.ok(limitRes.summary.includes('30 menit/hari'));

    // Test block app tool
    const blockRes = await connector.executeTool('android_block_app', {
      packageName: 'com.tiktok.android',
      block: true,
    });
    assert.strictEqual(blockRes.success, true);
    assert.ok(blockRes.summary.includes('diblokir'));
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

    restoreFetchMock();
  });

  // 14. Connector Error Handling & Validation
  await test('14. AndroidBridgeMcpConnector handles errors and invalid inputs gracefully', async () => {
    const client = new AndroidBridgeApiClient();
    const gateway = new AndroidBridgeGatewayService();
    const connector = new AndroidBridgeMcpConnector(client, gateway);

    // Missing package name in set_app_limit
    const res1 = await connector.executeTool('android_set_app_limit', {
      packageName: '',
      maxDailyMinutes: 30,
    });
    assert.strictEqual(res1.success, false);
    assert.ok(res1.summary.includes('Gagal mengeksekusi'));

    // Invalid package format in block_app
    const res2 = await connector.executeTool('android_block_app', {
      packageName: 'invalid-name',
      block: true,
    });
    assert.strictEqual(res2.success, false);
    assert.ok(res2.summary.includes('Gagal mengeksekusi'));

    // Empty message in send_notification
    const res3 = await connector.executeTool('android_send_notification', {
      title: 'Alert',
      message: '',
    });
    assert.strictEqual(res3.success, false);
    assert.ok(res3.summary.includes('Gagal mengeksekusi'));

    // Unknown tool
    const res4 = await connector.executeTool('android_unknown_tool', {});
    assert.strictEqual(res4.success, false);
    assert.ok(res4.summary.includes('tidak didukung'));
  });

  // 15. Offline Device Probe Handling
  await test('15. AndroidBridgeMcpConnector ping probe handles offline device without throwing', async () => {
    setupFetchMock(async () => {
      throw new Error('fetch failed (ECONNREFUSED)');
    });

    const client = new AndroidBridgeApiClient();
    const gateway = new AndroidBridgeGatewayService();
    const connector = new AndroidBridgeMcpConnector(client, gateway);
    connector.configure({ endpoint: 'http://127.0.0.1:8080' });

    const probe = await connector.ping();
    assert.strictEqual(probe.status, 'disconnected');
    assert.ok(
      probe.message?.includes('offline') ||
        probe.message?.includes('Tidak dapat terhubung'),
    );

    restoreFetchMock();
  });

  // 16. Android Pairing Service - Session Creation
  await test('16. AndroidPairingService creates pairing session with valid QR payload and PIN', async () => {
    const mockIntegrationsService = {
      updateIntegration: async () => null,
    } as any;
    const mockRegistry = {
      getServer: () => null,
    } as any;

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
      updateIntegration: async (_id: string, updates: any) => {
        savedEndpoint = updates.endpoint;
        savedStatus = updates.status;
        return null;
      },
    } as any;
    const mockRegistry = {
      getServer: () => null,
    } as any;

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
      updateIntegration: async (_id: string, updates: any) => {
        savedEndpoint = updates.endpoint;
        return null;
      },
    } as any;
    const mockRegistry = {
      getServer: () => null,
    } as any;

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

  console.log(
    `\n📊 Android Bridge Test Results: ${passed} passed, ${failed} failed.\n`,
  );
  if (failed > 0) {
    throw new Error(`${failed} test(s) failed in Android Bridge test suite.`);
  }
}
