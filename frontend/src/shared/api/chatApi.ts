import { API_BASE_URL, handleApiResponse, getApiHeaders } from './config';
import { consumeSseStream } from './sseClient';
import type { SseEventHandlers } from './sseClient';
import type { ChatSession, ChatMessage } from '@/shared/types/workspace';

export interface BackendChatSession {
  id: string;
  user_id?: string;
  title: string;
  active_artifact_id?: string;
  created_at: string;
  updated_at: string;
}

export interface BackendChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  intent?: ChatMessage['intent'];
  side_agent?: ChatMessage['sideAgent'];
  action_card?: ChatMessage['actionCard'];
  artifact_id?: string;
  source_domains?: string[];
  created_at: string;
}

export function mapBackendMessageToFrontend(m: BackendChatMessage): ChatMessage {
  return {
    id: m.id,
    role: m.role,
    content: m.content,
    timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    intent: m.intent,
    sideAgent: m.side_agent,
    actionCard: m.action_card,
    artifactId: m.artifact_id,
    sourceDomains: m.source_domains,
  };
}

export const chatApi = {
  async getSessions(): Promise<ChatSession[]> {
    const res = await fetch(`${API_BASE_URL}/chat/sessions`, {
      headers: getApiHeaders(),
    });
    const sessions = await handleApiResponse<BackendChatSession[]>(res);
    return sessions.map((s) => ({
      id: s.id,
      title: s.title,
      createdAt: s.created_at,
      messages: [],
    }));
  },

  async getSessionDetails(id: string): Promise<{ session: ChatSession; messages: ChatMessage[] }> {
    const res = await fetch(`${API_BASE_URL}/chat/sessions/${id}`, {
      headers: getApiHeaders(),
    });
    const data = await handleApiResponse<{ session: BackendChatSession; messages: BackendChatMessage[] }>(res);
    const messages = data.messages.map(mapBackendMessageToFrontend);
    const session: ChatSession = {
      id: data.session.id,
      title: data.session.title,
      createdAt: data.session.created_at,
      messages,
    };
    return { session, messages };
  },

  async createSession(title?: string): Promise<ChatSession> {
    const res = await fetch(`${API_BASE_URL}/chat/sessions`, {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify({ title }),
    });
    const s = await handleApiResponse<BackendChatSession>(res);
    return {
      id: s.id,
      title: s.title,
      createdAt: s.created_at,
      messages: [],
    };
  },

  async updateSessionTitle(id: string, title: string): Promise<ChatSession> {
    const res = await fetch(`${API_BASE_URL}/chat/sessions/${id}`, {
      method: 'PATCH',
      headers: getApiHeaders(),
      body: JSON.stringify({ title }),
    });
    const s = await handleApiResponse<BackendChatSession>(res);
    return {
      id: s.id,
      title: s.title,
      createdAt: s.created_at,
      messages: [],
    };
  },

  async deleteSession(id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/chat/sessions/${id}`, {
      method: 'DELETE',
      headers: getApiHeaders(),
    });
    await handleApiResponse<{ success: boolean }>(res);
  },

  async sendMessageStream(
    sessionId: string,
    prompt: string,
    handlers: SseEventHandlers,
    agentId?: string,
  ): Promise<void> {
    await consumeSseStream(
      `${API_BASE_URL}/chat/sessions/${sessionId}/messages?stream=true`,
      { prompt, agentId },
      handlers,
    );
  },

  async triggerMorningBriefing(sessionId: string, handlers: SseEventHandlers): Promise<void> {
    await consumeSseStream(
      `${API_BASE_URL}/chat/morning-briefing`,
      { sessionId },
      handlers,
    );
  },
};
