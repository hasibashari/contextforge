import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';
import { ArtifactRow } from '../../modules/artifacts/artifacts.repository';

export interface CreateArtifactDto {
  sessionId?: string;
  type:
    | 'markdown_doc'
    | 'code_patch'
    | 'reminder_event'
    | 'search_synthesis'
    | 'image_asset';
  title: string;
  content: string;
  locationPath?: string;
  serviceOrigin?: string;
  diffs?: unknown;
  imageUrl?: string;
  imagePrompt?: string;
  wordCount?: number;
}

export interface CreateSideAgentExecutionDto {
  messageId?: string;
  agentId: string;
  agentName: string;
  agentRole: string;
  taskGoal: string;
  actionType: string;
  targetResource: string;
  status?: 'queued' | 'running' | 'completed' | 'failed';
  riskLevel?: 'low_risk' | 'medium_risk' | 'high_risk';
  executionTimeMs: number;
  logs: string[];
  summary: string;
  filesModified: string[];
  artifactId?: string;
}

export interface CreateCalendarEventDto {
  title: string;
  eventDate: string;
  eventTime: string;
  duration?: string;
  category?: string;
  status?: string;
}

@Injectable()
export class AgentRecorderService {
  private readonly logger = new Logger(AgentRecorderService.name);

  constructor(private readonly db: DatabaseService) {}

  /**
   * Persists an artifact (document, code patch, visual) to PostgreSQL
   */
  async recordArtifact(dto: CreateArtifactDto): Promise<ArtifactRow> {
    const wordCount =
      dto.wordCount ?? dto.content.split(/\s+/).filter(Boolean).length;

    const res = await this.db.query<ArtifactRow>(
      `INSERT INTO artifacts 
        (session_id, type, title, content, location_path, service_origin, diffs, image_url, image_prompt, word_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *;`,
      [
        dto.sessionId || null,
        dto.type,
        dto.title,
        dto.content,
        dto.locationPath || null,
        dto.serviceOrigin || null,
        dto.diffs ? JSON.stringify(dto.diffs) : null,
        dto.imageUrl || null,
        dto.imagePrompt || null,
        wordCount,
      ],
    );

    return res.rows[0];
  }

  /**
   * Persists a side agent execution entry to PostgreSQL
   */
  async recordSideAgentExecution(
    dto: CreateSideAgentExecutionDto,
  ): Promise<Record<string, unknown>> {
    const res = await this.db.query<Record<string, unknown>>(
      `INSERT INTO side_agent_executions 
        (message_id, agent_id, agent_name, agent_role, task_goal, action_type, target_resource, status, risk_level, execution_time_ms, logs, summary, files_modified, artifact_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *;`,
      [
        dto.messageId || null,
        dto.agentId,
        dto.agentName,
        dto.agentRole,
        dto.taskGoal,
        dto.actionType,
        dto.targetResource,
        dto.status || 'completed',
        dto.riskLevel || 'low_risk',
        dto.executionTimeMs,
        dto.logs,
        dto.summary,
        dto.filesModified,
        dto.artifactId || null,
      ],
    );

    return res.rows[0];
  }

  /**
   * Persists a calendar event to PostgreSQL
   */
  async recordCalendarEvent(
    dto: CreateCalendarEventDto,
  ): Promise<Record<string, unknown>> {
    const res = await this.db.query<Record<string, unknown>>(
      `INSERT INTO calendar_events (title, event_date, event_time, duration, category, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *;`,
      [
        dto.title,
        dto.eventDate,
        dto.eventTime,
        dto.duration || '30m',
        dto.category || 'task',
        dto.status || 'upcoming',
      ],
    );

    return res.rows[0];
  }
}
