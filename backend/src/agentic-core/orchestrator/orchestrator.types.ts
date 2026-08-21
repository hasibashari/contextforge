import { ArtifactRow } from '../../modules/artifacts/artifacts.repository';

export interface StreamEvent {
  event:
    | 'timeline_stage'
    | 'chat_chunk'
    | 'tool_call_start'
    | 'side_agent_log'
    | 'artifact_created'
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
  artifact?: ArtifactRow;
  sourceDomains?: string[];
}

export type StreamEmitter = (event: StreamEvent) => void;
