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
import type { Response } from 'express';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly chatRepo: ChatRepository,
    private readonly orchestrator: CoreOrchestratorService,
  ) {}

  async getAllSessions(): Promise<ChatSessionRow[]> {
    return this.chatRepo.getSessions();
  }

  async getSessionById(
    id: string,
  ): Promise<{ session: ChatSessionRow; messages: ChatMessageRow[] }> {
    if (!UUID_REGEX.test(id)) {
      throw new NotFoundException(`Chat session ${id} is not a valid UUID`);
    }
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
    if (UUID_REGEX.test(id)) {
      await this.chatRepo.deleteSession(id);
    }
    return { success: true };
  }

  /**
   * Handle incoming message with Server-Sent Events (SSE) streaming support
   */
  async sendMessageStream(
    sessionId: string,
    prompt: string,
    res: Response,
  ): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const sendSse = (event: string, data: unknown) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    try {
      // 1. Ensure valid UUID session in database
      let targetSessionId = sessionId;
      const isValidUuid = UUID_REGEX.test(sessionId);

      let existingSession: ChatSessionRow | null = null;
      if (isValidUuid) {
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

      // 3. Prepare conversation history for Gemini
      const history = messages
        .filter((m) => m.id !== userMsg.id)
        .map((m) => ({
          role: m.role === 'user' ? ('user' as const) : ('model' as const),
          parts: [{ text: m.content }],
        }));

      // 4. Delegate to Core Orchestrator
      const result = await this.orchestrator.processPromptStream(
        prompt,
        history,
        (evt: StreamEvent) => {
          sendSse(evt.event, evt.data);
        },
      );

      // 5. Save assistant response to DB
      const assistantMsg = await this.chatRepo.createMessage({
        sessionId: targetSessionId,
        role: 'assistant',
        content: result.textContent,
        intent: result.intent,
        sideAgent: result.sideAgent,
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
    return this.sendMessageStream(sessionId, prompt, res);
  }
}
