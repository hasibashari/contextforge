export class CreateGoalDto {
  title: string;
  description?: string;
  category?: 'productivity' | 'learning' | 'health' | 'finance' | 'custom';
  targetMetrics?: Record<string, any>;
  cronEvaluation?: string;
  linkedMcpServers?: string[];
  notionParentPageId?: string;
  notionDatabaseId?: string;
  initialTasks?: Array<{
    title: string;
    description?: string;
    scheduledStart?: string;
    scheduledEnd?: string;
    mcpTarget?: string;
    riskLevel?: 'low_risk' | 'medium_risk' | 'high_risk';
  }>;
}
