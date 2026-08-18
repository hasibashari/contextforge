// Domain types for ContextForge AI Agent Workspace

export type TaskStatus =
  | 'queued'
  | 'planning'
  | 'running_tools'
  | 'analyzing'
  | 'waiting_approval'
  | 'completed'
  | 'failed'

export type StepStage =
  | 'planning'
  | 'context_retrieval'
  | 'tool_execution'
  | 'validation'
  | 'deliverable'

export type StepStatus = 'pending' | 'in_progress' | 'completed' | 'failed'

export interface ToolCall {
  id: string
  toolName: string
  category: 'mcp' | 'github' | 'notion' | 'openapi' | 'terminal' | 'ast'
  description: string
  startedAt: string
  durationMs: number
  status: 'running' | 'success' | 'error'
  input: Record<string, unknown>
  output?: Record<string, unknown>
}

export interface ExecutionStep {
  id: string
  stage: StepStage
  title: string
  status: StepStatus
  startedAt: string
  completedAt?: string
  toolCalls?: ToolCall[]
  logs: string[]
}

export interface VerificationCheckpoint {
  id: string
  text: string
  category: 'ast_analysis' | 'unit_tests' | 'cve_scan' | 'rfc_compliance'
  done: boolean
  details?: string
}

export interface CodeDiffFile {
  file: string
  additions: number
  deletions: number
  oldCode?: string
  newCode?: string
}

export interface TaskDeliverable {
  id: string
  type: 'pull_request' | 'rfc_document' | 'patch_bundle' | 'database_migration'
  title: string
  summary: string
  impactLevel: 'High' | 'Medium' | 'Low'
  impactArea: string
  checkpoints: VerificationCheckpoint[]
  diffs: CodeDiffFile[]
  pullRequestUrl?: string
  branchName?: string
}

export interface Task {
  id: string
  title: string
  objective: string
  repo: string
  agentId: string
  status: TaskStatus
  currentStage: StepStage
  createdAt: string
  completedAt?: string
  knowledgeSources: string[]
  toolsUsed: string[]
  steps: ExecutionStep[]
  deliverable?: TaskDeliverable
  tokensUsed?: {
    input: number
    output: number
    total: number
    estimatedCostUsd: number
  }
}

export interface AgentCapability {
  id: string
  name: string
  description: string
}

export interface Agent {
  id: string
  name: string
  role: string
  description: string
  avatarColor: string
  model: string
  temperature: number
  systemPrompt: string
  capabilities: AgentCapability[]
  assignedTools: string[]
  status: 'idle' | 'executing' | 'offline'
  totalTasksCompleted: number
  successRatePct: number
}

export interface KnowledgeSource {
  id: string
  type: 'github_repo' | 'notion_workspace' | 'openapi_spec' | 'database_schema' | 'document'
  name: string
  description: string
  location: string
  meta: string
  filesCount: number
  chunksCount: number
  lastSynced: string
  status: 'synced' | 'syncing' | 'error'
  iconType: 'terminal' | 'layers' | 'globe' | 'database' | 'file'
  color: string
}

export interface McpTool {
  name: string
  description: string
  parametersSchema: Record<string, unknown>
  readOnly: boolean
}

export interface Integration {
  id: string
  name: string
  category: 'mcp_server' | 'git_provider' | 'documentation' | 'notification' | 'telemetry'
  status: 'connected' | 'connecting' | 'disconnected' | 'error'
  endpoint: string
  version: string
  description: string
  tools: McpTool[]
  lastPingMs: number
  latencyMs: number
}

export interface ActivityLogEntry {
  id: string
  timestamp: string
  taskId?: string
  taskTitle?: string
  agentId: string
  agentName: string
  actionType:
    | 'task_dispatched'
    | 'step_started'
    | 'tool_invoked'
    | 'ast_verified'
    | 'human_approved'
    | 'human_rejected'
    | 'pr_created'
    | 'source_indexed'
  summary: string
  details?: Record<string, unknown>
  status: 'info' | 'success' | 'warning' | 'error'
}
