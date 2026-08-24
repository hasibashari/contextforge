// Domain types for ContextForge Conversational Agentic Workspace

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
  category: 'mcp' | 'github' | 'notion' | 'openapi' | 'terminal' | 'ast' | 'obsidian' | 'web' | 'calendar'
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

export type AgentRoleType = 'orchestrator' | 'researcher'
export type AgentPermissionType = 'read_only' | 'sandbox_write' | 'full_system'

export interface Agent {
  id: string
  name: string
  role: string
  agentType?: AgentRoleType
  permissions?: AgentPermissionType
  description: string
  avatarColor: string
  model: string
  temperature?: number
  systemPrompt: string
  capabilities: AgentCapability[]
  assignedTools: string[]
  assignedSkills?: string[]
  status: 'idle' | 'executing' | 'offline'
  totalTasksCompleted: number
  successRatePct: number
}

export interface Skill {
  id: string
  name: string
  description: string
  category: 'architecture' | 'qa_testing' | 'security' | 'knowledge' | 'database' | 'productivity'
  icon: string
  sopSummary: string
  instructions: string
  assignedTools: string[]
  enabled: boolean
  isCustom?: boolean
}

export interface WorkspaceConnection {
  id: string
  userId?: string
  name: string
  connectionType: 'llm_provider' | 'mcp_server' | 'database' | 'oauth_service'
  provider:
    | 'google_gemini'
    | 'anthropic'
    | 'openai'
    | 'github'
    | 'google_calendar'
    | 'postgres'
    | 'custom_mcp'
    | string
  authType: 'api_key' | 'oauth2' | 'connection_string' | 'bearer_token' | 'none'
  endpointUrl?: string
  configEncrypted?: Record<string, unknown>
  status: 'active' | 'invalid' | 'testing' | 'disabled'
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export interface KnowledgeSource {
  id: string
  type:
    | 'document_upload'
    | 'obsidian_vault'
    | 'local_folder'
    | 'github_repo'
    | 'database_schema'
    | 'notion_workspace'
    | 'openapi_spec'
    | 'web_search'
    | 'document'
  name: string
  description: string
  location: string
  meta: string
  filesCount: number
  chunksCount: number
  lastSynced: string
  status: 'synced' | 'syncing' | 'disconnected' | 'error'
  iconType: 'terminal' | 'layers' | 'globe' | 'database' | 'file' | 'book-open' | 'upload' | 'folder'
  color: string
  isLocalSandbox?: boolean
  embeddingModel?: string
  embeddingDimension?: number
  subfolderScope?: string
  mountRoot?: string
  fileList?: Array<{ name: string; size: number; mimeType?: string }>
}

export interface McpTool {
  name: string
  description: string
  parametersSchema: Record<string, unknown>
  readOnly: boolean
}

export interface Integration {
  id: string
  connectionId?: string
  name: string
  category?: string
  status: 'connected' | 'connecting' | 'disconnected' | 'error'
  endpoint: string
  version: string
  description: string
  tools: McpTool[]
  lastPingMs: number
  latencyMs: number
  healthMessage?: string
  health_message?: string
  transport?: 'stdio' | 'streamable_http' | 'sse' | 'rest'
  authType?: 'none' | 'bearer' | 'oauth' | 'api_key'
  authConfig?: {
    token?: string
    apiKey?: string
    workspaceName?: string
    vaultName?: string
    vaultPath?: string
    vaultId?: string
    headers?: Record<string, string>
    env?: Record<string, string>
  }
  isCustom?: boolean
  mountedKnowledgeSourceId?: string
  mountedKnowledgeSourceName?: string
  targetBinding?: {
    folderScope: string
    defaultOutputPath?: string
  }
}

// -------------------------------------------------------------
// Conversational Outcome & Artifact Types
// -------------------------------------------------------------

export interface UserMemoryItem {
  id: string
  category: 'profile' | 'preference' | 'project' | 'workflow'
  key: string
  value: string
  lastUpdated: string
}

export interface ActionCardData {
  obsidianUri: string
  id: string
  type: string
  title: string
  subtitle?: string
  description: string
  badgeText?: string
  badge?: string
  badgeVariant?: string
  badgeColor?: string
  locationPath?: string
  targetResource?: string
  imageUrl?: string
  imagePrompt?: string
  metaDetails?: Record<string, string>
  actions: {
    label: string
    actionKey?: string
    key?: string
    primary?: boolean
    icon?: string
  }[]
}

export interface Artifact {
  id: string
  type: 'markdown_doc' | 'code_patch' | 'reminder_event' | 'search_synthesis' | 'image_asset'
  title: string
  content: string
  locationPath?: string
  imageUrl?: string
  imagePrompt?: string
  serviceOrigin?: 'obsidian' | 'calendar' | 'web' | 'github' | 'postgres' | 'imagen' | 'notion'
  createdAt: string
  updatedAt?: string
  wordCount?: number
  diffs?: CodeDiffFile[]
}

export type ExecutionRiskLevel = 'low_risk' | 'medium_risk' | 'high_risk'

export interface SideAgentExecution {
  id: string
  agentId: string
  agentName: string
  agentRole: string
  avatarColor?: string
  taskGoal: string
  actionType:
    | 'action_write'
    | 'create_file'
    | 'edit_file'
    | 'obsidian_write'
    | 'terminal_command'
    | 'api_mutate'
    | 'calendar_schedule'
    | 'image_render'
  targetResource: string
  status: 'queued' | 'running' | 'completed' | 'failed'
  riskLevel: ExecutionRiskLevel
  executionTimeMs: number
  tokensUsed: {
    input: number
    output: number
  }
  logs: string[]
  summary: string
  filesModified?: string[]
  diffPreview?: string
  artifactId?: string
}

export interface ReasoningStep {
  id: string
  stage: 'thinking' | 'planning' | 'tool_execution' | 'reading' | 're-planning' | 'done' | string
  label: string
  toolName?: string
  agentName?: string
  timestamp?: string
  durationMs?: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  intent?: {
    toolName: string
    service: 'obsidian' | 'web' | 'calendar' | 'github' | 'database' | 'imagen' | 'briefing' | 'notion' | 'automation' | 'gdrive'
    status: 'executing' | 'completed'
    summaryText: string
  }
  sideAgent?: SideAgentExecution
  actionCard?: ActionCardData
  artifactId?: string
  sourceDomains?: string[]
  reasoningSteps?: ReasoningStep[]
  thinkingDurationMs?: number
}

export interface ChatSession {
  id: string
  title: string
  createdAt: string
  messages: ChatMessage[]
  activeArtifactId?: string
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
    | 'obsidian_note_created'
    | 'reminder_created'
    | 'web_searched'
    | 'image_generated'
    | 'morning_briefing'
  summary: string
  details?: Record<string, unknown>
  status: 'info' | 'success' | 'warning' | 'error'
}

export type ToastType = 'success' | 'info' | 'warning' | 'error'

export interface ToastNotification {
  id: string
  message: string
  type: ToastType
  duration?: number
}

export type AutomationTriggerType = 'schedule' | 'event' | 'manual'
export type AutomationStatus = 'idle' | 'running' | 'success' | 'failed'

export interface AutomationStep {
  stage: StepStage | 'trigger_evaluation' | 'tool_execution' | 'deliverable'
  title: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  toolName?: string
  logs: string[]
  durationMs?: number
}

export interface AutomationWorkflow {
  id: string
  name: string
  description: string
  agentId: string
  agentName?: string
  mcpServerId?: string
  mcpTools: string[]
  triggerType: AutomationTriggerType
  scheduleCron?: string
  scheduleLabel: string
  eventSource?: string
  promptTemplate: string
  guardrailStrictHITL: boolean
  isActive: boolean
  lastRunAt?: string
  lastRunStatus?: AutomationStatus
  totalRuns: number
  createdAt: string
  updatedAt?: string
}

export interface AutomationRun {
  id: string
  workflowId: string
  workflowName: string
  agentId: string
  agentName: string
  triggerSource: string
  status: AutomationStatus
  startedAt: string
  completedAt?: string
  durationMs: number
  tokensUsed: {
    input: number
    output: number
    total: number
  }
  steps: AutomationStep[]
  outputSummary: string
  outputArtifactUrl?: string
  error?: string
}

