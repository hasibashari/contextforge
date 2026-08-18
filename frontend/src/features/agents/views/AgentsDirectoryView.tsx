import { useState } from 'react'
import { useWorkspace } from '@/shared/mock'
import type { Agent } from '@/shared/types/workspace'
import {
  AgentCard,
  AgentInspectorModal,
  AgentRosterHeader,
} from '@/features/agents'

export default function AgentsDirectoryView() {
  const { agents } = useWorkspace()
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner Header */}
      <AgentRosterHeader totalAgents={agents.length} />

      {/* Agents Roster Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {agents.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            onInspect={() => setSelectedAgent(agent)}
          />
        ))}
      </div>

      {/* Detail Inspector Modal */}
      <AgentInspectorModal
        agent={selectedAgent}
        onClose={() => setSelectedAgent(null)}
      />
    </div>
  )
}
