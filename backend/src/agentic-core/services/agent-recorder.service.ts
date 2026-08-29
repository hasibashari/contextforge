import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';

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

@Injectable()
export class AgentRecorderService {
  private readonly logger = new Logger(AgentRecorderService.name);

  constructor(private readonly db: DatabaseService) {}

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
}
