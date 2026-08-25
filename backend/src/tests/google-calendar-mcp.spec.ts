import assert from 'assert';
import { GoogleCalendarMcpConnector } from '../mcp/connectors/google-calendar/google-calendar-mcp.connector';
import { GoogleCalendarApiClient } from '../mcp/connectors/google-calendar/google-calendar-api.client';
import { GoogleCalendarOAuthService } from '../mcp/connectors/google-calendar/google-calendar-oauth.service';
import { GOOGLE_CALENDAR_MCP_TOOLS } from '../mcp/connectors/google-calendar/google-calendar-tools.definition';
import {
  parseEventDateTime,
  calculateFreeSlots,
  validateTimeRange,
  formatEventSummary,
} from '../mcp/connectors/google-calendar/google-calendar-parser.engine';
import {
  TOOL_CATALOG,
  BUILTIN_FUNCTION_DECLARATIONS,
} from '../agentic-core/tools/builtin-tools';
import { McpHttpTransport } from '../mcp/core';
import { DatabaseService } from '../common/database/database.service';
import { EncryptionService } from '../common/security/encryption.service';

/**
 * Mock global fetch for unit tests
 */
let originalFetch: typeof global.fetch;

export function setupFetchMock(
  mockHandler: (url: string, init?: RequestInit) => Promise<Response>,
) {
  originalFetch = global.fetch;
  global.fetch = mockHandler;
}

export function restoreFetchMock() {
  if (originalFetch) {
    global.fetch = originalFetch;
  }
}

interface CapturedEventBody {
  summary?: string;
  location?: string;
  start?: { dateTime?: string; date?: string; timeZone?: string };
  end?: { dateTime?: string; date?: string; timeZone?: string };
  attendees?: Array<{ email: string }>;
  timeZone?: string;
}

