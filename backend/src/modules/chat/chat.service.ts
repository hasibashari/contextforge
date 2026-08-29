import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { GoogleGenAI } from '@google/genai';
import { GEMINI_CLIENT } from '../../agentic-core/gemini-client.provider';
import {
  ChatRepository,
  ChatSessionRow,
  ChatMessageRow,
} from './chat.repository';
import {
  CoreOrchestratorService,
  StreamEvent,
} from '../../agentic-core/orchestrator/core-orchestrator.service';
import { EcosystemService } from '../ecosystem/ecosystem.service';
import { PersonalHubService } from '../personal-hub/personal-hub.service';
import type { Response } from 'express';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly chatRepo: ChatRepository,
    private readonly orchestrator: CoreOrchestratorService,
    private readonly ecosystemService: EcosystemService,
    private readonly personalHubService: PersonalHubService,
    private readonly config: ConfigService,
    @Inject(GEMINI_CLIENT) private readonly ai: GoogleGenAI,
  ) {}

  async getAllSessions(guestId?: string): Promise<ChatSessionRow[]> {
    return this.chatRepo.getSessions(guestId);
  }

  async getSessionById(
    id: string,
    guestId?: string,
  ): Promise<{ session: ChatSessionRow; messages: ChatMessageRow[] }> {
    const session = await this.chatRepo.getSessionById(id, guestId);
    if (!session) {
      throw new NotFoundException(`Chat session ${id} not found`);
    }
    const messages = await this.chatRepo.getMessagesBySessionId(id);
    return { session, messages };
  }

  async createSession(
    title?: string,
    guestId?: string,
  ): Promise<ChatSessionRow> {
    return this.chatRepo.createSession(title || 'New Investigation', guestId);
  }

  async updateSessionTitle(id: string, title: string): Promise<ChatSessionRow> {
    const cleanTitle = title?.trim();
    if (!cleanTitle) {
      throw new BadRequestException('Session title cannot be empty');
    }
    await this.chatRepo.updateSessionTitle(id, cleanTitle);
    const session = await this.chatRepo.getSessionById(id);
    if (!session) {
      throw new NotFoundException(`Chat session ${id} not found`);
    }
    return session;
  }

  async deleteSession(
    id: string,
    guestId?: string,
  ): Promise<{ success: boolean }> {
    await this.chatRepo.deleteSession(id, guestId);
    return { success: true };
  }

  /**
   * Handle incoming message with Server-Sent Events (SSE) streaming support
   */
  async sendMessageStream(
    sessionId: string,
    prompt: string,
    res: Response,
    agentId?: string,
    guestId?: string,
  ): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const sendSse = (event: string, data: unknown) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    try {
      // 1. Ensure valid session in database
      let targetSessionId = sessionId;
      let existingSession: ChatSessionRow | null = null;
      if (sessionId) {
        existingSession = await this.chatRepo.getSessionById(
          sessionId,
          guestId,
        );
      }

      if (!existingSession) {
        const autoTitle =
          prompt.length > 35 ? prompt.slice(0, 35) + '...' : prompt;
        const newSession = await this.chatRepo.createSession(
          autoTitle,
          guestId,
        );
        targetSessionId = newSession.id;
        sendSse('session_created', {
          id: newSession.id,
          title: newSession.title,
          previousId: sessionId,
        });
      }

      // 2. Save user message to database
      const userMsg = await this.chatRepo.createMessage({
        sessionId: targetSessionId,
        role: 'user',
        content: prompt,
      });

      sendSse('user_message', userMsg);

      // Auto-update session title with AI Semantic Titling on first user message
      let titlePromise: Promise<void> | null = null;
      const messages =
        await this.chatRepo.getMessagesBySessionId(targetSessionId);
      if (messages.length <= 2) {
        // If the session was created manually before without a custom title, set initial fallback
        if (
          existingSession &&
          (existingSession.title === 'New Investigation' ||
            !existingSession.title)
        ) {
          const fallbackTitle =
            prompt.length > 35 ? prompt.slice(0, 35) + '...' : prompt;
          await this.chatRepo.updateSessionTitle(
            targetSessionId,
            fallbackTitle,
          );
          sendSse('session_title_updated', {
            sessionId: targetSessionId,
            title: fallbackTitle,
          });
        }

        // Trigger AI Semantic Titling concurrently (Runs once per session)
        titlePromise = this.generateSemanticTitleAsync(
          targetSessionId,
          prompt,
          sendSse,
        );
      }

      // 3. Prepare compacted sliding conversation history for Gemini (Token Budget Optimization)
      const previousMessages = messages.filter((m) => m.id !== userMsg.id);
      let compactedMessages = previousMessages;

      const MAX_HISTORY_MESSAGES = 20;
      if (previousMessages.length > MAX_HISTORY_MESSAGES) {
        // Keep the very first message (root session context) + the most recent 16 messages
        const rootMessage = previousMessages[0];
        const recentMessages = previousMessages.slice(-16);
        compactedMessages = [rootMessage, ...recentMessages];
        this.logger.log(
          `[Context Compaction] Compacted conversation history from ${previousMessages.length} to ${compactedMessages.length} turns.`,
        );
      }

      const history = compactedMessages.map((m) => ({
        role: m.role === 'user' ? ('user' as const) : ('model' as const),
        parts: [{ text: m.content }],
      }));

      // 4. Load active workspace skills (SOPs) and persistent memory summary (ChatGPT/Claude pattern - memory-summary.md)
      const [activeSkills, memorySummary] = await Promise.all([
        this.ecosystemService.getActiveSkillsInstructions(),
        this.personalHubService.getMemorySummaryMarkdown(guestId),
      ]);

      // 5. Delegate to Core Orchestrator with active Agent Persona, Skill SOPs & Memory Summary
      const result = await this.orchestrator.processPromptStream(
        prompt,
        history,
        (evt: StreamEvent) => {
          sendSse(evt.event, evt.data);
        },
        agentId,
        activeSkills,
        memorySummary,
      );

      // 5. Save assistant response to DB
      const assistantMsg = await this.chatRepo.createMessage({
        sessionId: targetSessionId,
        role: 'assistant',
        content: result.textContent,
        intent: result.intent,
        sideAgent: result.sideAgent,
        actionCard: result.actionCard,
        sourceDomains: result.sourceDomains,
      });

      sendSse('assistant_message', {
        id: assistantMsg.id,
        sessionId: assistantMsg.session_id,
        role: assistantMsg.role,
        content: assistantMsg.content,
        intent: result.intent,
        sideAgent: result.sideAgent,
        actionCard: result.actionCard,
        sourceDomains: result.sourceDomains || assistantMsg.source_domains,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      });
      sendSse('execution_done', {
        messageId: assistantMsg.id,
        sessionId: targetSessionId,
        status: 'completed',
      });

      // 6. Trigger non-blocking background memory extraction (ChatGPT/Claude pattern)
      void this.personalHubService.autoExtractMemoriesFromDialogue(
        prompt,
        result.textContent,
        guestId,
      );

      // Wait for AI Semantic Titling to finish writing to SSE stream before closing
      if (titlePromise) {
        await Promise.race([
          titlePromise,
          new Promise((resolve) => setTimeout(resolve, 3500)),
        ]).catch(() => {});
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      const errorStack = err instanceof Error ? err.stack : undefined;
      this.logger.error(
        `Error processing chat message: ${errorMsg}`,
        errorStack,
      );
      sendSse('error', { message: errorMsg || 'Internal processing error' });
    } finally {
      res.end();
    }
  }

  /**
   * Generate proactive daily morning briefing
   */
  async generateMorningBriefing(
    sessionId: string,
    res: Response,
  ): Promise<void> {
    const prompt =
      'Provide my daily morning briefing: summarize today’s calendar agenda, technical priorities, and focus recommendations.';
    return this.sendMessageStream(
      sessionId,
      prompt,
      res,
      'agent-personal-assistant',
    );
  }

  /**
   * Background AI Semantic Titling (ChatGPT/Claude pattern)
   */
  private async generateSemanticTitleAsync(
    targetSessionId: string,
    prompt: string,
    sendSse: (event: string, data: unknown) => void,
  ): Promise<void> {
    try {
      const response = await this.ai.models.generateContent({
        model: this.config.get<string>(
          'gemini.defaultModel',
          'gemini-3.5-flash',
        ),
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `You are an expert concise title generator for a multi-agent AI assistant.
Summarize the user inquiry or topic in 3 to 5 words.
Rules:
- Match the language of the prompt (Indonesian or English).
- Return ONLY the title text.
- Do NOT use markdown, quotes, emojis, or trailing punctuation.
- Maximum 40 characters.

User Prompt: "${prompt.slice(0, 500)}"
Title:`,
              },
            ],
          },
        ],
        config: {
          temperature: 0.2,
          maxOutputTokens: 30,
        },
      });

      const rawTitle = response.text?.trim() || '';
      const cleanTitle = rawTitle
        .replace(/^title:\s*/i, '')
        .replace(/^["'`]|["'`]$/g, '')
        .replace(/^[#*-]+\s*/, '')
        .replace(/^\*\*|\*\*$/g, '')
        .replace(/^[0-9]+\.\s*/, '')
        .trim();

      if (cleanTitle && cleanTitle.length > 2) {
        const finalTitle =
          cleanTitle.length > 45 ? cleanTitle.slice(0, 45) + '...' : cleanTitle;

        await this.chatRepo.updateSessionTitle(targetSessionId, finalTitle);
        sendSse('session_title_updated', {
          sessionId: targetSessionId,
          title: finalTitle,
        });

        this.logger.log(
          `✨ [AI Semantic Titling] Generated title for session ${targetSessionId}: "${finalTitle}"`,
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `AI semantic title generation background fallback: ${msg}`,
      );
    }
  }
}
