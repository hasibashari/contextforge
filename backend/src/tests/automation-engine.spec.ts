import assert from 'assert';
import { AutomationSchedulerService } from '../modules/automation/automation-scheduler.service';
import {
  AutomationRepository,
  AutomationWorkflowRow,
} from '../modules/automation/automation.repository';
import { AutomationService } from '../modules/automation/automation.service';
import { AutomationToolHandler } from '../agentic-core/handlers/automation-tool.handler';
import { DatabaseService } from '../common/database/database.service';

export async function runAutomationTests() {
  console.log(
    '\n🧪 Starting Automation & Background Scheduler Test Suite...\n',
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

  const mockDb = {} as DatabaseService;
  const mockRepo = new AutomationRepository(mockDb);
  const mockService = {} as AutomationService;

  // 1. Cron Matching: Daily Specific Hour
  await test('1. AutomationScheduler matches standard daily cron (0 8 * * *)', () => {
    const scheduler = new AutomationSchedulerService(mockRepo, mockService);

    const matchDate = new Date(2026, 7, 30, 8, 0, 0); // 08:00
    const nonMatchDate = new Date(2026, 7, 30, 8, 15, 0); // 08:15

    assert.strictEqual(scheduler.matchesCron('0 8 * * *', matchDate), true);
    assert.strictEqual(scheduler.matchesCron('0 8 * * *', nonMatchDate), false);
  });

  // 2. Cron Matching: Interval (Every 15 mins)
  await test('2. AutomationScheduler matches step cron (*/15 * * * *)', () => {
    const scheduler = new AutomationSchedulerService(mockRepo, mockService);

    const min0 = new Date(2026, 7, 30, 10, 0, 0);
    const min15 = new Date(2026, 7, 30, 10, 15, 0);
    const min30 = new Date(2026, 7, 30, 10, 30, 0);
    const min22 = new Date(2026, 7, 30, 10, 22, 0);

    assert.strictEqual(scheduler.matchesCron('*/15 * * * *', min0), true);
    assert.strictEqual(scheduler.matchesCron('*/15 * * * *', min15), true);
    assert.strictEqual(scheduler.matchesCron('*/15 * * * *', min30), true);
    assert.strictEqual(scheduler.matchesCron('*/15 * * * *', min22), false);
  });

  // 3. Cron Matching: Weekday Range (1-5)
  await test('3. AutomationScheduler matches weekday ranges (0 9 * * 1-5)', () => {
    const scheduler = new AutomationSchedulerService(mockRepo, mockService);

    // 2026-08-31 is Monday (day 1)
    const monday = new Date(2026, 7, 31, 9, 0, 0);
    // 2026-08-30 is Sunday (day 0)
    const sunday = new Date(2026, 7, 30, 9, 0, 0);

    assert.strictEqual(scheduler.matchesCron('0 9 * * 1-5', monday), true);
    assert.strictEqual(scheduler.matchesCron('0 9 * * 1-5', sunday), false);
  });

  // 4. Scheduler Status & Live Health Reporting
  await test('4. AutomationScheduler reports accurate live health and status', async () => {
    const mockWorkflows: AutomationWorkflowRow[] = [
      {
        id: 'wf-1',
        name: 'Morning Digest',
        description: 'Daily briefing',
        agent_id: 'agent-personal-assistant',
        mcp_tools: ['obsidian_create_daily_note'],
        prompt_template: 'Summarize today',
        guardrail_strict_hitl: false,
        is_active: true,
        trigger_type: 'schedule',
        schedule_cron: '0 8 * * *',
        schedule_label: 'Every day at 08:00',
        total_runs: 5,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'wf-2',
        name: 'Draft Workflow',
        description: 'Draft',
        agent_id: 'agent-personal-assistant',
        mcp_tools: [],
        prompt_template: 'Draft',
        guardrail_strict_hitl: false,
        is_active: false,
        trigger_type: 'manual',
        schedule_label: 'Manual Trigger',
        total_runs: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    const testRepo = {
      getAllAutomations: () => Promise.resolve(mockWorkflows),
    } as unknown as AutomationRepository;

    const scheduler = new AutomationSchedulerService(testRepo, mockService);
    scheduler.onModuleInit();
    const status = await scheduler.getSchedulerStatus();

    assert.strictEqual(status.status, 'running');
    assert.strictEqual(status.totalWorkflowsCount, 2);
    assert.strictEqual(status.activeJobsCount, 1);
    assert.strictEqual(status.jobs.length, 2);
    assert.strictEqual(status.jobs[0].name, 'Morning Digest');
    scheduler.onModuleDestroy();
  });

  // 5. AutomationToolHandler AI Tool Call Execution
  await test('5. AutomationToolHandler registers automation and returns actionCard', async () => {
    const testRepo = {
      createAutomation: (data: Partial<AutomationWorkflowRow>) =>
        Promise.resolve({
          id: 'auto-test-123',
          ...data,
          total_runs: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as AutomationWorkflowRow),
    } as unknown as AutomationRepository;

    const handler = new AutomationToolHandler(testRepo);
    const events: Array<{ event: string; data?: Record<string, unknown> }> = [];

    const result = await handler.execute(
      'Schedule a daily Notion briefing at 9 AM',
      {
        name: 'Daily Notion Briefing',
        schedule_cron: '0 9 * * *',
        schedule_label: 'Every day at 09:00 AM',
        mcp_server_id: 'int-notion-mcp',
      },
      (evt) => events.push(evt),
    );

    assert.ok(result.textContent.includes('Daily Notion Briefing'));
    assert.ok(result.actionCard);
    assert.strictEqual(result.actionCard?.type, 'automation_created');
    const cardData = result.actionCard?.data as { cron?: string } | undefined;
    assert.strictEqual(cardData?.cron, '0 9 * * *');
    assert.ok(events.some((e) => e.event === 'timeline_stage'));
  });

  console.log(
    `\n📊 Automation Test Results: ${passed} passed, ${failed} failed.\n`,
  );
  if (failed > 0) {
    throw new Error(`${failed} test(s) failed in Automation test suite.`);
  }
}
