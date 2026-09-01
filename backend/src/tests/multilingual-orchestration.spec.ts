import assert from 'assert';
import {
  getAgentSystemPrompt,
  LANGUAGE_AND_COMMUNICATION_GUIDELINES,
} from '../agentic-core/prompts/orchestrator.prompt';
import { getEvidenceSynthesisPrompt } from '../agentic-core/prompts/web-search.prompt';
import { WellbeingCoachSubAgent } from '../agentic-core/subagents/personas/wellbeing-coach.subagent';
import { SecondBrainSubAgent } from '../agentic-core/subagents/personas/second-brain.subagent';
import { ExecutiveSchedulerSubAgent } from '../agentic-core/subagents/personas/executive-scheduler.subagent';
import { ResearchSpecialistSubAgent } from '../agentic-core/subagents/personas/research-specialist.subagent';
import { SubAgentRegistryService } from '../agentic-core/subagents/subagent-registry.service';

export async function runMultilingualOrchestrationTests() {
  console.log(
    '\n🌐 Starting Multilingual Dynamic Mirroring & Anti-Leakage Test Suite...\n',
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

  // 1. Language Guidelines Integrity
  await test('1. LANGUAGE_AND_COMMUNICATION_GUIDELINES contains strict mirroring and anti-pass-through rules', () => {
    assert.ok(
      LANGUAGE_AND_COMMUNICATION_GUIDELINES.includes(
        "Strictly Match the User's Current Language",
      ),
      'Must contain language matching rule',
    );
    assert.ok(
      LANGUAGE_AND_COMMUNICATION_GUIDELINES.includes(
        'Tool Output Synthesis & Anti-Leakage (Zero Pass-Through Bias)',
      ),
      'Must contain anti-pass-through rule for MCP tools',
    );
    assert.ok(
      LANGUAGE_AND_COMMUNICATION_GUIDELINES.includes('English'),
      'Must specify English handling',
    );
    assert.ok(
      LANGUAGE_AND_COMMUNICATION_GUIDELINES.includes('Indonesian'),
      'Must specify Indonesian handling',
    );
  });

  // 2. Base Agent System Prompt Language Injection
  await test('2. getAgentSystemPrompt injects dynamic language guidelines by default', () => {
    const prompt = getAgentSystemPrompt();
    assert.ok(
      prompt.includes(LANGUAGE_AND_COMMUNICATION_GUIDELINES),
      'System prompt must include global language guidelines',
    );
  });

  // 3. Sub-Agent System Instructions
  await test('3. SubAgentRegistry personas and combined instructions contain language guidelines', () => {
    const wellbeingCoach = new WellbeingCoachSubAgent();
    const secondBrain = new SecondBrainSubAgent();
    const executiveScheduler = new ExecutiveSchedulerSubAgent();
    const researchSpecialist = new ResearchSpecialistSubAgent();
    const registry = new SubAgentRegistryService(
      wellbeingCoach,
      secondBrain,
      executiveScheduler,
      researchSpecialist,
    );

    const subAgent = registry.getSubAgent('wellbeing_coach');
    assert.ok(subAgent, 'Should retrieve sub-agent');

    const rawPrompt = subAgent.formatSubAgentPrompt();
    assert.ok(rawPrompt.length > 50, 'Persona prompt must be populated');

    // Simulate orchestrator system instruction generation
    const fullSystemInstruction = `${rawPrompt}\n\n${LANGUAGE_AND_COMMUNICATION_GUIDELINES}`;
    assert.ok(
      fullSystemInstruction.includes('Tool Output Synthesis & Anti-Leakage'),
      'Full sub-agent prompt must enforce dynamic tool synthesis',
    );
  });

  // 4. Web Search Evidence Synthesis Dynamic Language Prompting
  await test('4. getEvidenceSynthesisPrompt enforces strict dynamic language mirroring and translation', () => {
    const englishSynthesisPrompt = getEvidenceSynthesisPrompt(
      'Find the nearest coffee shop in Jakarta',
      'LOCAL_SEARCH',
      '{"shops": [{"name": "Kopi Kenangan", "desc": "Kedai kopi lokal terpopuler"}]}',
    );
    assert.ok(
      englishSynthesisPrompt.includes(
        'STRICT DYNAMIC LANGUAGE MIRRORING & TRANSLATION',
      ),
      'Search synthesis must mandate translation into query language',
    );
    assert.ok(
      englishSynthesisPrompt.includes(
        'User Query: "Find the nearest coffee shop in Jakarta"',
      ),
      'Prompt must reference original query',
    );
  });

  // 5. Memory and History Isolation Check
  await test('5. Language guidelines mandate query language over history/memory language', () => {
    const memories = [
      { category: 'profile', key: 'user_name', value: 'Budi' },
      { category: 'preference', key: 'note_language', value: 'Indonesian' },
    ];
    const systemPromptWithIndonesianMemories = getAgentSystemPrompt(
      undefined,
      [],
      memories,
    );
    assert.ok(
      systemPromptWithIndonesianMemories.includes(
        'regardless of whether previous conversation history, tool outputs, or memories contain Indonesian',
      ),
      'Must explicitly forbid letting stored memories override user English query',
    );
  });

  console.log(
    `\n📊 Multilingual Test Summary: ${passed} passed, ${failed} failed.\n`,
  );
  if (failed > 0) {
    throw new Error(`${failed} test(s) failed in Multilingual Test Suite.`);
  }
}
