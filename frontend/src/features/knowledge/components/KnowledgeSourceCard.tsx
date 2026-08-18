import React from 'react'
import { Terminal, Layers, Globe, Database, FileText, RefreshCw, ExternalLink } from 'lucide-react'
import type { KnowledgeSource } from '../../../shared/types/workspace'

interface KnowledgeSourceCardProps {
  source: KnowledgeSource
  onSync: () => void
}

export const KnowledgeSourceCard: React.FC<KnowledgeSourceCardProps> = ({
  source,
  onSync,
}) => {
  const isSyncing = source.status === 'syncing'

  const getSourceIcon = (type: KnowledgeSource['type']) => {
    switch (type) {
      case 'github_repo':
        return <Terminal size={18} className="text-ink" />
      case 'notion_workspace':
        return <Layers size={18} className="text-timeline-thinking" />
      case 'openapi_spec':
        return <Globe size={18} className="text-timeline-read" />
      case 'database_schema':
        return <Database size={18} className="text-timeline-grep" />
      default:
        return <FileText size={18} className="text-primary" />
    }
  }

  return (
    <div className="bg-surface-card border border-hairline hover:border-hairline-strong rounded-xl p-5 transition-colors shadow-2xs space-y-4 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-canvas-soft border border-hairline flex items-center justify-center">
              {getSourceIcon(source.type)}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ink leading-tight">
                {source.name}
              </h3>
              <span className="text-[10px] font-mono uppercase tracking-caption text-muted">
                {source.type.replace('_', ' ')}
              </span>
            </div>
          </div>

          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold inline-flex items-center gap-1 ${
              isSyncing
                ? 'bg-primary/10 text-primary animate-pulse'
                : 'bg-semantic-success/15 text-semantic-success'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {isSyncing ? 'Syncing...' : 'Synced'}
          </span>
        </div>

        <p className="text-xs text-body leading-relaxed mb-3">
          {source.description}
        </p>

        <div className="p-2.5 rounded-lg bg-canvas-soft border border-hairline font-mono text-[11px] text-muted truncate">
          {source.location}
        </div>
      </div>

      {/* Stats & Actions */}
      <div className="pt-3 border-t border-hairline space-y-3">
        <div className="flex items-center justify-between text-xs font-mono text-muted">
          <span>Files: <strong className="text-ink">{source.filesCount}</strong></span>
          <span>Chunks: <strong className="text-ink">{source.chunksCount}</strong></span>
          <span>Updated: <strong className="text-ink">{source.lastSynced}</strong></span>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            onClick={onSync}
            className="inline-flex items-center gap-1.5 text-xs text-body hover:text-ink font-medium transition-colors cursor-pointer"
          >
            <RefreshCw size={13} className={isSyncing ? 'animate-spin text-primary' : ''} />
            <span>{isSyncing ? 'Indexing in progress...' : 'Trigger Re-index'}</span>
          </button>

          <button className="text-xs text-primary hover:underline font-mono inline-flex items-center gap-1 cursor-pointer">
            <span>Inspect AST Chunks</span>
            <ExternalLink size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}
