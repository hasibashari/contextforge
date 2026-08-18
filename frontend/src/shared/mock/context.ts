import { createContext } from 'react'
import type {
  Task,
  Agent,
  KnowledgeSource,
  Integration,
  ActivityLogEntry,
} from '../types/workspace'

export interface WorkspaceContextType {
  // State
  tasks: Task[]
  agents: Agent[]
  knowledgeSources: KnowledgeSource[]
  integrations: Integration[]
  activities: ActivityLogEntry[]
  toastMessage: string | null
  activeRunningTaskId: string | null

  // Actions
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
  testIntegration: (integrationId: string) => Promise<boolean>
  showToast: (message: string) => void
  clearToast: () => void
}

export const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)
