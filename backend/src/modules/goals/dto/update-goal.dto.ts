export class UpdateGoalDto {
  title?: string;
  description?: string;
  category?: 'productivity' | 'learning' | 'health' | 'finance' | 'custom';
  status?: 'active' | 'paused' | 'completed' | 'abandoned';
  targetMetrics?: Record<string, any>;
  currentProgressPct?: number;
  streakDays?: number;
  cronEvaluation?: string;
  linkedMcpServers?: string[];
  notionParentPageId?: string;
  notionDatabaseId?: string;
}
