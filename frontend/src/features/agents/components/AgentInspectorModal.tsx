import React from 'react'
import { Brain, Terminal, X } from 'lucide-react'
import type { Agent } from '../../../shared/types/workspace'

interface AgentInspectorModalProps {
  agent: Agent | null
  onClose: () => void
}

export const AgentInspectorModal: React.FC<AgentInspectorModalProps> = ({
  agent,
  onClose,
}) => {
  if (!agent) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs">
      <div className="bg-surface-card border border-hairline rounded-xl max-w-2xl w-full p-6 space-y-5 shadow-xl max-h-[90vh] overflow-y-auto overscroll-contain">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl ${agent.avatarColor} text-canvas flex items-center justify-center font-mono font-bold text-sm`}
            >
              <Brain size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-ink">{agent.name}</h2>
              <div className="text-xs text-primary font-medium">{agent.role}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-canvas-soft text-muted hover:text-ink cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Model & Config */}
        <div className="grid grid-cols-3 gap-3 p-3 bg-canvas-soft rounded-lg border border-hairline text-xs font-mono">
          <div>
            <div className="text-muted text-[10px] uppercase">Base LLM</div>
            <div className="font-semibold text-ink">{agent.model}</div>
          </div>
          <div>
            <div className="text-muted text-[10px] uppercase">Temperature</div>
            <div className="font-semibold text-ink">{agent.temperature}</div>
          </div>
          <div>
            <div className="text-muted text-[10px] uppercase">Historical Success</div>
            <div className="font-semibold text-semantic-success">{agent.successRatePct}%</div>
          </div>
        </div>

        {/* System Prompt */}
        <div className="space-y-1.5">
          <div className="text-xs font-mono uppercase tracking-caption text-muted">
            System Prompt & Guardrails:
          </div>
          <pre className="p-3 bg-ink text-canvas font-mono text-xs rounded-lg whitespace-pre-wrap leading-relaxed">
            {agent.systemPrompt}
          </pre>
        </div>

        {/* Assigned Tools */}
        <div className="space-y-1.5">
          <div className="text-xs font-mono uppercase tracking-caption text-muted">
            Permitted Sandboxed Tools:
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            {agent.assignedTools.map((t) => (
              <div
                key={t}
                className="p-2 rounded bg-canvas border border-hairline flex items-center gap-2 text-ink"
              >
                <Terminal size={13} className="text-primary shrink-0" />
                <span className="truncate">{t}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-3 border-t border-hairline flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-canvas-soft hover:bg-canvas text-xs font-semibold text-ink border border-hairline rounded-lg cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  )
}
