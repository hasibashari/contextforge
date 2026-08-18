import React from 'react'
import { Brain, ChevronRight } from 'lucide-react'
import type { Agent } from '../../../shared/types/workspace'

interface AgentCardProps {
  agent: Agent
  onInspect: () => void
}

export const AgentCard: React.FC<AgentCardProps> = ({ agent, onInspect }) => {
  return (
    <div className="bg-surface-card border border-hairline hover:border-hairline-strong rounded-xl p-5 transition-colors shadow-2xs space-y-4 flex flex-col justify-between">
      <div>
        {/* Agent Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl ${agent.avatarColor} text-canvas flex items-center justify-center font-mono font-bold text-sm shadow-xs`}
            >
              <Brain size={20} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-ink leading-tight">
                {agent.name}
              </h3>
              <div className="text-xs text-primary font-medium">{agent.role}</div>
            </div>
          </div>

          <span
            className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-semibold ${
              agent.status === 'executing'
                ? 'bg-primary/10 text-primary animate-pulse'
                : 'bg-surface-strong text-muted'
            }`}
          >
            ● {agent.status}
          </span>
        </div>

        <p className="text-xs text-body leading-relaxed mb-4">
          {agent.description}
        </p>

        {/* Capabilities Badges */}
        <div className="space-y-1.5 mb-4">
          <div className="text-[10px] font-mono uppercase tracking-caption text-muted">
            Core Capabilities:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {agent.capabilities.map((cap) => (
              <span
                key={cap.id}
                className="text-[11px] font-mono px-2 py-0.5 rounded bg-canvas-soft border border-hairline text-ink"
              >
                {cap.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Meta & Inspect */}
      <div className="pt-3 border-t border-hairline space-y-3">
        <div className="flex items-center justify-between text-xs font-mono text-muted">
          <span>Model: <strong className="text-ink">{agent.model}</strong></span>
          <span>Completed: <strong className="text-semantic-success">{agent.totalTasksCompleted}</strong></span>
          <span>Success: <strong className="text-semantic-success">{agent.successRatePct}%</strong></span>
        </div>

        <button
          onClick={onInspect}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-canvas-soft hover:bg-canvas text-xs font-semibold text-ink border border-hairline hover:border-hairline-strong transition-colors cursor-pointer"
        >
          <span>Inspect System Prompt & Tools</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}
