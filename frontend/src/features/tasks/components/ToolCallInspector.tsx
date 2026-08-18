import React, { useState } from 'react'
import { Terminal, Database, Layers, Globe, ShieldCheck, ChevronDown, ChevronUp, Cpu } from 'lucide-react'
import type { ToolCall } from '../../../shared/types/workspace'

interface ToolCallInspectorProps {
  toolCalls?: ToolCall[]
}

export const ToolCallInspector: React.FC<ToolCallInspectorProps> = ({ toolCalls }) => {
  const [expandedId, setExpandedId] = useState<string | null>(
    toolCalls && toolCalls.length > 0 ? toolCalls[0].id : null
  )

  if (!toolCalls || toolCalls.length === 0) {
    return (
      <div className="p-4 bg-canvas-soft border border-hairline rounded-lg text-center text-xs text-muted">
        No active tool invocations recorded for this stage.
      </div>
    )
  }

  const getToolIcon = (cat: ToolCall['category']) => {
    switch (cat) {
      case 'github':
        return <Terminal size={14} className="text-ink" />
      case 'mcp':
        return <Database size={14} className="text-timeline-grep" />
      case 'notion':
        return <Layers size={14} className="text-timeline-thinking" />
      case 'openapi':
        return <Globe size={14} className="text-timeline-read" />
      case 'ast':
        return <ShieldCheck size={14} className="text-semantic-success" />
      default:
        return <Cpu size={14} className="text-primary" />
    }
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between text-xs font-mono uppercase tracking-caption text-muted">
        <span>Tool Invocations & Payload Traces</span>
        <span>{toolCalls.length} Executed</span>
      </div>

      <div className="space-y-2">
        {toolCalls.map((tc) => {
          const isExpanded = expandedId === tc.id

          return (
            <div
              key={tc.id}
              className="bg-surface-card border border-hairline rounded-lg overflow-hidden transition-all shadow-2xs"
            >
              {/* Header */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : tc.id)}
                className="w-full px-3.5 py-2.5 bg-canvas-soft flex items-center justify-between gap-3 text-left hover:bg-canvas transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {getToolIcon(tc.category)}
                  <div className="truncate">
                    <span className="font-mono font-semibold text-xs text-ink">
                      {tc.toolName}
                    </span>
                    <span className="text-[11px] text-muted ml-2 truncate">
                      {tc.description}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 text-xs font-mono">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                      tc.status === 'success'
                        ? 'bg-semantic-success/15 text-semantic-success'
                        : tc.status === 'running'
                        ? 'bg-primary/15 text-primary animate-pulse'
                        : 'bg-semantic-error/15 text-semantic-error'
                    }`}
                  >
                    {tc.status}
                  </span>
                  <span className="text-muted text-[11px]">{tc.durationMs}ms</span>
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              </button>

              {/* Collapsible JSON Body */}
              {isExpanded && (
                <div className="p-3 bg-ink text-canvas font-mono text-[11px] space-y-2.5 border-t border-hairline-strong">
                  <div>
                    <div className="text-muted-soft text-[10px] uppercase mb-1">
                      // Input Parameters
                    </div>
                    <pre className="p-2 rounded bg-black/40 text-timeline-grep overflow-x-auto">
                      {JSON.stringify(tc.input, null, 2)}
                    </pre>
                  </div>

                  {tc.output && (
                    <div>
                      <div className="text-muted-soft text-[10px] uppercase mb-1">
                        // Output / Result Grounding
                      </div>
                      <pre className="p-2 rounded bg-black/40 text-timeline-read overflow-x-auto max-h-40">
                        {JSON.stringify(tc.output, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
