import React from 'react'
import { Sparkles, Plus } from 'lucide-react'

interface KnowledgeHeaderProps {
  onAddSource: () => void
}

export const KnowledgeHeader: React.FC<KnowledgeHeaderProps> = ({ onAddSource }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-card border border-hairline p-5 sm:p-6 rounded-xl shadow-xs">
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-caption text-primary mb-1">
          <Sparkles size={13} />
          <span>Multi-Source Context Ingestion</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">
          Knowledge Grounding Engine
        </h1>
        <p className="text-xs sm:text-sm text-body mt-1">
          Connect code repositories, Notion spaces, and OpenAPI specs to give agents deep project grounding with zero hallucination.
        </p>
      </div>

      <button
        onClick={onAddSource}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary hover:bg-primary-active text-on-primary text-xs font-semibold transition-colors shadow-xs cursor-pointer shrink-0"
      >
        <Plus size={15} />
        <span>+ Connect Knowledge Source</span>
      </button>
    </div>
  )
}
