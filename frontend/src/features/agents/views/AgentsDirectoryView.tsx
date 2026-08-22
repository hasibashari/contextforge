import { useState } from 'react'
import { Brain } from 'lucide-react'
import { useWorkspace } from '@/shared/context'
import { PageHeader, EcosystemCard } from '@/shared/components'
import { AgentInspectorModal } from '@/features/agents'

export default function AgentsDirectoryView() {
  const { agents } = useWorkspace()
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
  const selectedAgent = agents.find((a) => a.id === selectedAgentId) || null

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
      {/* Top Banner Header */}
      <PageHeader
        eyebrow="Agent Roster & Capabilities"
        title="Autonomous Agent Directory"
        description="Specialized autonomous agents equipped with sandboxed tools, AST verification models, and multi-source groundings."
        actions={
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-canvas-soft border border-hairline text-ink whitespace-nowrap shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-semantic-success animate-pulse shrink-0" />
            <span className="text-body font-medium">
              <strong className="text-ink font-semibold">{agents.length}</strong> Configured Personas
            </span>
          </div>
        }
      />

      {/* Agents Roster Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {agents.map((agent) => {
          const skillsCount = agent.assignedSkills?.length || 0
          const toolsCount = agent.assignedTools?.length || 0
          const roleSubtitle = agent.role.replace(/^Side Agent:\s*/i, '').replace(/^Main\s*/i, '')

          return (
            <EcosystemCard
              key={agent.id}
              icon={
                <div
                  className={`w-8 h-8 rounded-lg ${agent.avatarColor} text-canvas flex items-center justify-center font-mono font-bold text-xs shadow-2xs`}
                >
                  <Brain size={18} />
                </div>
              }
              title={agent.name}
              subtitle={roleSubtitle}
              description={agent.description}
              metaLine={`${skillsCount} Skills · ${toolsCount} Tools · ${agent.model} · ${agent.successRatePct}% Success`}
              onClick={() => setSelectedAgentId(agent.id)}
              hideAction={true}
            />
          )
        })}
      </div>

      {/* Detail Inspector Modal */}
      <AgentInspectorModal
        agent={selectedAgent}
        onClose={() => setSelectedAgentId(null)}
      />
    </div>
  )
}
