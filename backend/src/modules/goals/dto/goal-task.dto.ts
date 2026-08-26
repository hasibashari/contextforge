export class CreateGoalTaskDto {
  goalId: string;
  title: string;
  description?: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  mcpTarget?: string;
  mcpResourceId?: string;
  riskLevel?: 'low_risk' | 'medium_risk' | 'high_risk';
  requiresUserApproval?: boolean;
}

export class UpdateGoalTaskStatusDto {
  status:
    | 'pending'
    | 'in_progress'
    | 'verified_completed'
    | 'incomplete'
    | 'unverified';
  verificationEvidence?: Record<string, any>;
  verificationNotes?: string;
  userApprovalStatus?: 'none' | 'approved' | 'rejected';
}
