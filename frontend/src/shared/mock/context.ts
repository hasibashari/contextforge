import { createContext } from 'react'
import type {
  Task,
  Agent,
  Skill,
  WorkspaceConnection,
  KnowledgeSource,
  Integration,
  ActivityLogEntry,
  Artifact,
  ChatSession,
  ActionCardData,
  CalendarEvent,
  UserMemoryItem,
  ToastNotification,
  ToastType,
} from '@/shared/types/workspace'

export interface WorkspaceContextType {
  // State
  tasks: Task[]
  agents: Agent[]
  skills: Skill[]
  connections: WorkspaceConnection[]
  knowledgeSources: KnowledgeSource[]
  integrations: Integration[]
  activities: ActivityLogEntry[]
  toastMessage: string | null
  toasts: ToastNotification[]
  activeRunningTaskId: string | null

  // Conversational State
  chatSessions: ChatSession[]
  activeSessionId: string
  activeSession: ChatSession | undefined
  activeArtifact: Artifact | null
  artifacts: Artifact[]
  isAsideOpen: boolean
  isGeneratingResponse: boolean
  selectedAgentMode: string // 'auto' or agent ID
  activeSourceFilters: string[]

  // Proactive, Calendar & Memory State
  calendarEvents: CalendarEvent[]
  userMemories: UserMemoryItem[]
  triggerMorningBriefing: () => void
  addCalendarEvent: (event: Omit<CalendarEvent, 'id'>) => Promise<CalendarEvent> | CalendarEvent
  updateCalendarEventStatus: (id: string, status: CalendarEvent['status']) => void
  addUserMemory: (memory: Omit<UserMemoryItem, 'id' | 'lastUpdated'>) => void
  deleteUserMemory: (id: string) => void

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
    category: Integration['category']
    endpoint: string
    description: string
    transport?: 'stdio' | 'sse' | 'rest'
  }) => void
  updateAgentCapabilities: (
    agentId: string,
    toolIds: string[],
    skillIds: string[]
  ) => void
  testIntegration: (integrationId: string) => Promise<boolean>

  // Connections Actions (4. Connection)
  addConnection: (data: {
    name: string
    connectionType: WorkspaceConnection['connectionType']
    provider: string
    authType: WorkspaceConnection['authType']
    endpointUrl?: string
    config?: Record<string, unknown>
  }) => Promise<void>
  updateConnection: (id: string, updates: Partial<WorkspaceConnection>) => Promise<void>
  testConnection: (connectionId: string) => Promise<boolean>
  deleteConnection: (connectionId: string) => Promise<void>

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

  // Task & Legacy Actions
  createTask: (params: {
    title: string
    objective: string
    agentId?: string
    selectedSources: string[]
  }) => Task
  getTaskById: (id: string) => Task | undefined
  approveTask: (taskId: string) => void
  rejectTask: (taskId: string, reason?: string) => void
  advanceTaskStage: (taskId: string) => void
  simulateLiveRun: (taskId: string) => void
  toggleKnowledgeSync: (sourceId: string) => void
  toggleKnowledgeSourceConnect: (sourceId: string) => void

  // Toast System
  showToast: (message: string, type?: ToastType) => void
  dismissToast: (id: string) => void

  addKnowledgeSource: (data: {
    name: string
    type: KnowledgeSource['type']
    location: string
  }) => void
  uploadKnowledgeFiles: (
    files: File[],
    name: string,
    sourceId?: string
  ) => Promise<KnowledgeSource>
  deleteKnowledgeSource: (sourceId: string) => void
  clearToast: () => void
}

export const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)
