import type { Artifact, ChatMessage, AutomationWorkflow } from '@/shared/types/workspace';
import { getApiHeaders } from './config';

export interface SseEventHandlers {
  onSessionCreated?: (data: { id: string; title: string; previousId?: string }) => void;
  onUserMessage?: (message: ChatMessage) => void;
  onSessionTitleUpdated?: (data: { sessionId?: string; title: string }) => void;
  onTimelineStage?: (data: { stage: string; label: string }) => void;
  onChatChunk?: (data: { delta: string }) => void;
  onToolCallStart?: (data: { toolName: string; input: Record<string, unknown>; turn?: number }) => void;
  onToolCallResult?: (data: { toolName: string; summary: string; durationMs?: number }) => void;
  onThoughtStep?: (data: { turn: number; status: string }) => void;
  onSideAgentLog?: (data: { sideAgentId: string; log: string; riskLevel: string }) => void;
  onArtifactCreated?: (artifact: Artifact) => void;
  onAutomationCreated?: (automation: AutomationWorkflow) => void;
  onAssistantMessage?: (message: ChatMessage) => void;
  onExecutionDone?: (data: { messageId?: string; sessionId?: string; status: string }) => void;
  onError?: (error: Error) => void;
}

export async function consumeSseStream(
  url: string,
  body: Record<string, unknown>,
  handlers: SseEventHandlers,
): Promise<void> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: getApiHeaders({
        Accept: 'text/event-stream',
      }),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`SSE Request failed with status ${res.status}: ${res.statusText}`);
    }

    if (!res.body) {
      throw new Error('ReadableStream not supported on response body');
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n\n');
      buffer = parts.pop() || '';

      for (const part of parts) {
        if (!part.trim()) continue;

        let eventType = 'message';
        let eventData = '';

        const lines = part.split('\n');
        for (const line of lines) {
          if (line.startsWith('event:')) {
            eventType = line.slice(6).trim();
          } else if (line.startsWith('data:')) {
            eventData = line.slice(5).trim();
          }
        }

        if (!eventData) continue;

        try {
          const parsedData = JSON.parse(eventData);

          switch (eventType) {
            case 'session_created':
              handlers.onSessionCreated?.(parsedData);
              break;
            case 'user_message':
              handlers.onUserMessage?.(parsedData);
              break;
            case 'session_title_updated':
              handlers.onSessionTitleUpdated?.(parsedData);
              break;
            case 'timeline_stage':
              handlers.onTimelineStage?.(parsedData);
              break;
            case 'chat_chunk':
              handlers.onChatChunk?.(parsedData);
              break;
            case 'tool_call_start':
              handlers.onToolCallStart?.(parsedData);
              break;
            case 'tool_call_result':
              handlers.onToolCallResult?.(parsedData);
              break;
            case 'thought_step':
              handlers.onThoughtStep?.(parsedData);
              break;
            case 'side_agent_log':
              handlers.onSideAgentLog?.(parsedData);
              break;
            case 'artifact_created':
              handlers.onArtifactCreated?.(parsedData);
              break;
            case 'automation_created':
              handlers.onAutomationCreated?.(parsedData);
              break;
            case 'assistant_message':
              handlers.onAssistantMessage?.(parsedData);
              break;
            case 'execution_done':
              handlers.onExecutionDone?.(parsedData);
              break;
            case 'error':
              handlers.onError?.(new Error(parsedData.message || 'Stream error occurred'));
              break;
          }
        } catch {
          // ignore JSON parse error for malformed lines
        }
      }
    }
  } catch (err) {
    handlers.onError?.(err instanceof Error ? err : new Error(String(err)));
  }
}
