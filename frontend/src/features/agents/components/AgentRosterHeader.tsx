import React from 'react'
import { Sparkles } from 'lucide-react'

interface AgentRosterHeaderProps {
  totalAgents: number
}

export const AgentRosterHeader: React.FC<AgentRosterHeaderProps> = ({ totalAgents }) => {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface-card border border-hairline p-5 sm:p-6 rounded-xl sm:rounded-2xl shadow-xs">
      <div className="min-w-0 flex-1">
        <div className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-caption text-primary mb-1">
          <Sparkles size={13} />
          <span>Agent Roster & Capabilities</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">
          Autonomous Agent Directory
        </h1>
        <p className="text-xs sm:text-sm text-body mt-1 max-w-2xl leading-relaxed">
          Specialized autonomous agents equipped with sandboxed tools, AST verification models, and multi-source groundings.
        </p>
      </div>

      <div className="flex items-center gap-2 text-xs font-mono shrink-0 self-start lg:self-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-canvas-soft border border-hairline text-ink whitespace-nowrap shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-semantic-success animate-pulse shrink-0" />
          <span className="text-body font-medium">
            <strong className="text-ink font-semibold">{totalAgents}</strong> Configured Personas
          </span>
        </div>
      </div>
    </div>
  )
}