export async function runGoogleCalendarTests() {
  console.log(
    '\n🧪 Starting Google Calendar MCP Comprehensive Test Suite...\n',
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

  // Helper to create a test connector with typed dummy McpHttpTransport
  const createTestConnector = (apiClient: GoogleCalendarApiClient) => {
    const dummyHttpTransport = {} as McpHttpTransport;
    return new GoogleCalendarMcpConnector(dummyHttpTransport, apiClient);
  };

  // =========================================================================
  // 1. TOOL DEFINITIONS & REGISTRATION
  // =========================================================================
  await test('1. All 7 Google Calendar MCP tools are defined with valid schemas', () => {
    assert.strictEqual(GOOGLE_CALENDAR_MCP_TOOLS.length, 7);

    const toolNames = GOOGLE_CALENDAR_MCP_TOOLS.map((t) => t.name);
    assert.ok(toolNames.includes('google_calendar_list_calendars'));
    assert.ok(toolNames.includes('google_calendar_list_events'));
    assert.ok(toolNames.includes('google_calendar_get_event'));
    assert.ok(toolNames.includes('google_calendar_create_event'));
    assert.ok(toolNames.includes('google_calendar_update_event'));
    assert.ok(toolNames.includes('google_calendar_delete_event'));
    assert.ok(toolNames.includes('google_calendar_check_availability'));

    for (const tool of GOOGLE_CALENDAR_MCP_TOOLS) {
      assert.ok(tool.id, `Tool ${tool.name} missing id`);
      assert.ok(tool.description, `Tool ${tool.name} missing description`);
      assert.ok(tool.parametersSchema, `Tool ${tool.name} missing schema`);
    }
  });

  await test('2. Google Calendar MCP tools are registered in Agentic Core Catalog', () => {
    for (const tool of GOOGLE_CALENDAR_MCP_TOOLS) {
      const catalogEntry = TOOL_CATALOG[tool.name];
      assert.ok(catalogEntry, `Tool ${tool.name} missing in TOOL_CATALOG`);
      assert.strictEqual(catalogEntry.category, 'mcp_google_calendar');
      assert.strictEqual(catalogEntry.serverName, 'Google Calendar MCP Server');
    }

    const declaredNames = BUILTIN_FUNCTION_DECLARATIONS.map((d) => d.name);
    assert.ok(declaredNames.includes('google_calendar_list_events'));
    assert.ok(declaredNames.includes('google_calendar_create_event'));
  });

  // =========================================================================
  // 2. PARSER & DATETIME ENGINE
  // =========================================================================
  await test('3. Datetime parser handles ISO 8601, timezones, and all-day dates', () => {
    // Timed event with explicit timezone
    const timed = parseEventDateTime(
      '2026-08-25T14:00:00+07:00',
      'Asia/Jakarta',
      false,
    );
    assert.ok(timed.dateTime);
    assert.strictEqual(timed.timeZone, 'Asia/Jakarta');

    // All-day event
    const allDay = parseEventDateTime('2026-08-25', 'Asia/Jakarta', true);
    assert.strictEqual(allDay.date, '2026-08-25');
    assert.strictEqual(allDay.dateTime, undefined);

    // Invalid format error
    assert.throws(() => {
      parseEventDateTime('not-a-date');
    }, /Invalid datetime format/);
  });

  await test('4. Time range validation enforces start < end', () => {
    validateTimeRange('2026-08-25T10:00:00Z', '2026-08-25T11:00:00Z');

    assert.throws(() => {
      validateTimeRange('2026-08-25T12:00:00Z', '2026-08-25T11:00:00Z');
    }, /start time .* must be earlier than end time/);
  });

  await test('5. Free/Busy slot calculation correctly determines open windows', () => {
    const busy = [
      {
        start: '2026-08-25T09:00:00.000Z',
        end: '2026-08-25T10:00:00.000Z',
      },
      {
        start: '2026-08-25T13:00:00.000Z',
        end: '2026-08-25T14:00:00.000Z',
      },
    ];

    const freeSlots = calculateFreeSlots(
      busy,
      '2026-08-25T08:00:00.000Z',
      '2026-08-25T17:00:00.000Z',
    );

    assert.strictEqual(freeSlots.length, 3);
    assert.strictEqual(freeSlots[0].start, '2026-08-25T08:00:00.000Z');
    assert.strictEqual(freeSlots[0].end, '2026-08-25T09:00:00.000Z');
    assert.strictEqual(freeSlots[1].start, '2026-08-25T10:00:00.000Z');
    assert.strictEqual(freeSlots[1].end, '2026-08-25T13:00:00.000Z');
    assert.strictEqual(freeSlots[2].start, '2026-08-25T14:00:00.000Z');
    assert.strictEqual(freeSlots[2].end, '2026-08-25T17:00:00.000Z');
  });

  await test('6. Event summary formatter produces readable string representation', () => {
    const summary = formatEventSummary({
      id: 'ev-1',
      summary: 'ContextForge Architecture Sync',
      location: 'Google Meet',
      start: { dateTime: '2026-08-25T14:00:00+07:00' },
      end: { dateTime: '2026-08-25T15:00:00+07:00' },
      attendees: [{ email: 'engineer@contextforge.ai' }],
    });

    assert.ok(summary.includes('ContextForge Architecture Sync'));
    assert.ok(summary.includes('Google Meet'));
    assert.ok(summary.includes('1 attendees'));
  });

  // =========================================================================
  // 3. AUTHENTICATION & DISCONNECTED STATE
  // =========================================================================
  await test('7. Connector gracefully returns disconnected state when no token is present', async () => {
    const oldKey = process.env.GOOGLE_ACCESS_TOKEN;
    const oldCalKey = process.env.GOOGLE_CALENDAR_TOKEN;
    delete process.env.GOOGLE_ACCESS_TOKEN;
    delete process.env.GOOGLE_CALENDAR_TOKEN;

    const apiClient = new GoogleCalendarApiClient();
    const connector = createTestConnector(apiClient);
    connector.setAuthToken('');

    const result = await connector.executeTool('google_calendar_list_events', {
      calendarId: 'primary',
    });

    assert.strictEqual(result.success, false);
    const data = result.data as Record<string, unknown>;
    assert.strictEqual(data.connected, false);
    assert.strictEqual(data.status, 'unauthenticated');
    assert.ok(result.summary.includes('belum terhubung'));

    if (oldKey) process.env.GOOGLE_ACCESS_TOKEN = oldKey;
    if (oldCalKey) process.env.GOOGLE_CALENDAR_TOKEN = oldCalKey;
  });

  await test('8. OAuth service generates valid authorization URL with proper scopes', () => {
    process.env.GOOGLE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com';
    process.env.GOOGLE_REDIRECT_URI =
      'http://localhost:3001/api/ecosystem/oauth/google-calendar/callback';

    const dummyDb = {} as DatabaseService;
    const dummyCrypto = {} as EncryptionService;
    const dummyConnector = {} as GoogleCalendarMcpConnector;
    const oauthService = new GoogleCalendarOAuthService(
      dummyDb,
      dummyCrypto,
      dummyConnector,
    );

    const res = oauthService.getOAuthUrl();
    assert.strictEqual(res.configured, true);
    assert.ok(
      res.authUrl.startsWith('https://accounts.google.com/o/oauth2/v2/auth'),
    );
    assert.ok(
      res.authUrl.includes(
        'client_id=test-client-id.apps.googleusercontent.com',
      ),
    );
    assert.ok(res.authUrl.includes('scope='));
    assert.ok(
      res.scopes.includes('https://www.googleapis.com/auth/calendar.events'),
    );
    assert.ok(
      res.scopes.includes('https://www.googleapis.com/auth/calendar.readonly'),
    );
  });

  // =========================================================================
  // 4. API CLIENT & MOCK TOOL EXECUTIONS
  // =========================================================================
  await test('9. google_calendar_list_calendars executes successfully with mock API', async () => {
    setupFetchMock((url) => {
      assert.ok(url.includes('/users/me/calendarList'));
      return Promise.resolve(
        new Response(
          JSON.stringify({
            items: [
              {
                id: 'primary',
                summary: 'Personal Calendar',
                timeZone: 'Asia/Jakarta',
                primary: true,
                accessRole: 'owner',
              },
              {
                id: 'work@contextforge.ai',
                summary: 'Work Projects',
                timeZone: 'Asia/Jakarta',
                primary: false,
                accessRole: 'writer',
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      );
    });

    try {
      const apiClient = new GoogleCalendarApiClient();
      const connector = createTestConnector(apiClient);
      connector.setAuthToken('mock-valid-access-token');

      const result = await connector.executeTool(
        'google_calendar_list_calendars',
        {},
      );

      assert.strictEqual(result.success, true);
      const data = result.data as {
        totalDiscovered: number;
        calendars: Array<{ id: string; summary: string }>;
      };
      assert.strictEqual(data.totalDiscovered, 2);
      assert.strictEqual(data.calendars[0].summary, 'Personal Calendar');
      assert.ok(result.summary.includes('Berhasil menemukan 2 kalender'));
    } finally {
      restoreFetchMock();
    }
  });

  await test('10. google_calendar_list_events returns filtered event list', async () => {
    setupFetchMock((url) => {
      assert.ok(url.includes('/calendars/primary/events'));
      assert.ok(url.includes('timeMin=2026-08-25T00%3A00%3A00Z'));
      return Promise.resolve(
        new Response(
          JSON.stringify({
            items: [
              {
                id: 'ev-101',
                summary: 'Sprint Planning',
                start: { dateTime: '2026-08-25T10:00:00+07:00' },
                end: { dateTime: '2026-08-25T11:00:00+07:00' },
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      );
    });

    try {
      const apiClient = new GoogleCalendarApiClient();
      const connector = createTestConnector(apiClient);
      connector.setAuthToken('mock-token');

      const result = await connector.executeTool(
        'google_calendar_list_events',
        {
          calendarId: 'primary',
          timeMin: '2026-08-25T00:00:00Z',
          timeMax: '2026-08-25T23:59:59Z',
        },
      );

      assert.strictEqual(result.success, true);
      const data = result.data as { totalEvents: number };
      assert.strictEqual(data.totalEvents, 1);
      assert.ok(result.summary.includes('Sprint Planning'));
    } finally {
      restoreFetchMock();
    }
  });

  await test('11. google_calendar_get_event returns specific event details', async () => {
    setupFetchMock((url) => {
      assert.ok(url.includes('/calendars/primary/events/ev-101'));
      return Promise.resolve(
        new Response(
          JSON.stringify({
            id: 'ev-101',
            summary: 'Sprint Planning',
            description: 'Quarterly backlog grooming',
            start: { dateTime: '2026-08-25T10:00:00+07:00' },
            end: { dateTime: '2026-08-25T11:00:00+07:00' },
            status: 'confirmed',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      );
    });

    try {
      const apiClient = new GoogleCalendarApiClient();
      const connector = createTestConnector(apiClient);
      connector.setAuthToken('mock-token');

      const result = await connector.executeTool('google_calendar_get_event', {
        eventId: 'ev-101',
        calendarId: 'primary',
      });

      assert.strictEqual(result.success, true);
      const data = result.data as { summary: string; description: string };
      assert.strictEqual(data.summary, 'Sprint Planning');
      assert.strictEqual(data.description, 'Quarterly backlog grooming');
    } finally {
      restoreFetchMock();
    }
  });

  await test('12. google_calendar_create_event sends formatted payload and returns event', async () => {
    let capturedBody: CapturedEventBody | null = null;

    setupFetchMock((url, init) => {
      assert.ok(url.includes('/calendars/primary/events'));
      assert.strictEqual(init?.method, 'POST');
      capturedBody = JSON.parse(
        (init?.body as string) || '{}',
      ) as CapturedEventBody;
      return Promise.resolve(
        new Response(
          JSON.stringify({
            id: 'created-ev-555',
            summary: 'Team Retrospective',
            htmlLink: 'https://calendar.google.com/event?id=created-ev-555',
            start: capturedBody?.start,
            end: capturedBody?.end,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      );
    });

    try {
      const apiClient = new GoogleCalendarApiClient();
      const connector = createTestConnector(apiClient);
      connector.setAuthToken('mock-token');

      const result = await connector.executeTool(
        'google_calendar_create_event',
        {
          summary: 'Team Retrospective',
          start: '2026-08-25T16:00:00+07:00',
          end: '2026-08-25T17:00:00+07:00',
          location: 'Meeting Room 3',
          attendees: ['alice@contextforge.ai', 'bob@contextforge.ai'],
          timeZone: 'Asia/Jakarta',
        },
      );

      assert.strictEqual(result.success, true);
      const body = capturedBody as CapturedEventBody | null;
      assert.strictEqual(body?.summary, 'Team Retrospective');
      assert.strictEqual(body?.location, 'Meeting Room 3');
      const data = result.data as { id: string; summary: string };
      assert.strictEqual(data.id, 'created-ev-555');
      assert.ok(result.summary.includes('Berhasil membuat agenda baru'));
    } finally {
      restoreFetchMock();
    }
  });

  await test('13. google_calendar_update_event patches existing event', async () => {
    let capturedBody: CapturedEventBody | null = null;

    setupFetchMock((url, init) => {
      assert.ok(url.includes('/calendars/primary/events/ev-101'));
      assert.strictEqual(init?.method, 'PATCH');
      capturedBody = JSON.parse(
        (init?.body as string) || '{}',
      ) as CapturedEventBody;
      return Promise.resolve(
        new Response(
          JSON.stringify({
            id: 'ev-101',
            summary: 'Updated Sprint Planning',
            location: 'Virtual Zoom',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      );
    });

    try {
      const apiClient = new GoogleCalendarApiClient();
      const connector = createTestConnector(apiClient);
      connector.setAuthToken('mock-token');

      const result = await connector.executeTool(
        'google_calendar_update_event',
        {
          eventId: 'ev-101',
          summary: 'Updated Sprint Planning',
          location: 'Virtual Zoom',
        },
      );

      assert.strictEqual(result.success, true);
      const body = capturedBody as CapturedEventBody | null;
      assert.strictEqual(body?.summary, 'Updated Sprint Planning');
      assert.strictEqual(body?.location, 'Virtual Zoom');
      assert.ok(result.summary.includes('Berhasil memperbarui'));
    } finally {
      restoreFetchMock();
    }
  });

  await test('14. google_calendar_delete_event sends DELETE request and confirms', async () => {
    setupFetchMock((url, init) => {
      assert.ok(url.includes('/calendars/primary/events/ev-101'));
      assert.strictEqual(init?.method, 'DELETE');
      return Promise.resolve(new Response(null, { status: 204 }));
    });

    try {
      const apiClient = new GoogleCalendarApiClient();
      const connector = createTestConnector(apiClient);
      connector.setAuthToken('mock-token');

      const result = await connector.executeTool(
        'google_calendar_delete_event',
        {
          eventId: 'ev-101',
        },
      );

      assert.strictEqual(result.success, true);
      assert.ok(result.summary.includes('Berhasil menghapus'));
    } finally {
      restoreFetchMock();
    }
  });

  await test('15. google_calendar_check_availability performs free/busy calculation', async () => {
    setupFetchMock((url, init) => {
      assert.ok(url.includes('/freeBusy'));
      assert.strictEqual(init?.method, 'POST');
      return Promise.resolve(
        new Response(
          JSON.stringify({
            kind: 'calendar#freeBusy',
            timeMin: '2026-08-25T08:00:00.000Z',
            timeMax: '2026-08-25T18:00:00.000Z',
            calendars: {
              primary: {
                busy: [
                  {
                    start: '2026-08-25T10:00:00.000Z',
                    end: '2026-08-25T11:00:00.000Z',
                  },
                ],
              },
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      );
    });

    try {
      const apiClient = new GoogleCalendarApiClient();
      const connector = createTestConnector(apiClient);
      connector.setAuthToken('mock-token');

      const result = await connector.executeTool(
        'google_calendar_check_availability',
        {
          timeMin: '2026-08-25T08:00:00.000Z',
          timeMax: '2026-08-25T18:00:00.000Z',
          calendarIds: ['primary'],
        },
      );

      assert.strictEqual(result.success, true);
      const data = result.data as {
        calendars: Record<
          string,
          {
            busy: Array<{ start: string; end: string }>;
            free: Array<{ start: string; end: string }>;
          }
        >;
      };
      assert.strictEqual(data.calendars.primary.busy.length, 1);
      assert.strictEqual(data.calendars.primary.free.length, 2);
      assert.ok(result.summary.includes('1 slot sibuk'));
      assert.ok(result.summary.includes('2 slot waktu luang'));
    } finally {
      restoreFetchMock();
    }
  });

  // =========================================================================
  // 5. ERROR HANDLING & SECURITY
  // =========================================================================
  await test('16. Google API 401 Unauthorized returns safe error without leaking token', async () => {
    setupFetchMock(() => {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            error: {
              message: 'Invalid Credentials',
              status: 'UNAUTHENTICATED',
            },
          }),
          { status: 401, statusText: 'Unauthorized' },
        ),
      );
    });

    try {
      const apiClient = new GoogleCalendarApiClient();
      const connector = createTestConnector(apiClient);
      connector.setAuthToken('secret-token-12345');

      const result = await connector.executeTool(
        'google_calendar_list_calendars',
        {},
      );

      assert.strictEqual(result.success, false);
      const data = result.data as { error: string };
      assert.ok(data.error.includes('Authentication failed'));
      // Ensure secrets are never in the returned error
      assert.ok(!data.error.includes('secret-token-12345'));
      assert.ok(!result.summary.includes('secret-token-12345'));
    } finally {
      restoreFetchMock();
    }
  });

  await test('17. Google API 404 Resource Not Found handled gracefully', async () => {
    setupFetchMock(() => {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            error: {
              message: 'Not Found',
              status: 'NOT_FOUND',
            },
          }),
          { status: 404, statusText: 'Not Found' },
        ),
      );
    });

    try {
      const apiClient = new GoogleCalendarApiClient();
      const connector = createTestConnector(apiClient);
      connector.setAuthToken('token');

      const result = await connector.executeTool('google_calendar_get_event', {
        eventId: 'non-existent-id',
      });

      assert.strictEqual(result.success, false);
      const data = result.data as { error: string };
      assert.ok(data.error.includes('Resource not found'));
    } finally {
      restoreFetchMock();
    }
  });

  await test('18. Ping probe reports live health status accurately', async () => {
    setupFetchMock((url) => {
      assert.ok(url.includes('/calendarList?maxResults=1'));
      return Promise.resolve(
        new Response(JSON.stringify({ items: [] }), { status: 200 }),
      );
    });

    try {
      const apiClient = new GoogleCalendarApiClient();
      const connector = createTestConnector(apiClient);
      connector.setAuthToken('valid-token');

      const ping = await connector.ping();
      assert.strictEqual(ping.status, 'connected');
      assert.ok(ping.message?.includes('live connection established'));
    } finally {
      restoreFetchMock();
    }
  });

  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) {
    throw new Error(`${failed} tests failed!`);
  }
}
