import type {
  Artifact,
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
      | 'calendar'
      | 'github'
      | 'database'
      | 'imagen'
      | 'briefing'
      | 'notion'
      | 'automation'
      | 'gdrive'
    status: 'executing' | 'completed'
    summaryText: string
  }
  sideAgent?: SideAgentExecution
  artifact?: Artifact
  sourceDomains?: string[]
  createdAutomation?: Omit<AutomationWorkflow, 'id' | 'totalRuns' | 'createdAt'>
}

/**
 * Offline Network Fallback Generator
 * Used only when live backend SSE stream is disconnected or unreachable.
 */
export function generateGeneralReasoningOutput(prompt: string): GeneratedAssistantOutput {
  const lower = prompt.toLowerCase()
  let analysis = `Here is the analysis regarding: **"${prompt}"**:\n\n`

  if (lower.includes('microservices') || lower.includes('monolith')) {
    analysis += `### 🏛️ Architectural Comparison: Microservices vs Modular Monolith

| Criteria | Modular Monolith | Microservices |
| :--- | :--- | :--- |
| **Operational Complexity** | 🟢 Low (Single deployment pipeline) | 🔴 High (Kubernetes, service mesh, distributed tracing) |
| **Domain Boundaries**      | 🟢 Isolated modules in single repo | 🟢 Independent services in repo/containers |
| **Development Velocity**   | 🚀 Very fast for teams < 25 devs   | ⚠️ Requires rigorous API contract coordination |
| **Inter-module Latency**   | ⚡ In-memory function call (~0ms)  | 🌐 Network call / gRPC (5-50ms) |

### 💡 Recommendation for ContextForge:
Start with a **Modular Monolith**. Separate domain logic (Chat, Agents, Knowledge, Integrations) into isolated TypeScript modules with clean public interfaces.`
  } else {
    analysis += `As your **Personal Assistant Agent**, I am ready to help you analyze goals, plan execution steps, and coordinate agent/tool capabilities to accomplish your objectives.

*(Note: Offline fallback active. Connect to backend for full live multi-agent AI orchestration)*`
  }

  return {
    textContent: analysis,
  }
}
