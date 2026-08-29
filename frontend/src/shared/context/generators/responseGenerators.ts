import type {
  SideAgentExecution,
  AutomationWorkflow,
} from '@/shared/types/workspace'

export interface GeneratedAssistantOutput {
  textContent: string
  intent?: {
    toolName: string
    service:
      | 'obsidian'
      | 'web'
      | 'notion'
      | 'automation'
      | 'knowledge'
      | 'briefing'
    status: 'executing' | 'completed'
    summaryText: string
  }
  sideAgent?: SideAgentExecution
  sourceDomains?: string[]
  createdAutomation?: Omit<AutomationWorkflow, 'id' | 'totalRuns' | 'createdAt'>
}

/**
 * Offline Network Fallback Generator
 * Used only when live backend SSE stream is disconnected or unreachable.
 */
export function generateGeneralReasoningOutput(prompt: string): GeneratedAssistantOutput {
  return {
    textContent: `*(Offline Fallback Mode)*\n\nI have received your prompt: **"${prompt}"**.\n\nPlease ensure your ContextForge backend server is running for live multi-agent AI reasoning and tool execution.`,
  }
}
