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
  let analysis = `Berikut adalah analisis terkait: **"${prompt}"**:\n\n`

  if (lower.includes('microservices') || lower.includes('monolith')) {
    analysis += `### 🏛️ Perbandingan Arsitektur: Microservices vs Modular Monolith

| Kriteria | Modular Monolith | Microservices |
| :--- | :--- | :--- |
| **Kompleksitas Operasional** | 🟢 Rendah (1 deployment pipeline) | 🔴 Tinggi (K8s, service mesh, tracing) |
| **Batas Domain (Boundaries)**| 🟢 Modul terpisah di satu repo | 🟢 Service terpisah di repo/container |
| **Kecepatan Development**   | 🚀 Sangat cepat untuk tim < 25 org | ⚠️ Butuh koordinasi API contract |
| **Latensi Antar-Modul**     | ⚡ In-memory function call (~0ms) | 🌐 Network call / gRPC (5-50ms) |

### 💡 Rekomendasi untuk ContextForge:
Mulai dengan **Modular Monolith** terlebih dahulu. Pisahkan domain code (Chat, Agents, Knowledge, Integrations) ke dalam modul TypeScript yang terisolasi dengan public interface yang jelas.`
  } else {
    analysis += `Sebagai **Personal Assistant Agent**, saya siap mendampingi Anda memahami goal, merencanakan langkah, dan mengoordinasikan berbagai kapabilitas agen/tool untuk mencapai target Anda.

*(Catatan: Mode offline aktif. Sambungkan ke backend untuk orkestrasi live AI penuh)*`
  }

  return {
    textContent: analysis,
  }
}
