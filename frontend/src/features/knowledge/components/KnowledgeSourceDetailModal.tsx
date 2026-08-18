import React from 'react'
import {
  X,
  CheckCircle2,
  Terminal,
  Layers,
  Globe,
  Database,
  FileText,
  BookOpen,
  RefreshCw,
  Folder,
  Layers3,
  Cpu,
  Check,
  Plus,
  Unlink,
} from 'lucide-react'
import type { KnowledgeSource } from '@/shared/types/workspace'

interface KnowledgeSourceDetailModalProps {
  source: KnowledgeSource | null
  onClose: () => void
  onSync: (id: string) => void
  onToggleConnect?: (id: string) => void
}

export const KnowledgeSourceDetailModal: React.FC<KnowledgeSourceDetailModalProps> = ({
  source,
  onClose,
  onSync,
  onToggleConnect,
}) => {
  if (!source) return null

  const getSourceIcon = (type: KnowledgeSource['type']) => {
    switch (type) {
      case 'obsidian_vault':
        return (
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-[#7c3aed]/10 border border-[#7c3aed]/20 flex items-center justify-center text-[#7c3aed] shadow-2xs shrink-0">
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        )
      case 'web_search':
        return (
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-[#3b82f6]/10 border border-[#3b82f6]/20 flex items-center justify-center text-[#3b82f6] shadow-2xs shrink-0">
            <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        )
      case 'github_repo':
        return (
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-ink/10 border border-hairline flex items-center justify-center text-ink shadow-2xs shrink-0">
            <Terminal className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        )
      case 'notion_workspace':
        return (
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-canvas border border-hairline flex items-center justify-center text-ink shadow-2xs shrink-0">
            <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        )
      case 'openapi_spec':
        return (
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-[#06b6d4]/10 border border-[#06b6d4]/20 flex items-center justify-center text-[#06b6d4] shadow-2xs shrink-0">
            <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        )
      case 'database_schema':
        return (
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-semantic-success/10 border border-semantic-success/20 flex items-center justify-center text-semantic-success shadow-2xs shrink-0">
            <Database className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        )
      default:
        return (
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-2xs shrink-0">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        )
    }
  }

  const isSynced = source.status === 'synced'
  const isSyncing = source.status === 'syncing'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-ink/40 backdrop-blur-xs">
      <div className="bg-surface-card border border-hairline rounded-xl sm:rounded-2xl max-w-2xl w-full p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto overscroll-contain animate-in fade-in zoom-in-95 duration-150">
        {/* Header with Top-Right Action Controls */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            {getSourceIcon(source.type)}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <h2 className="text-sm sm:text-base md:text-lg font-semibold text-ink leading-snug truncate">
                  {source.name}
                </h2>
                <CheckCircle2
                  size={15}
                  className="text-semantic-success/80 shrink-0 fill-semantic-success/10"
                />
              </div>
              <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-[10px] sm:text-xs font-mono text-muted mt-0.5">
                <span className="capitalize">{source.type.replace('_', ' ')}</span>
                <span>·</span>
                <span
                  className={`font-semibold flex items-center gap-1 ${
                    isSyncing
                      ? 'text-primary'
                      : isSynced
                      ? 'text-semantic-success'
                      : 'text-muted'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSyncing
                        ? 'bg-primary animate-ping'
                        : isSynced
                        ? 'bg-semantic-success'
                        : 'bg-muted'
                    }`}
                  />
                  {isSyncing
                    ? 'Indexing...'
                    : isSynced
                    ? 'Vector Synced'
                    : 'Disconnected'}
                </span>
                <span className="hidden xs:inline sm:inline">·</span>
                <span className="hidden xs:inline sm:inline">{source.lastSynced}</span>
              </div>
            </div>
          </div>

          {/* Top-Right Lifecycle Action Controls (Connect / Disconnect + Close) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {isSynced ? (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] sm:text-[11px] font-mono text-semantic-success font-semibold px-2 py-0.5 sm:py-1 rounded-lg bg-semantic-success/10 border border-semantic-success/20 hidden md:flex items-center gap-1">
                  <CheckCircle2 size={12} />
                  <span>Synced</span>
                </span>
                {onToggleConnect && (
                  <button
                    type="button"
                    onClick={() => onToggleConnect(source.id)}
                    className="flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold text-semantic-error hover:bg-semantic-error/10 border border-semantic-error/30 transition-colors cursor-pointer"
                    title="Disconnect knowledge source"
                  >
                    <Unlink size={13} />
                    <span className="hidden xs:inline sm:inline">Disconnect</span>
                  </button>
                )}
              </div>
            ) : (
              onToggleConnect && (
                <button
                  type="button"
                  onClick={() => onToggleConnect(source.id)}
                  className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1 sm:py-1.5 bg-primary hover:bg-primary/90 text-canvas text-[11px] sm:text-xs font-semibold rounded-lg sm:rounded-xl shadow-xs transition-colors cursor-pointer"
                  title="Connect & Index Knowledge Source"
                >
                  <Plus size={14} />
                  <span>Connect</span>
                </button>
              )
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-canvas-soft text-muted hover:text-ink cursor-pointer transition-colors"
              title="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Description */}
        <div className="p-3.5 bg-canvas-soft rounded-xl border border-hairline text-xs text-body leading-relaxed">
          {source.description}
        </div>

        {/* Telemetry Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
          <div className="p-3 rounded-xl bg-canvas border border-hairline space-y-1">
            <div className="text-muted text-[10px] uppercase tracking-caption flex items-center gap-1">
              <Folder size={11} className="text-primary" />
              <span>Source Files</span>
            </div>
            <div className="font-semibold text-ink">
              {source.filesCount} Documents
            </div>
          </div>

          <div className="p-3 rounded-xl bg-canvas border border-hairline space-y-1">
            <div className="text-muted text-[10px] uppercase tracking-caption flex items-center gap-1">
              <Layers3 size={11} className="text-[#8c52ff]" />
              <span>Vector Chunks</span>
            </div>
            <div className="font-semibold text-[#8c52ff]">
              {source.chunksCount} Embeddings
            </div>
          </div>

          <div className="p-3 rounded-xl bg-canvas border border-hairline space-y-1">
            <div className="text-muted text-[10px] uppercase tracking-caption flex items-center gap-1">
              <Cpu size={11} className="text-semantic-success" />
              <span>Grounding Dimension</span>
            </div>
            <div className="font-semibold text-semantic-success">
              1536-dim Vector
            </div>
          </div>
        </div>

        {/* Storage Location & Path */}
        <div className="p-3.5 bg-canvas rounded-xl border border-hairline space-y-1.5 text-xs font-mono">
          <div className="text-[10px] uppercase tracking-caption text-muted flex items-center justify-between">
            <span>Root Indexing URI</span>
            <span className="text-primary font-semibold">Live Watcher Enabled</span>
          </div>
          <div className="text-ink font-semibold break-all bg-surface-strong px-2.5 py-1.5 rounded-lg border border-hairline">
            {source.location}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-hairline flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onSync(source.id)}
            disabled={isSyncing || !isSynced}
            className="flex items-center gap-1.5 px-4 py-2 bg-canvas-soft hover:bg-canvas text-xs font-semibold text-ink border border-hairline rounded-xl transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
          >
            <RefreshCw
              size={14}
              className={isSyncing ? 'animate-spin text-primary' : 'text-semantic-success'}
            />
            <span>{isSyncing ? 'Re-indexing Chunks...' : 'Trigger Re-index'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-primary hover:bg-primary/90 text-xs font-semibold text-canvas rounded-xl shadow-xs cursor-pointer transition-colors flex items-center gap-1.5"
          >
            <Check size={14} />
            <span>Done</span>
          </button>
        </div>
      </div>
    </div>
  )
}
