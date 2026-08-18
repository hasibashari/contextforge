import React from 'react'
import { Sparkles } from 'lucide-react'

interface AgentRosterHeaderProps {
  totalAgents: number
}

export const AgentRosterHeader: React.FC<AgentRosterHeaderProps> = ({ totalAgents }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-card border border-hairline p-5 sm:p-6 rounded-xl shadow-xs">
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-caption text-primary mb-1">
          <Sparkles size={13} />
          <span>Agent Roster & Capabilities</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">
          Autonomous Agent Directory
        </h1>
        <p className="text-xs sm:text-sm text-body mt-1">
          Specialized autonomous agents equipped with sandboxed tools, AST verification models, and multi-source groundings.
        </p>
      </div>

      <div className="flex items-center gap-2 text-xs font-mono">
        <div className="px-3 py-1.5 rounded-lg bg-canvas-soft border border-hairline text-ink">
          <strong className="text-primary">{totalAgents}</strong> Configured Agents
        </div>
      </div>
    </div>
  )
}
