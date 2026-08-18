import React from 'react'
import { Sparkles, Download } from 'lucide-react'

interface ActivityHeaderProps {
  onExport: () => void
}

export const ActivityHeader: React.FC<ActivityHeaderProps> = ({ onExport }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-card border border-hairline p-5 sm:p-6 rounded-xl shadow-xs">
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-caption text-primary mb-1">
          <Sparkles size={13} />
          <span>Immutable Audit Trail & Observability</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">
          Activity & Execution Logs
        </h1>
        <p className="text-xs sm:text-sm text-body mt-1">
          Review detailed telemetry, tool invocation timestamps, human approval decisions, and token consumption history.
        </p>
      </div>

      <button
        onClick={onExport}
        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-canvas-soft hover:bg-canvas text-ink border border-hairline hover:border-hairline-strong text-xs font-mono transition-colors cursor-pointer shrink-0"
      >
        <Download size={14} />
        <span>Export Audit Log</span>
      </button>
    </div>
  )
}
