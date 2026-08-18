import {
  Database,
  Sparkles,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useWorkspace } from '../../../shared/mock'

export default function DashboardContextAside() {
  const { knowledgeSources, tasks, integrations } = useWorkspace()

  const pendingTask = tasks.find((t) => t.status === 'waiting_approval') || tasks[0]
  const mcpIntegration = integrations.find((i) => i.category === 'mcp_server')

  return (
    <div className="p-4 sm:p-5 space-y-6 text-xs text-ink font-sans">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-hairline">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-primary" />
          <span className="font-semibold text-ink">Context Inspector</span>
        </div>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-strong text-muted">
          Active Stream
        </span>
      </div>

      {/* Active Ingested Memory */}
      <div className="space-y-2.5">
        <div className="text-[10px] font-mono uppercase tracking-caption text-muted flex items-center justify-between">
          <span>Active Grounding Scope</span>
          <span className="text-primary font-bold">{knowledgeSources.length} Sources</span>
        </div>

        <div className="space-y-2">
          {knowledgeSources.slice(0, 3).map((src) => (
            <div
              key={src.id}
              className="p-2.5 rounded-lg bg-surface-card border border-hairline space-y-1 shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-medium text-ink truncate">
                  <Database size={13} className="text-primary shrink-0" />
                  <span className="truncate">{src.name}</span>
                </div>
                <span className="text-[10px] font-mono text-semantic-success shrink-0">
                  ✓ {src.filesCount} files
                </span>
              </div>
              <p className="text-[11px] text-muted leading-tight line-clamp-1">
                {src.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Safety & AST Verification Telemetry */}
      <div className="space-y-2.5">
        <div className="text-[10px] font-mono uppercase tracking-caption text-muted">
          Sandboxed AST Telemetry
        </div>

        <div className="p-3 rounded-lg bg-canvas border border-hairline space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted">Regression Test Pass:</span>
            <span className="font-mono font-semibold text-semantic-success">100% Passed</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted">CVE Vulnerabilities:</span>
            <span className="font-mono font-semibold text-semantic-success">0 Detected</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted">HITL Policy:</span>
            <span className="font-mono font-semibold text-primary">Strict Enforced</span>
          </div>
        </div>
      </div>

      {/* Quick Action Plan Inspector */}
      {pendingTask && (
        <div className="space-y-2.5">
          <div className="text-[10px] font-mono uppercase tracking-caption text-muted flex items-center justify-between">
            <span>Action Plan Inspector</span>
            <span className="text-xs font-mono font-bold text-primary">{pendingTask.id}</span>
          </div>

          <div className="p-3 rounded-lg bg-surface-card border border-hairline-strong space-y-2 shadow-xs">
            <div className="font-semibold text-ink leading-snug line-clamp-1">
              {pendingTask.title}
            </div>
            <p className="text-[11px] text-body line-clamp-2 leading-relaxed">
              {pendingTask.objective}
            </p>

            <div className="pt-2 border-t border-hairline">
              <Link
                to={`/tasks/${pendingTask.id}`}
                className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-1"
              >
                <span>Inspect in Task Detail &rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Connected MCP Health */}
      {mcpIntegration && (
        <div className="space-y-2 pt-2 border-t border-hairline">
          <div className="text-[10px] font-mono uppercase tracking-caption text-muted">
            Active MCP Tool Gateway
          </div>
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-card border border-hairline">
            <div className="flex items-center gap-2">
              <Database size={13} className="text-timeline-grep" />
              <span className="text-xs font-medium text-ink">{mcpIntegration.name}</span>
            </div>
            <span className="text-[10px] font-mono text-semantic-success font-semibold">
              {mcpIntegration.latencyMs}ms
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
