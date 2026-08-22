import { createContext } from 'react'
import type {
  Agent,
  Skill,
  KnowledgeSource,
  Integration,
  McpTool,
  Artifact,
  ChatSession,
  ActionCardData,
  UserMemoryItem,
  ToastNotification,
  ToastType,
  AutomationWorkflow,
} from '@/shared/types/workspace'

export interface WorkspaceContextType {
  // State
  agents: Agent[]
  skills: Skill[]
  knowledgeSources: KnowledgeSource[]
  integrations: Integration[]
  toastMessage: string | null
  toasts: ToastNotification[]

  // Automation & Trigger State (Autonomous AI Pillar)
  automations: AutomationWorkflow[]
  activeAutomationsCount: number
  runningAutomationId: string | null
  createAutomation: (data: Omit<AutomationWorkflow, 'id' | 'totalRuns' | 'createdAt'>) => Promise<AutomationWorkflow> | AutomationWorkflow
  updateAutomation: (id: string, updates: Partial<AutomationWorkflow>) => void
  deleteAutomation: (id: string) => void
  toggleAutomationActive: (id: string) => void
  runAutomationNow: (id: string) => Promise<void>

  // Conversational State
  chatSessions: ChatSession[]
  activeSessionId: string
  activeSession: ChatSession | undefined
  activeArtifact: Artifact | null
  artifacts: Artifact[]
  deleteArtifact: (id: string) => Promise<void>
  isAsideOpen: boolean
  isGeneratingResponse: boolean
  selectedAgentMode: string // 'auto' or agent ID
  activeSourceFilters: string[]

  // Long-Term Memory State (PostgreSQL & memory-summary.md)
  userMemories: UserMemoryItem[]
  memorySummary: string
  triggerMorningBriefing: () => void
  addUserMemory: (memory: Omit<UserMemoryItem, 'id' | 'lastUpdated'>) => void
  deleteUserMemory: (id: string) => void
  clearAllMemories: () => Promise<void>

  // Ecosystem, MCP & Skills Actions
  toggleSkill: (skillId: string) => void
  addCustomSkill: (data: {
    name: string
    description: string
    category: Skill['category']
    sopSummary: string
    instructions: string
    assignedTools: string[]
  }) => void
  toggleIntegrationConnect: (integrationId: string) => void
  updateConnectorConfig: (
    connectorId: string,
    updates: Partial<Integration>
  ) => void
  addCustomConnector: (data: {
    connectionId?: string
    name: string
    category?: string
    endpoint: string
    description: string
    transport?: 'stdio' | 'streamable_http' | 'sse' | 'rest'
    authType?: 'none' | 'bearer' | 'oauth' | 'api_key'
    authConfig?: {
      token?: string
      headers?: Record<string, string>
      env?: Record<string, string>
    }
  }) => void
  updateAgentCapabilities: (
    agentId: string,
    toolIds: string[],
    skillIds: string[]
  ) => void
  testIntegration: (integrationId: string) => Promise<boolean>
  discoverTools: (integrationId: string) => Promise<McpTool[]>
  refreshIntegrations: () => Promise<void>

  // Conversational Actions
  sendChatMessage: (
    prompt: string,
    customOptions?: { agentId?: string; sources?: string[] }
  ) => Promise<void>
  createNewChatSession: () => Promise<string> | string
  switchChatSession: (sessionId: string) => void
  deleteChatSession: (sessionId: string) => Promise<void>
  setActiveArtifact: (artifact: Artifact | null) => void
  saveArtifactContent: (artifactId: string, newContent: string) => void
  executeCardAction: (actionKey: string, card: ActionCardData) => void
  toggleAside: () => void
  setAsideOpen: (open: boolean) => void
  setSelectedAgentMode: (mode: string) => void
  toggleSourceFilter: (sourceId: string) => void

  // Grounding & Knowledge Actions
  toggleKnowledgeSync: (sourceId: string) => void
  toggleKnowledgeSourceConnect: (sourceId: string) => void
  addKnowledgeSource: (data: {
    name: string
    type: KnowledgeSource['type']
    location: string
  }) => void
  ingestDirectDocuments: (payload: {
    name: string
    type: string
    location: string
    description?: string
    documents: Array<{ filePath: string; title: string; content: string }>
  }) => Promise<KnowledgeSource>
  uploadKnowledgeFiles: (
    files: File[],
    name: string,
    sourceId?: string
  ) => Promise<KnowledgeSource>
  deleteKnowledgeSource: (sourceId: string) => void

  // Toast System
  showToast: (message: string, type?: ToastType) => void
  dismissToast: (id: string) => void
  clearToast: () => void
}

export const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)
