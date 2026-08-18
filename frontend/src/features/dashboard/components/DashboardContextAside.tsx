import {
  Terminal,
  Layers,
  Database,
  Globe,
  Sparkles,
} from 'lucide-react'

export default function DashboardContextAside() {
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
          <span className="text-primary font-bold">51 Ingested</span>
        </div>

        <div className="space-y-2">
          <div className="p-2.5 rounded-lg bg-surface-card border border-hairline space-y-1 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-medium text-ink">
                <Terminal size={13} className="text-ink shrink-0" />
                <span className="truncate">acme/auth-service</span>
              </div>
              <span className="text-[10px] font-mono text-semantic-success">✓ 14 files</span>
            </div>
            <p className="text-[11px] text-muted leading-tight">
              Grep index parsed: JWT extractor & middleware routes
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-surface-card border border-hairline space-y-1 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-medium text-ink">
                <Layers size={13} className="text-timeline-thinking shrink-0" />
                <span className="truncate">Notion Security RFC</span>
              </div>
              <span className="text-[10px] font-mono text-semantic-success">✓ RFC #204</span>
            </div>
            <p className="text-[11px] text-muted leading-tight">
              Scoped token specification & key rotation rules
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-surface-card border border-hairline space-y-1 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-medium text-ink">
                <Globe size={13} className="text-timeline-read shrink-0" />
                <span className="truncate">Stripe API Docs</span>
              </div>
              <span className="text-[10px] font-mono text-semantic-success">✓ v2024-06</span>
            </div>
            <p className="text-[11px] text-muted leading-tight">
              Webhook event schema definitions & refund types
            </p>
          </div>
        </div>
      </div>

      {/* Safety & AST Verification Telemetry */}
      <div className="space-y-2.5">
        <div className="text-[10px] font-mono uppercase tracking-caption text-muted">
          Sandboxed AST Telemetry
        </div>

        <div className="p-3 rounded-lg bg-canvas border border-hairline space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted">Unit Regression Suite:</span>
            <span className="font-mono font-semibold text-semantic-success">14/14 Passed</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted">Security Scanner (CVEs):</span>
            <span className="font-mono font-semibold text-semantic-success">0 Vulnerabilities</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted">Approval Gate Status:</span>
            <span className="font-mono font-semibold text-primary">Awaiting Sign-off</span>
          </div>
        </div>
      </div>

      {/* Quick Action Plan Inspector */}
      <div className="space-y-2.5">
        <div className="text-[10px] font-mono uppercase tracking-caption text-muted flex items-center justify-between">
          <span>Active Plan Inspector</span>
          <span className="text-xs font-mono font-bold text-primary">PLAN-104</span>
        </div>

        <div className="p-3 rounded-lg bg-surface-card border border-hairline-strong space-y-2.5 shadow-xs">
          <div className="font-semibold text-ink leading-snug">
            OAuth2 Scoped Tokens Migration
          </div>
          <div className="text-[11px] text-body leading-relaxed">
            3 files modified (+104 / -18). Verified in local AST runner.
          </div>

          <div className="pt-2 border-t border-hairline space-y-1 font-mono text-[10px] text-muted">
            <div className="flex items-center justify-between">
              <span>src/middleware/auth.ts</span>
              <span className="text-semantic-success">+34 / -12</span>
            </div>
            <div className="flex items-center justify-between">
              <span>src/config/jwt.ts</span>
              <span className="text-semantic-success">+18 / -6</span>
            </div>
          </div>
        </div>
      </div>

      {/* Connected MCP Health */}
      <div className="space-y-2 pt-2 border-t border-hairline">
        <div className="text-[10px] font-mono uppercase tracking-caption text-muted">
          Active MCP Tool Server
        </div>
        <div className="flex items-center justify-between p-2 rounded bg-surface-card border border-hairline">
          <div className="flex items-center gap-2">
            <Database size={13} className="text-timeline-grep" />
            <span className="text-xs font-medium text-ink">Postgres MCP (Read-Only)</span>
          </div>
          <span className="text-[10px] font-mono text-semantic-success">12ms</span>
        </div>
      </div>
    </div>
  )
}
