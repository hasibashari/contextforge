import assert from 'assert';
import { SubAgentRegistryService } from '../agentic-core/subagents/subagent-registry.service';
import { SecondBrainSubAgent } from '../agentic-core/subagents/personas/second-brain.subagent';
import { ExecutiveSchedulerSubAgent } from '../agentic-core/subagents/personas/executive-scheduler.subagent';
import { ResearchSpecialistSubAgent } from '../agentic-core/subagents/personas/research-specialist.subagent';
import {
  HistoryCompactorService,
  HistoryTurn,
} from '../agentic-core/services/history-compactor.service';
import { ProactiveGuardianService } from '../agentic-core/services/proactive-guardian.service';
import { McpToolDefinition } from '../mcp/core';

export async function runAgentEnhancementTests() {
  console.log('\n🧪 Starting Advanced AI Agent Architecture Test Suite...\n');
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

  const secondBrain = new SecondBrainSubAgent();
  const executiveScheduler = new ExecutiveSchedulerSubAgent();
  const researchSpecialist = new ResearchSpecialistSubAgent();
  const registry = new SubAgentRegistryService(
    secondBrain,
    executiveScheduler,
    researchSpecialist,
  );

  // 1. Sub-Agent Registration
  await test('1. SubAgentRegistryService registers all specialized sub-agents', () => {
    const list = registry.listPersonas();
    assert.strictEqual(list.length, 3);
    assert.ok(list.some((p) => p.id === 'second_brain'));
    assert.ok(list.some((p) => p.id === 'executive_scheduler'));
    assert.ok(list.some((p) => p.id === 'research_specialist'));
  });

  // 2. Prompt Routing: Second Brain
  await test('2. SubAgentRegistryService routes Obsidian & notes queries to Second Brain', () => {
    const agent = registry.routePromptToSubAgent(
      'Buat catatan Zettelkasten baru di Obsidian vault dengan wikilink',
    );
    assert.strictEqual(agent?.id, 'second_brain');
  });

  // 3. Prompt Routing: Executive Scheduler
  await test('3. SubAgentRegistryService routes Calendar & Sprint goals to Executive Scheduler', () => {
    const agent = registry.routePromptToSubAgent(
      'Jadwalkan meeting di Google Calendar dan update target sprint di Notion',
    );
    assert.strictEqual(agent?.id, 'executive_scheduler');
  });

  // 4. Prompt Routing: Research & Web Search Specialist
  await test('4. SubAgentRegistryService routes Google & Live Research queries to Research Specialist', () => {
    const agent = registry.routePromptToSubAgent(
      'Tolong cari riset terbaru dan berita Google tentang AI agents',
    );
    assert.strictEqual(agent?.id, 'research_specialist');
  });

  // 7. Tool Scoping: Second Brain
  await test('7. SecondBrainSubAgent scopes tools strictly to Obsidian Vault', () => {
    const mockTools: McpToolDefinition[] = [
      { name: 'notion_create_page', description: 'notion' },
      { name: 'obsidian_read_vault_note', description: 'read note' },
      { name: 'obsidian_create_vault_note', description: 'create note' },
      { name: 'gcal_create_event', description: 'event' },
    ];
    const filtered = secondBrain.filterAllowedTools(mockTools);
    assert.strictEqual(filtered.length, 2);
    assert.ok(filtered.every((t) => t.name.startsWith('obsidian_')));
  });

  // 8. Tool Scoping: Executive Scheduler
  await test('8. ExecutiveSchedulerSubAgent scopes tools to Calendar, Notion & Goals', () => {
    const mockTools: McpToolDefinition[] = [
      { name: 'gcal_create_event', description: 'gcal' },
      { name: 'notion_create_page', description: 'notion' },
      { name: 'create_goal', description: 'goal' },
      { name: 'obsidian_create_note', description: 'obsidian' },
    ];
    const filtered = executiveScheduler.filterAllowedTools(mockTools);
    assert.strictEqual(filtered.length, 3);
    assert.ok(!filtered.some((t) => t.name.startsWith('obsidian_')));
  });

  // 9. Tool Scoping: Research Specialist
  await test('9. ResearchSpecialistSubAgent scopes tools to Web Search & Knowledge Vault', () => {
    const mockTools: McpToolDefinition[] = [
      { name: 'web_search', description: 'search' },
      { name: 'search_knowledge_vault', description: 'knowledge' },
      { name: 'notion_create_page', description: 'notion' },
      { name: 'gcal_create_event', description: 'event' },
    ];
    const filtered = researchSpecialist.filterAllowedTools(mockTools);
    assert.strictEqual(filtered.length, 2);
    assert.ok(
      filtered.some(
        (t) => t.name === 'web_search' || t.name === 'search_knowledge_vault',
      ),
    );
  });

  // 10. History Compactor - Short History Bypass
  await test('10. HistoryCompactorService preserves short conversation histories without compaction', () => {
    const compactor = new HistoryCompactorService();
    const shortHistory: HistoryTurn[] = [
      { role: 'user', parts: [{ text: 'Halo' }] },
      { role: 'model', parts: [{ text: 'Halo! Ada yang bisa dibantu?' }] },
    ];
    const res = compactor.compactHistory(shortHistory);
    assert.strictEqual(res.isCompacted, false);
    assert.strictEqual(res.compactedHistory.length, 2);
    assert.strictEqual(res.summaryBlock, undefined);
  });

  // 11. History Compactor - Long History Rolling Digest
  await test('11. HistoryCompactorService compacts long history (> 10 turns) into executive summary', () => {
    const compactor = new HistoryCompactorService();
    const longHistory: HistoryTurn[] = Array.from({ length: 14 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'model',
      parts: [{ text: `Turn ${i + 1} message content in conversation.` }],
    }));

    const res = compactor.compactHistory(longHistory);
    assert.strictEqual(res.isCompacted, true);
    assert.strictEqual(res.remainingTurnCount, 4);
    assert.ok(res.summaryBlock);
    assert.ok(res.summaryBlock.includes('EXECUTIVE SUMMARY'));
    assert.ok(res.summaryBlock.includes('Turn 1'));
  });

  // 12. Proactive Guardian - Standalone Safety
  await test('12. ProactiveGuardianService runs cycle safely without throwing', async () => {
    const guardian = new ProactiveGuardianService();
    const result = await guardian.runEvaluationCycle();
    assert.strictEqual(result.triggered, false);
    assert.strictEqual(result.reason, 'No active mobile device attached');
  });

  console.log(
    `\n📊 Advanced Agent Test Results: ${passed} passed, ${failed} failed.\n`,
  );
  if (failed > 0) {
    throw new Error(`${failed} test(s) failed in Agent Enhancements suite.`);
  }
}
