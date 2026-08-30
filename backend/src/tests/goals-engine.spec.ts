import assert from 'assert';
import { GoalToolHandler } from '../agentic-core/handlers/goal-tool.handler';
import {
  GoalsRepository,
  GoalRow,
  GoalTaskRow,
  GoalEvaluationRow,
} from '../modules/goals/goals.repository';
import { GoalsService } from '../modules/goals/goals.service';

export async function runGoalsTests() {
  console.log('\n🧪 Starting Goal-Oriented AI & Verification Test Suite...\n');
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

  const mockGoal: GoalRow = {
    id: 'goal-deep-work',
    title: 'Deep Work & Cognitive Focus',
    description: '120 mins daily focus session',
    category: 'productivity',
    status: 'active',
    target_metrics: { daily_focus_mins: 120 },
    current_progress_pct: 75.0,
    streak_days: 4,
    cron_evaluation: '0 21 * * *',
    linked_mcp_servers: ['android-bridge', 'google-calendar'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockTasks: GoalTaskRow[] = [
    {
      id: 'task-1',
      goal_id: 'goal-deep-work',
      title: 'Morning Focus Block',
      description: 'Zero distraction',
      scheduled_start: '2026-08-30T09:00:00+07:00',
      scheduled_end: '2026-08-30T11:00:00+07:00',
      mcp_target: 'google-calendar',
      status: 'verified_completed',
      risk_level: 'low_risk',
      requires_user_approval: false,
      user_approval_status: 'none',
      verification_evidence: { eventId: 'evt-123', status: 'confirmed' },
      verification_notes: 'Calendar event completed.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const mockRepo = {
    getAllGoals: () => Promise.resolve([mockGoal]),
    getGoalById: (id: string) =>
      Promise.resolve(id === mockGoal.id ? mockGoal : null),
    createTask: (data: Partial<GoalTaskRow>) =>
      Promise.resolve({
        id: `task-${Date.now()}`,
        ...data,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as GoalTaskRow),
    getTaskById: (id: string) =>
      Promise.resolve(id === mockTasks[0].id ? mockTasks[0] : null),
    createEvaluation: (data: Partial<GoalEvaluationRow>) =>
      Promise.resolve({
        id: 'eval-123',
        ...data,
        created_at: new Date().toISOString(),
      } as GoalEvaluationRow),
  } as unknown as GoalsRepository;

  const mockService = {
    createGoal: (dto: {
      title: string;
      category?: string;
      cronEvaluation?: string;
    }) =>
      Promise.resolve({
        ...mockGoal,
        title: dto.title,
        category: (dto.category as GoalRow['category']) || 'productivity',
        cron_evaluation: dto.cronEvaluation || '0 21 * * *',
      }),
  } as unknown as GoalsService;

  const handler = new GoalToolHandler(mockRepo, mockService);

  // 1. Tool Call: create_goal
  await test('1. GoalToolHandler create_goal registers goal and returns actionCard', async () => {
    const result = await handler.execute(
      'create_goal',
      'Set up a goal for learning Rust 1 hour per day',
      {
        title: 'Learn Rust Programming',
        category: 'learning',
        cron_evaluation: '0 20 * * *',
      },
      () => {},
    );

    assert.ok(result.textContent.includes('Learn Rust Programming'));
    assert.strictEqual(result.actionCard?.type, 'goal_created');
    const cardData = result.actionCard?.data as {
      title?: string;
      category?: string;
    };
    assert.strictEqual(cardData?.title, 'Learn Rust Programming');
    assert.strictEqual(cardData?.category, 'learning');
  });

  // 2. Tool Call: list_goals
  await test('2. GoalToolHandler list_goals formats active goals with streak and progress', async () => {
    const result = await handler.execute(
      'list_goals',
      'What are my current goals?',
      {},
      () => {},
    );

    assert.ok(result.textContent.includes('Deep Work & Cognitive Focus'));
    assert.ok(result.textContent.includes('75%'));
    assert.ok(result.textContent.includes('4 days'));
  });

  // 3. Tool Call: decompose_goal_into_tasks
  await test('3. GoalToolHandler decompose_goal_into_tasks creates concrete schedule blocks', async () => {
    const result = await handler.execute(
      'decompose_goal_into_tasks',
      'Break down my deep work goal into tasks',
      { goal_id: 'goal-deep-work' },
      () => {},
    );

    assert.ok(result.textContent.includes('decomposed into 3 sub-tasks'));
    const raw = result.rawResult as { tasks: GoalTaskRow[] };
    assert.strictEqual(raw.tasks.length, 3);
    assert.ok(raw.tasks.some((t) => t.mcp_target === 'google-calendar'));
    assert.ok(raw.tasks.some((t) => t.mcp_target === 'notion'));
    assert.ok(raw.tasks.some((t) => t.mcp_target === 'android-bridge'));
  });

  // 4. Tool Call: verify_task_completion
  await test('4. GoalToolHandler verify_task_completion checks evidence gatekeeper', async () => {
    const result = await handler.execute(
      'verify_task_completion',
      'Check if my morning focus block is done',
      { task_id: 'task-1' },
      () => {},
    );

    assert.ok(result.textContent.includes('VERIFIED_COMPLETED'));
    assert.ok(result.textContent.includes('Calendar event completed.'));
  });

  // 5. Tool Call: record_goal_evaluation
  await test('5. GoalToolHandler record_goal_evaluation records daily reflection score and insights', async () => {
    const result = await handler.execute(
      'record_goal_evaluation',
      'Run evening evaluation for my deep work goal',
      { goal_id: 'goal-deep-work' },
      () => {},
    );

    assert.ok(result.textContent.includes('85%'));
    assert.ok(
      result.textContent.includes('Reflection journal and adaptations saved.'),
    );
  });

  console.log(
    `\n📊 Goal-Oriented AI Test Results: ${passed} passed, ${failed} failed.\n`,
  );
  if (failed > 0) {
    throw new Error(`${failed} test(s) failed in Goals test suite.`);
  }
}
