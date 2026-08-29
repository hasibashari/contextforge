export interface StreamEvent {
  event:
    | 'timeline_stage'
    | 'chat_chunk'
    | 'tool_call_start'
    | 'tool_call_result'
    | 'thought_step'
    | 'side_agent_log'
    | 'automation_created'
    | 'execution_done'
    | 'error';
  data: Record<string, unknown>;
}

export interface OrchestrationResult {
  textContent: string;
  intent?: {
    toolName: string;
    service: string;
    status: string;
    summaryText: string;
  };
  sideAgent?: Record<string, unknown>;
  actionCard?: Record<string, unknown>;
  sourceDomains?: string[];
  rawResult?: unknown;
  summary?: string;
}

export type StreamEmitter = (event: StreamEvent) => void;
