import React from 'react'
import { Sparkles } from 'lucide-react'

export const IntegrationsHeader: React.FC = () => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-card border border-hairline p-5 sm:p-6 rounded-xl shadow-xs">
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-caption text-primary mb-1">
          <Sparkles size={13} />
          <span>Model Context Protocol & External Tooling</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">
          Integrations & MCP Gateway
        </h1>
        <p className="text-xs sm:text-sm text-body mt-1">
          Connect air-gapped databases, git providers, and custom MCP context servers with fine-grained read-only permissions.
        </p>
      </div>

      <div className="flex items-center gap-2 font-mono text-xs">
        <div className="px-3 py-1.5 rounded-lg bg-canvas-soft border border-hairline text-ink">
          <span className="w-2 h-2 rounded-full bg-semantic-success inline-block mr-1.5" />
          MCP Protocol Active
        </div>
      </div>
    </div>
  )
}
