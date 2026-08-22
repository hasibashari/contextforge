import React from 'react'
import { Cpu } from 'lucide-react'
import type { Agent } from '@/shared/types/workspace'
import { AgentIconBox } from '@/shared/components'

interface AgentMentionPopoverProps {
  agents: Agent[]
  onSelectAgent: (agentId: string) => void
}

export const AgentMentionPopover: React.FC<AgentMentionPopoverProps> = ({
  agents,
  onSelectAgent,
}) => {
  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 bg-surface-card border border-hairline rounded-xl p-2 shadow-xl space-y-1 text-xs font-mono max-h-48 overflow-y-auto z-20">
      <div className="text-[10px] uppercase text-muted px-2 py-1 flex items-center gap-1">
        <Cpu size={11} className="text-primary" />
        <span>Route to Specialized Agent:</span>
      </div>
      {agents.map((ag) => (
        <button
          key={ag.id}
          type="button"
          onClick={() => onSelectAgent(ag.id.replace('agent-', ''))}
          className="w-full px-2 py-1.5 rounded-lg hover:bg-canvas-soft text-left flex items-center justify-between text-ink transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <AgentIconBox agent={ag} size="sm" className="w-6 h-6 rounded-md" />
            <span className="font-semibold text-primary">
              @{ag.id.replace('agent-', '')}
            </span>
            <span className="text-muted truncate">{ag.name}</span>
          </div>
          <span className="text-[10px] text-muted">{ag.role}</span>
        </button>
      ))}
    </div>
  )
}
