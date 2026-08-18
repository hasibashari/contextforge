import React from 'react'
import { Cpu, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react'
import type { Integration } from '../../../shared/types/workspace'

interface IntegrationCardProps {
  integration: Integration
  isExpanded: boolean
  isTesting: boolean
  onToggleExpand: () => void
  onTest: () => void
}

export const IntegrationCard: React.FC<IntegrationCardProps> = ({
  integration,
  isExpanded,
  isTesting,
  onToggleExpand,
  onTest,
}) => {
  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'mcp_server':
        return 'bg-primary/10 text-primary border-primary/20'
      case 'git_provider':
        return 'bg-ink text-canvas'
      case 'notification':
        return 'bg-semantic-success/15 text-semantic-success'
      default:
        return 'bg-surface-strong text-body'
    }
  }

  return (
    <div className="bg-surface-card border border-hairline hover:border-hairline-strong rounded-xl overflow-hidden shadow-2xs transition-colors">
      {/* Main Card Header */}
      <div className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-canvas-soft border border-hairline flex items-center justify-center text-primary shrink-0">
            <Cpu size={20} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="text-sm sm:text-base font-semibold text-ink">
                {integration.name}
              </h3>
              <span
                className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${getCategoryBadge(
                  integration.category
                )}`}
              >
                {integration.category.replace('_', ' ')}
              </span>
              <span className="text-[10px] font-mono text-muted">
                {integration.version}
              </span>
            </div>

            <p className="text-xs text-body leading-relaxed max-w-2xl">
              {integration.description}
            </p>

            <div className="text-[11px] font-mono text-muted mt-1.5 truncate">
              Endpoint: <strong className="text-ink">{integration.endpoint}</strong>
            </div>
          </div>
        </div>

        {/* Right Actions & Health */}
        <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
          <div className="text-right text-xs font-mono hidden sm:block">
            <div className="text-semantic-success flex items-center justify-end gap-1 font-semibold">
              <CheckCircle2 size={13} />
              <span>Connected</span>
            </div>
            <div className="text-muted text-[10px]">{integration.latencyMs}ms latency</div>
          </div>

          <button
            onClick={onTest}
            disabled={isTesting}
            className="px-3 py-1.5 rounded-lg bg-canvas-soft hover:bg-canvas text-xs font-mono text-ink border border-hairline hover:border-hairline-strong transition-colors cursor-pointer disabled:opacity-50"
          >
            {isTesting ? 'Pinging...' : 'Test Connection'}
          </button>

          <button
            onClick={onToggleExpand}
            className="p-2 rounded-lg bg-canvas-soft hover:bg-canvas text-muted hover:text-ink cursor-pointer border border-hairline"
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Collapsible Tool Definitions */}
      {isExpanded && (
        <div className="px-5 pb-5 pt-2 border-t border-hairline bg-canvas-soft/40 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono uppercase tracking-caption text-muted">
            <span>Exposed MCP Tools & Param Schemas</span>
            <span>{integration.tools.length} Tools Ready</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {integration.tools.map((t) => (
              <div
                key={t.name}
                className="p-3 bg-surface-card border border-hairline rounded-lg space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-ink">{t.name}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                      t.readOnly
                        ? 'bg-semantic-success/15 text-semantic-success'
                        : 'bg-timeline-thinking/20 text-[#26251e]'
                    }`}
                  >
                    {t.readOnly ? 'Read Only' : 'Write / Mutation'}
                  </span>
                </div>

                <p className="text-[11px] text-body">{t.description}</p>

                <div>
                  <div className="text-[10px] font-mono text-muted mb-0.5">Parameters:</div>
                  <pre className="p-1.5 rounded bg-canvas font-mono text-[10px] text-ink overflow-x-auto border border-hairline">
                    {JSON.stringify(t.parametersSchema, null, 2)}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
