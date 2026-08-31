import { Injectable, Inject, Optional, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { GoogleGenAI } from '@google/genai';
import { GEMINI_CLIENT } from '../../agentic-core/gemini-client.provider';
import {
  PersonalHubRepository,
  UserMemoryRow,
} from './personal-hub.repository';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface ExtractedMemoryItem {
  category: 'profile' | 'preference' | 'project' | 'workflow';
  key: string;
  value: string;
  action?: 'UPSERT' | 'DELETE';
}

export interface MemoryExtractionResponse {
  hasMemories: boolean;
  memories: ExtractedMemoryItem[];
}

@Injectable()
export class PersonalHubService {
  private readonly logger = new Logger(PersonalHubService.name);
  private readonly memoryFilePath = path.resolve(
    process.cwd(),
    '..',
    'memory-summary.md',
  );

  constructor(
    private readonly repo: PersonalHubRepository,
    private readonly config: ConfigService,
    @Optional() @Inject(GEMINI_CLIENT) private readonly ai?: GoogleGenAI,
  ) {}

  async getUserMemories(guestId?: string): Promise<UserMemoryRow[]> {
    return this.repo.getUserMemories(guestId);
  }

  async getMemorySummaryMarkdown(guestId?: string): Promise<string> {
    const memories = await this.repo.getUserMemories(guestId);
    if (!memories || memories.length === 0) {
      const emptyPlaceholder =
        '# Memory Summary\n\n_No memories recorded yet. The AI assistant will automatically learn and record your preferences, workflow habits, and project context as you converse._\n';
      await this.syncDiskFile(emptyPlaceholder);
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
    guestId?: string;
  }): Promise<UserMemoryRow> {
    const row = await this.repo.createUserMemory({
      ...data,
      userId: data.guestId,
    });
    await this.getMemorySummaryMarkdown(data.guestId);
    return row;
  }

  async deleteUserMemory(
    id: string,
    guestId?: string,
  ): Promise<{ success: boolean }> {
    await this.repo.deleteUserMemory(id);
    await this.getMemorySummaryMarkdown(guestId);
    return { success: true };
  }

  async clearAllMemories(guestId?: string): Promise<{ success: boolean }> {
    await this.repo.clearAll(guestId);
    const emptyPlaceholder =
      '# Memory Summary\n\n_No memories recorded yet. The AI assistant will automatically learn and record your preferences, workflow habits, and project context as you converse._\n';
    await this.syncDiskFile(emptyPlaceholder);
    return { success: true };
  }

  /**
   * Asynchronous AI Memory Extraction Agent (ChatGPT / Claude / MemGPT Pattern)
   * Analyzes dialogue turn using LLM to extract user profile, custom assistant identity,
   * workflow preferences, or project context with zero hardcoded regex.
   */
  async autoExtractMemoriesWithAI(
    userPrompt: string,
    assistantResponse: string,
    guestId?: string,
  ): Promise<void> {
    if (!userPrompt || userPrompt.trim().length < 3) return;

    const trimmed = userPrompt.trim();
    if (/^\d+([+\-*/]\d+)*$/.test(trimmed)) return;

    try {
      if (!this.ai) {
        await this.fallbackHeuristicExtract(userPrompt, guestId);
        return;
      }

      const modelName = this.config.get<string>(
        'gemini.fastModel',
        this.config.get<string>('gemini.defaultModel', 'gemini-3.6-flash'),
      );

      const systemInstruction = `You are the Background Memory Extraction Agent for ContextForge AI Workspace.
Your task is to analyze the recent conversation turn to determine if any new persistent facts, profile attributes, user preferences, custom assistant names/identities, work context, or instructions should be saved, updated, or removed in the user's long-term memory.

Rules for Extraction:
1. USER PROFILE:
   - If user states their name (e.g. "I'm Azure", "Nama saya Budi", "Call me Alice") -> category: 'profile', key: 'user_name', value: '<Exact Name>'
   - If user states their role, profession, location, or background (e.g. "I work as a Backend Engineer", "Saya tinggal di Bandung") -> category: 'profile', key: 'user_role' or 'location', value: '<Details>'
2. ASSISTANT CUSTOM NAME & PERSONA:
   - If user gives the assistant a custom name (e.g. "Mulai sekarang nama kamu Root", "I will call you Root", "You are Jarvis") -> category: 'preference', key: 'assistant_custom_name', value: 'User has named the assistant "<Name>". Always refer to yourself as <Name>.'
3. PREFERENCES & COMMUNICATION STYLE:
   - If user expresses preferences (e.g. "Gunakan Bun", "Jawab singkat saja", "Always use TypeScript", "Prefer Indonesian") -> category: 'preference', key: 'tech_preference' or 'communication_style', value: '<Preference>'
4. PROJECTS & CONTEXT:
   - If user mentions ongoing project names, repository facts, or company details -> category: 'project', key: 'workspace_context', value: '<Context>'
5. EXPLICIT FORGET / DELETE:
   - If user asks to forget something (e.g. "Lupakan nama lama saya", "Hapus preferensi X") -> action: 'DELETE'
6. TRIVIAL / EPHEMERAL:
   - If the user prompt is a generic question, coding task, or greeting without any personal facts or long-term directives -> "hasMemories": false, "memories": []

Respond with STRICT JSON only matching this schema without markdown codeblocks:
{
  "hasMemories": boolean,
  "memories": [
    {
      "category": "profile" | "preference" | "project" | "workflow",
      "key": "string",
      "value": "string",
      "action": "UPSERT" | "DELETE"
    }
  ]
}`;

      const promptPayload = `User Message: "${userPrompt}"\nAssistant Response: "${
        assistantResponse ? assistantResponse.slice(0, 300) : ''
      }"`;

      const response = await this.ai.models.generateContent({
        model: modelName,
        contents: [{ role: 'user', parts: [{ text: promptPayload }] }],
        config: {
          systemInstruction,
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      });

      const text = response.text?.trim() || '';
      if (!text) return;

      const parsed = JSON.parse(text) as MemoryExtractionResponse;

      if (
        !parsed.hasMemories ||
        !Array.isArray(parsed.memories) ||
        parsed.memories.length === 0
      ) {
        return;
      }

      for (const item of parsed.memories) {
        if (!item.key || !item.category) continue;

        if (item.action === 'DELETE') {
          const existing = await this.repo.getUserMemories(guestId);
          const match = existing.find(
            (m) => m.key.toLowerCase() === item.key.toLowerCase(),
          );
          if (match) {
            await this.repo.deleteUserMemory(match.id);
            this.logger.log(
              `[AI Memory Agent] Deleted memory: [${item.category.toUpperCase()}] ${item.key}`,
            );
          }
        } else {
          await this.repo.upsertUserMemory({
            category: item.category,
            key: item.key,
            value: item.value,
            userId: guestId,
          });
          this.logger.log(
            `[AI Memory Agent] Recorded memory: [${item.category.toUpperCase()}] ${item.key}: "${item.value}"`,
          );
        }
      }

      await this.getMemorySummaryMarkdown(guestId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `[AI Memory Agent] Failed to extract memories with AI: ${msg}`,
      );
      await this.fallbackHeuristicExtract(userPrompt, guestId).catch(() => {});
    }
  }

  /**
   * Backwards compatible entry point for chat service
   */
  async autoExtractMemoriesFromDialogue(
    userPrompt: string,
    assistantResponse: string,
    guestId?: string,
  ): Promise<void> {
    return this.autoExtractMemoriesWithAI(
      userPrompt,
      assistantResponse,
      guestId,
    );
  }

  /**
   * Robust Fallback Heuristic Extractor (Offline / Mock / Safety-Net)
   */
  private async fallbackHeuristicExtract(
    userPrompt: string,
    guestId?: string,
  ): Promise<void> {
    const lower = userPrompt.toLowerCase().trim();

    let extractedCategory: 'profile' | 'preference' | 'project' | 'workflow' =
      'preference';
    let key = 'user_preference';
    let value = userPrompt.trim();
    let hasValidMatch = false;

    // Check Assistant Naming ("Nama kamu Root", "Your name is Root")
    const botNameMatch = userPrompt.match(
      /(?:nama kamu|namamu|nama anda|your name is|call yourself|you are)\s+(?:adalah\s+)?([A-Za-z0-9_-]+)/i,
    );
    if (botNameMatch?.[1]) {
      extractedCategory = 'preference';
      key = 'assistant_custom_name';
      value = `User has assigned the custom name "${botNameMatch[1].trim()}" to the assistant. Always refer to yourself as ${botNameMatch[1].trim()}.`;
      hasValidMatch = true;
    }

    // Check User Name & Identity patterns
    const nameMatch = userPrompt.match(
      /(?:my name is|my name's|i am|i'm|call me|nama saya|nama ku|namaku|panggil saya|panggil aku)\s+(?:adalah\s+)?([A-Za-z0-9_-]+)/i,
    );

    const stopWords = new Set([
      'ready',
      'sure',
      'here',
      'asking',
      'trying',
      'looking',
      'working',
      'building',
      'confused',
      'happy',
      'tired',
      'curious',
      'testing',
      'siap',
      'bingung',
      'sedang',
      'mau',
      'ingin',
      'bisa',
      'root',
    ]);

    if (
      !hasValidMatch &&
      nameMatch?.[1] &&
      !stopWords.has(nameMatch[1].toLowerCase())
    ) {
      extractedCategory = 'profile';
      key = 'user_name';
      value = nameMatch[1].trim();
      hasValidMatch = true;
    } else if (
      /(?:i work as|my role is|i am a|i'm a|pekerjaan saya|profesi saya|posisi saya)/i.test(
        userPrompt,
      )
    ) {
      const roleMatch = userPrompt.match(
        /(?:i work as|my role is|i am a|i'm a|pekerjaan saya|profesi saya|posisi saya)\s+(?:a\s+|an\s+|sebagai\s+)?([A-Za-z0-9 _-]+)/i,
      );
      if (roleMatch?.[1]) {
        extractedCategory = 'profile';
        key = 'user_role';
        value = roleMatch[1].trim();
        hasValidMatch = true;
      }
    } else if (
      lower.includes('proyek') ||
      lower.includes('project') ||
      lower.includes('repo') ||
      lower.includes('tech stack')
    ) {
      extractedCategory = 'project';
      key = 'workspace_context';
      hasValidMatch = true;
    } else if (
      lower.includes('format') ||
      lower.includes('bilingual') ||
      lower.includes('bahasa')
    ) {
      extractedCategory = 'preference';
      key = 'communication_style';
      hasValidMatch = true;
    } else if (
      /(?:remember that|please remember|ingat bahwa|ingat ya|tolong ingat|saya lebih suka|preferensi saya|i prefer|always use|selalu gunakan|never use|jangan gunakan)/i.test(
        userPrompt,
      )
    ) {
      extractedCategory = 'preference';
      key = 'user_preference';
      hasValidMatch = true;
    }

    if (!hasValidMatch) return;

    await this.repo.upsertUserMemory({
      category: extractedCategory,
      key,
      value,
      userId: guestId,
    });

    await this.getMemorySummaryMarkdown(guestId);

    this.logger.log(
      `[Memory Extractor Fallback] Recorded memory: [${extractedCategory.toUpperCase()}] ${key}: "${value}"`,
    );
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
