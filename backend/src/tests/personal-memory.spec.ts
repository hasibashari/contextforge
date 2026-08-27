import assert from 'assert';
import { ConfigService } from '@nestjs/config';
import type { GoogleGenAI } from '@google/genai';
import { PersonalHubService } from '../modules/personal-hub/personal-hub.service';
import {
  PersonalHubRepository,
  UserMemoryRow,
} from '../modules/personal-hub/personal-hub.repository';

class MockPersonalHubRepository {
  private memories: UserMemoryRow[] = [];

  async getUserMemories(userId?: string): Promise<UserMemoryRow[]> {
    await Promise.resolve();
    if (userId) {
      return this.memories.filter((m) => m.user_id === userId || !m.user_id);
    }
    return [...this.memories];
  }

  async createUserMemory(data: {
    category: 'profile' | 'preference' | 'project' | 'workflow';
    key: string;
    value: string;
    userId?: string;
  }): Promise<UserMemoryRow> {
    await Promise.resolve();
    const row: UserMemoryRow = {
      id: `mem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      user_id: data.userId,
      category: data.category,
      key: data.key,
      value: data.value,
      updated_at: new Date().toISOString(),
    };
    this.memories.push(row);
    return row;
  }

  async upsertUserMemory(data: {
    category: 'profile' | 'preference' | 'project' | 'workflow';
    key: string;
    value: string;
    userId?: string;
  }): Promise<UserMemoryRow> {
    const match = this.memories.find(
      (m) =>
        m.key.toLowerCase() === data.key.toLowerCase() &&
        (m.user_id === data.userId || !m.user_id),
    );
    if (match) {
      match.category = data.category;
      match.value = data.value;
      match.updated_at = new Date().toISOString();
      return match;
    }
    return this.createUserMemory(data);
  }

  async deleteUserMemory(id: string): Promise<void> {
    await Promise.resolve();
    this.memories = this.memories.filter((m) => m.id !== id);
  }

  async clearAll(): Promise<void> {
    await Promise.resolve();
    this.memories = [];
  }
}

export async function runPersonalMemoryTests(): Promise<void> {
  console.log(
    '\n🧪 Starting Personal Memory & Multilingual Extraction Tests...\n',
  );
  let passed = 0;
  let failed = 0;

  const test = async (name: string, fn: () => Promise<void> | void) => {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err: unknown) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(err);
      failed++;
    }
  };

  const mockRepo =
    new MockPersonalHubRepository() as unknown as PersonalHubRepository;
  const mockConfig = new ConfigService();
  const service = new PersonalHubService(mockRepo, mockConfig);

  await test('1. Extracts English short name "I\'m Azure"', async () => {
    await service.autoExtractMemoriesWithAI(
      "I'm Azure",
      'Hello Azure! Nice to meet you.',
    );
    const summary = await service.getMemorySummaryMarkdown();
    assert.ok(summary.includes('PROFILE'));
    assert.ok(summary.includes('user name'));
    assert.ok(summary.includes('Azure'));
  });

  await test('2. Extracts English name "My name is Alice"', async () => {
    await service.autoExtractMemoriesWithAI('My name is Alice', 'Hello Alice!');
    const summary = await service.getMemorySummaryMarkdown();
    assert.ok(summary.includes('Alice'));
  });

  await test('3. Extracts Indonesian name "Nama saya Budi"', async () => {
    await service.autoExtractMemoriesWithAI(
      'Halo, nama saya Budi.',
      'Halo Budi!',
    );
    const summary = await service.getMemorySummaryMarkdown();
    assert.ok(summary.includes('Budi'));
  });

  await test('4. Extracts Assistant Custom Name "Nama kamu Root ya"', async () => {
    await service.autoExtractMemoriesWithAI(
      'Mulai sekarang nama kamu Root ya',
      'Baik! Mulai sekarang saya adalah Root.',
    );
    const summary = await service.getMemorySummaryMarkdown();
    assert.ok(summary.includes('PREFERENCE'));
    assert.ok(summary.includes('assistant custom name'));
    assert.ok(summary.includes('Root'));
  });

  await test('5. Extracts English role "I work as a Fullstack Architect"', async () => {
    await service.autoExtractMemoriesWithAI(
      'I work as a Fullstack Architect in fintech',
      'Got it!',
    );
    const summary = await service.getMemorySummaryMarkdown();
    assert.ok(summary.includes('user role'));
    assert.ok(summary.includes('Fullstack Architect'));
  });

  await test('6. Does not extract false-positive adjectives like "I\'m ready"', async () => {
    await service.autoExtractMemoriesWithAI(
      "I'm ready for the next task",
      'Let us go!',
    );
    const newMemories = await mockRepo.getUserMemories();
    const readyMem = newMemories.find((m) => m.value.toLowerCase() === 'ready');
    assert.strictEqual(readyMem, undefined);
  });

  await test('7. Mock AI Extraction Engine processes structured JSON output', async () => {
    const mockAiClient = {
      models: {
        generateContent: async () => {
          await Promise.resolve();
          return {
            text: JSON.stringify({
              hasMemories: true,
              memories: [
                {
                  category: 'preference',
                  key: 'tech_preference',
                  value: 'User prefers Bun over Node.js for CLI tools',
                  action: 'UPSERT',
                },
              ],
            }),
          };
        },
      },
    };

    const aiService = new PersonalHubService(
      mockRepo,
      mockConfig,
      mockAiClient as unknown as GoogleGenAI,
    );

    await aiService.autoExtractMemoriesWithAI(
      'Always use Bun instead of Node.js for scripts',
      'Understood, I will always use Bun for all future scripts.',
    );

    const summary = await aiService.getMemorySummaryMarkdown();
    assert.ok(summary.includes('PREFERENCE'));
    assert.ok(summary.includes('tech preference'));
    assert.ok(summary.includes('Bun over Node.js'));
  });

  console.log(
    `\n📊 Personal Memory Test Results: ${passed} passed, ${failed} failed.\n`,
  );
  if (failed > 0) {
    throw new Error(`${failed} Personal Memory tests failed!`);
  }
}
