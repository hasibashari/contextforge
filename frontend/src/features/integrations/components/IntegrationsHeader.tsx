import React from 'react'
import { Sparkles, Cpu, Zap } from 'lucide-react'

interface IntegrationsHeaderProps {
  connectorsCount: number
  activeSkillsCount: number
}

export const IntegrationsHeader: React.FC<IntegrationsHeaderProps> = ({
  connectorsCount,
  activeSkillsCount,
}) => {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface-card border border-hairline p-5 sm:p-6 rounded-xl sm:rounded-2xl shadow-xs">
      <div className="min-w-0 flex-1">
        <div className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-caption text-primary mb-1">
          <Sparkles size={13} />
          <span>Extensibility & Agentic Tools</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">
          MCP Tools & Reasoning Skills
        </h1>
        <p className="text-xs sm:text-sm text-body mt-1 max-w-2xl leading-relaxed">
          Connect Model Context Protocol (MCP) servers to give agents tool execution capabilities, and configure reasoning SOP playbooks (Skills) to guide problem-solving workflows.
        </p>
      </div>

      <div className="flex items-center gap-2 font-mono text-xs shrink-0 self-start lg:self-center">
        <div className="flex items-center gap-3 bg-canvas-soft border border-hairline rounded-xl px-3.5 py-2 text-ink shadow-2xs whitespace-nowrap">
          <span className="flex items-center gap-1.5">
            <Cpu size={13} className="text-primary" />
            <strong className="text-ink font-semibold">{connectorsCount}</strong>
            <span className="text-muted">MCP Tools</span>
          </span>
          <span className="text-hairline">|</span>
          <span className="flex items-center gap-1.5">
            <Zap size={13} className="text-timeline-edit" />
            <strong className="text-ink font-semibold">{activeSkillsCount}</strong>
            <span className="text-muted">Active Skills</span>
          </span>
        </div>
      </div>
    </div>
  )
}
