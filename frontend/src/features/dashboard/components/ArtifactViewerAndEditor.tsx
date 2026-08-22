import React from 'react'
import {
  BookOpen,
  Globe,
  Calendar,
  Copy,
  Download,
  FileText,
  ChevronRight,
  Image as ImageIcon,
  Trash2,
} from 'lucide-react'
import { MarkdownRenderer } from '@/shared/components'
import type { Artifact, ToastType } from '@/shared/types/workspace'
import { obsidianBridgeService } from '@/shared/services/obsidianBridge.service'

interface ArtifactViewerProps {
  artifact: Artifact
  onDelete?: (id: string) => void
  showToast: (msg: string, type?: ToastType) => void
  allArtifacts: Artifact[]
  onSelectArtifact: (art: Artifact) => void
}

export const ArtifactViewerAndEditor: React.FC<ArtifactViewerProps> = ({
  artifact,
  onDelete,
  showToast,
  allArtifacts,
  onSelectArtifact,
}) => {
  const handleCopy = () => {
    navigator.clipboard?.writeText(artifact.content)
    showToast('Document content copied to clipboard', 'success')
  }

  const handleDownload = () => {
    const blob = new Blob([artifact.content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${artifact.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`
    a.click()
    URL.revokeObjectURL(url)
    showToast('Markdown file downloaded successfully', 'success')
  }

  const getServiceBadge = (origin?: string) => {
    switch (origin) {
      case 'obsidian':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-primary/10 text-primary font-semibold">
            <BookOpen size={10} />
            <span>Obsidian Vault</span>
          </span>
        )
      case 'web':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-timeline-read/20 text-[#3b6ea5] font-semibold">
            <Globe size={10} />
            <span>Live Web Grounding</span>
          </span>
        )
      case 'calendar':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-semantic-success/15 text-semantic-success font-semibold">
            <Calendar size={10} />
            <span>Google Calendar</span>
          </span>
        )
      case 'imagen':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-[#ff5e00]/15 text-[#ff5e00] font-semibold">
            <ImageIcon size={10} />
            <span>Imagen 3 / Flux</span>
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-surface-strong text-muted">
            <FileText size={10} />
            <span>Document</span>
          </span>
        )
    }
  }

  return (
    <div className="space-y-3 animate-in fade-in duration-150">
      {/* Artifact Metadata & Action Card */}
      <div className="p-3.5 bg-surface-card rounded-xl border border-hairline shadow-2xs space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          {getServiceBadge(artifact.serviceOrigin)}
          <span className="text-[10px] font-mono text-muted">
            {artifact.updatedAt || artifact.createdAt}
          </span>
        </div>

        <h3 className="font-semibold text-ink text-xs sm:text-sm leading-snug">
          {artifact.title}
        </h3>

        {artifact.locationPath && (
          <div className="text-[11px] font-mono text-muted flex items-center gap-1 truncate">
            <span className="text-body font-medium">Path:</span>
            <span className="text-primary truncate">{artifact.locationPath}</span>
          </div>
        )}

        {/* Action Header Bar */}
        <div className="pt-2.5 border-t border-hairline flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            {/* Open in Obsidian App Protocol */}
            <button
              onClick={() => {
                obsidianBridgeService.openInObsidianApp(
                  '',
                  artifact.locationPath || artifact.title,
                  artifact.content,
                )
                showToast('🚀 Opening note in Obsidian Desktop...', 'info')
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#7c3aed]/10 hover:bg-[#7c3aed]/20 active:scale-[0.98] border border-[#7c3aed]/30 text-[#7c3aed] text-xs font-medium transition-all cursor-pointer truncate shadow-2xs"
              title="Open and edit directly in Obsidian Desktop"
            >
              <BookOpen size={13} className="shrink-0" />
              <span className="truncate">Open in Obsidian</span>
            </button>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleCopy}
              className="p-1.5 sm:p-2 rounded-lg bg-canvas-soft border border-hairline hover:border-hairline-strong text-muted hover:text-ink active:scale-95 transition-all cursor-pointer"
              title="Copy Markdown content"
              aria-label="Copy Markdown"
            >
              <Copy size={13} />
            </button>
            <button
              onClick={handleDownload}
              className="p-1.5 sm:p-2 rounded-lg bg-canvas-soft border border-hairline hover:border-hairline-strong text-muted hover:text-ink active:scale-95 transition-all cursor-pointer"
              title="Download .md file"
              aria-label="Download .md file"
            >
              <Download size={13} />
            </button>
            {onDelete && (
              <button
                onClick={() => {
                  if (
                    window.confirm(
                      `Permanently delete "${artifact.title}" from your workspace?`,
                    )
                  ) {
                    onDelete(artifact.id)
                  }
                }}
                className="p-1.5 sm:p-2 rounded-lg bg-canvas-soft border border-hairline hover:border-semantic-error text-muted hover:text-semantic-error hover:bg-semantic-error/10 active:scale-95 transition-all cursor-pointer"
                title="Delete Document"
                aria-label="Delete Document"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Image Preview Banner (If image artifact) */}
      {artifact.imageUrl && (
        <div className="bg-surface-card rounded-xl border border-hairline overflow-hidden p-2 shadow-2xs space-y-2">
          <img
            src={artifact.imageUrl}
            alt={artifact.title}
            className="w-full rounded-lg object-cover"
          />
        </div>
      )}

      {/* Content Viewer (Pure Markdown & Mermaid Renderer) */}
      <div className="bg-surface-card rounded-xl border border-hairline p-4 shadow-2xs leading-relaxed">
        <MarkdownRenderer content={artifact.content} />
      </div>

      {/* Document Library Directory */}
      <div className="space-y-2 pt-2">
        <div className="text-[10px] font-mono uppercase tracking-caption text-muted flex items-center justify-between">
          <span>Workspace Document Library:</span>
          <span>{allArtifacts.length} files</span>
        </div>
        <div className="space-y-1.5">
          {allArtifacts.map((art) => (
            <button
              key={art.id}
              onClick={() => onSelectArtifact(art)}
              className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-center justify-between gap-2 cursor-pointer ${
                artifact.id === art.id
                  ? 'bg-surface-card border-primary/40 shadow-2xs font-medium text-ink'
                  : 'bg-canvas-soft border-hairline text-muted hover:text-ink hover:bg-surface-card'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <BookOpen size={13} className="text-primary shrink-0" />
                <span className="truncate text-xs">{art.title}</span>
              </div>
              <ChevronRight size={13} className="shrink-0 text-muted" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
