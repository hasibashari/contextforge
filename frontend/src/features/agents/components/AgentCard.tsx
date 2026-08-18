import React from 'react'
import { Brain } from 'lucide-react'
import type { Agent } from '../../../shared/types/workspace'
import { EcosystemCard } from '../../../shared/components/EcosystemCard'

interface AgentCardProps {
  agent: Agent
  onInspect: () => void
}

export const AgentCard: React.FC<AgentCardProps> = ({ agent, onInspect }) => {
  const icon = (
    <div
      className={`w-8 h-8 rounded-lg ${agent.avatarColor} text-canvas flex items-center justify-center font-mono font-bold text-xs shadow-2xs`}
    >
      <Brain size={18} />
    </div>
  )

  const skillsCount = agent.assignedSkills?.length || 0
  const toolsCount = agent.assignedTools?.length || 0

  return (
    <EcosystemCard
      icon={icon}
      title={agent.name}
      description={agent.description}
      badge={agent.role}
      metaLine={`${skillsCount} Skills · ${toolsCount} Tools · ${agent.model} · ${agent.successRatePct}% Success`}
      onClick={onInspect}
      onActionClick={onInspect}
      actionTooltip="Inspect Persona, Skills & Tools"
    />
  )
}
