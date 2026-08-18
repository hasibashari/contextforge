import React from 'react'
import { Sparkles, Download } from 'lucide-react'

interface ActivityHeaderProps {
  onExport: () => void
}

export const ActivityHeader: React.FC<ActivityHeaderProps> = ({ onExport }) => {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface-card border border-hairline p-5 sm:p-6 rounded-xl sm:rounded-2xl shadow-xs">
      <div className="min-w-0 flex-1">
        <div className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-caption text-primary mb-1">
          <Sparkles size={13} />
          <span>Immutable Audit Trail & Observability</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">
          Activity & Execution Logs
        </h1>
        <p className="text-xs sm:text-sm text-body mt-1 max-w-2xl leading-relaxed">
          Review detailed telemetry, tool invocation timestamps, human approval decisions, and token consumption history.
        </p>
      </div>

      <div className="flex items-center gap-2 font-mono text-xs shrink-0 self-start lg:self-center">
        <button
          onClick={onExport}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-canvas-soft hover:bg-canvas text-ink border border-hairline hover:border-hairline-strong text-xs font-mono transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
        >
          <Download size={14} />
          <span>Export Audit Log</span>
        </button>
      </div>
    </div>
  )
}
