import { Injectable, Logger } from '@nestjs/common';
import {
  PersonalHubRepository,
  UserMemoryRow,
} from './personal-hub.repository';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class PersonalHubService {
  private readonly logger = new Logger(PersonalHubService.name);
  private readonly memoryFilePath = path.resolve(
    process.cwd(),
    '..',
    'memory-summary.md',
  );

  constructor(private readonly repo: PersonalHubRepository) {}

  async getUserMemories(): Promise<UserMemoryRow[]> {
    return this.repo.getUserMemories();
  }

  async getMemorySummaryMarkdown(): Promise<string> {
    const memories = await this.repo.getUserMemories();
    if (!memories || memories.length === 0) {
      return '';
    }

    const lines: string[] = ['# Memory Summary\n'];
    for (const m of memories) {
      lines.push(
        `- **${m.category.toUpperCase()}** (${m.key.replace(/_/g, ' ')}): ${m.value}`,
      );
    }
    const markdown = lines.join('\n');
    await this.syncDiskFile(markdown);
    return markdown;
  }

  async createUserMemory(data: {
    category: 'profile' | 'preference' | 'project' | 'workflow';
    key: string;
    value: string;
  }): Promise<UserMemoryRow> {
    const row = await this.repo.createUserMemory(data);
    await this.getMemorySummaryMarkdown();
    return row;
  }

  async deleteUserMemory(id: string): Promise<{ success: boolean }> {
    await this.repo.deleteUserMemory(id);
    await this.getMemorySummaryMarkdown();
    return { success: true };
  }

  async clearAllMemories(): Promise<{ success: boolean }> {
    await this.repo.clearAll();
    await this.syncDiskFile('');
    return { success: true };
  }

  /**
   * Background Memory Auto-Extractor (ChatGPT / Claude pattern)
   * Extracts user preferences and project facts seamlessly post-turn.
   */
  async autoExtractMemoriesFromDialogue(
    userPrompt: string,
    assistantResponse: string,
  ): Promise<void> {
    void assistantResponse;
    if (!userPrompt || userPrompt.trim().length < 10) return;

    const lower = userPrompt.toLowerCase();

    // 1. Heuristic intent filter: Look for personal preference or project identity indicators
    const preferenceSignals = [
      'ingat bahwa',
      'ingat ya',
      'tolong ingat',
      'saya lebih suka',
      'preferensi saya',
      'selalu gunakan',
      'jangan gunakan',
      'nama saya',
      'proyek saya',
      'project saya',
      'repo ini',
      'tech stack kami',
      'bahasa indonesia',
      'format jawaban',
    ];

    const hasSignal = preferenceSignals.some((sig) => lower.includes(sig));
    if (!hasSignal) return;

    try {
      this.logger.log(
        `[Memory Extractor] Detected preference signal in prompt: "${userPrompt.slice(0, 60)}..."`,
      );

      let extractedCategory: 'profile' | 'preference' | 'project' | 'workflow' =
        'preference';
      let key = 'user_preference';
      let value = userPrompt.trim();

      if (lower.includes('nama saya')) {
        extractedCategory = 'profile';
        key = 'user_name';
        const match = userPrompt.match(
          /nama saya (?:adalah )?([A-Za-z0-9 _-]+)/i,
        );
        if (match?.[1]) value = match[1].trim();
      } else if (
        lower.includes('proyek') ||
        lower.includes('project') ||
        lower.includes('repo')
      ) {
        extractedCategory = 'project';
        key = 'workspace_context';
      } else if (
        lower.includes('format') ||
        lower.includes('bilingual') ||
        lower.includes('bahasa')
      ) {
        extractedCategory = 'preference';
        key = 'communication_style';
      }

      // Check existing memories to avoid duplicates
      const existing = await this.repo.getUserMemories();
      const duplicate = existing.find(
        (m) =>
          m.key === key ||
          m.value.toLowerCase() === value.toLowerCase() ||
          value.toLowerCase().includes(m.value.toLowerCase()),
      );

      if (!duplicate) {
        await this.createUserMemory({
          category: extractedCategory,
          key,
          value,
        });
        this.logger.log(
          `[Memory Extractor] Successfully auto-extracted memory: [${extractedCategory.toUpperCase()}] ${key}: "${value}"`,
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `[Memory Extractor] Failed to auto-extract memory: ${msg}`,
      );
    }
  }

  private async syncDiskFile(content: string): Promise<void> {
    try {
      if (content.trim()) {
        await fs.writeFile(this.memoryFilePath, content, 'utf-8');
      } else {
        await fs.unlink(this.memoryFilePath).catch(() => null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Could not sync memory-summary.md to disk: ${msg}`);
    }
  }
}
