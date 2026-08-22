import { Injectable, NotFoundException, Logger } from '@nestjs/common';
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
  ) {}

  async getAllSessions(): Promise<ChatSessionRow[]> {
    return this.chatRepo.getSessions();
  }

  async getSessionById(
    id: string,
  ): Promise<{ session: ChatSessionRow; messages: ChatMessageRow[] }> {
    const session = await this.chatRepo.getSessionById(id);
    if (!session) {
      throw new NotFoundException(`Chat session ${id} not found`);
    }
    const messages = await this.chatRepo.getMessagesBySessionId(id);
    return { session, messages };
  }

  async createSession(title?: string): Promise<ChatSessionRow> {
    return this.chatRepo.createSession(title || 'New Investigation');
  }

  async deleteSession(id: string): Promise<{ success: boolean }> {
    await this.chatRepo.deleteSession(id);
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
        existingSession = await this.chatRepo.getSessionById(sessionId);
      }

      if (!existingSession) {
        const autoTitle =
          prompt.length > 35 ? prompt.slice(0, 35) + '...' : prompt;
        const newSession = await this.chatRepo.createSession(autoTitle);
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

      // Auto-update session title if it's the first message
      const messages =
        await this.chatRepo.getMessagesBySessionId(targetSessionId);
      if (messages.length <= 2) {
        const autoTitle =
          prompt.length > 35 ? prompt.slice(0, 35) + '...' : prompt;
        await this.chatRepo.updateSessionTitle(targetSessionId, autoTitle);
        sendSse('session_title_updated', {
          sessionId: targetSessionId,
          title: autoTitle,
        });
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
        this.personalHubService.getMemorySummaryMarkdown(),
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
        artifactId: result.artifact?.id,
        sourceDomains: result.sourceDomains,
      });

      if (result.artifact?.id) {
        await this.chatRepo.updateActiveArtifact(
          targetSessionId,
          result.artifact.id,
        );
      }

      sendSse('assistant_message', assistantMsg);
      sendSse('execution_done', {
        messageId: assistantMsg.id,
        sessionId: targetSessionId,
        status: 'completed',
      });

      // 6. Trigger non-blocking background memory extraction (ChatGPT/Claude pattern)
      void this.personalHubService.autoExtractMemoriesFromDialogue(
        prompt,
        result.textContent,
      );
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
      'Berikan morning briefing harian untuk saya: rangkum agenda kalender hari ini, prioritas tugas teknis, dan saran fokus hari ini.';
    return this.sendMessageStream(
      sessionId,
      prompt,
      res,
      'agent-personal-assistant',
    );
  }
}
