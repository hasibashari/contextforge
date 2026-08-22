import React, { useState } from 'react'
import {
  BookOpen,
  Globe,
  Calendar,
  Copy,
  Download,
  FileText,
  Edit3,
  Eye,
  ChevronRight,
  CheckCircle2,
  Image as ImageIcon,
  Trash2,
} from 'lucide-react'
import { MarkdownRenderer } from '@/shared/components'
import type { Artifact, ToastType } from '@/shared/types/workspace'
import { obsidianBridgeService } from '@/shared/services/obsidianBridge.service'
import { browserStorageBridge } from '@/shared/services/browserStorageBridge.service'

interface ArtifactViewerAndEditorProps {
  artifact: Artifact
  onSave: (content: string) => void
  onDelete?: (id: string) => void
  showToast: (msg: string, type?: ToastType) => void
  allArtifacts: Artifact[]
  onSelectArtifact: (art: Artifact) => void
}

export const ArtifactViewerAndEditor: React.FC<ArtifactViewerAndEditorProps> = ({
  artifact,
  onSave,
  onDelete,
  showToast,
  allArtifacts,
  onSelectArtifact,
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(artifact.content)

  const handleSave = async () => {
    onSave(editContent)
    setIsEditing(false)

    // Direct Disk Write-Back to laptop folder (Scenario B)
    const pathName = artifact.locationPath || `${artifact.title}.md`
    const writeRes = await browserStorageBridge.writeDocument(
      pathName,
      pathName,
      editContent
    )
    if (writeRes.success) {
      showToast(
        `✅ Saved & written to laptop disk: /${writeRes.folderName}/${writeRes.relativePath}`,
        'success'
      )
    } else {
      showToast('Document saved to workspace', 'success')
    }
  }

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
    <div className="space-y-3">
      {/* Artifact Metadata Card */}
      <div className="p-3.5 bg-surface-card rounded-xl border border-hairline shadow-2xs space-y-2">
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

        {/* Actions Header Bar */}
        <div className="pt-2 border-t border-hairline flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium border transition-colors cursor-pointer ${
                isEditing
                  ? 'bg-primary text-on-primary border-primary'
                  : 'bg-canvas-soft border-hairline text-ink hover:bg-canvas'
              }`}
            >
              {isEditing ? <Eye size={12} /> : <Edit3 size={12} />}
              <span>{isEditing ? 'Preview' : 'Edit'}</span>
            </button>

            {isEditing && (
              <button
                onClick={handleSave}
                className="px-2.5 py-1 rounded text-[11px] font-medium bg-semantic-success text-white hover:bg-semantic-success/90 transition-colors cursor-pointer"
              >
                Save
              </button>
            )}
          </div>

          <div className="flex items-center gap-1">
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
              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#7c3aed]/10 hover:bg-[#7c3aed]/20 border border-[#7c3aed]/30 text-[#7c3aed] text-[11px] font-semibold transition-colors cursor-pointer"
              title="Open or create directly in Obsidian Desktop"
            >
              <BookOpen size={12} />
              <span className="hidden sm:inline">Open in Obsidian</span>
            </button>

            {/* Save directly to Paired Vault Handle if active */}
            {obsidianBridgeService.getPairedDirectoryHandle() && (
              <button
                onClick={async () => {
                  const pathName = artifact.locationPath || `Work/Notes/${artifact.title}.md`
                  const ok = await obsidianBridgeService.writeNoteToLocalVault(pathName, artifact.content)
                  if (ok) {
                    showToast('Note written directly to paired local Obsidian Vault disk!', 'success')
                  } else {
                    showToast('Failed to write to local vault. Try re-pairing folder.', 'error')
                  }
                }}
                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-semantic-success/10 hover:bg-semantic-success/20 border border-semantic-success/30 text-semantic-success text-[11px] font-semibold transition-colors cursor-pointer"
                title="Write directly to paired local folder on disk"
              >
                <CheckCircle2 size={12} />
                <span>Save to Vault</span>
              </button>
            )}

            <button
              onClick={handleCopy}
              className="p-1.5 rounded bg-canvas-soft border border-hairline hover:border-hairline-strong text-muted hover:text-ink transition-colors cursor-pointer"
              title="Copy Markdown"
            >
              <Copy size={13} />
            </button>
            <button
              onClick={handleDownload}
              className="p-1.5 rounded bg-canvas-soft border border-hairline hover:border-hairline-strong text-muted hover:text-ink transition-colors cursor-pointer"
              title="Download File (.md)"
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
                className="p-1.5 rounded bg-canvas-soft border border-hairline hover:border-semantic-error text-muted hover:text-semantic-error hover:bg-semantic-error/10 transition-colors cursor-pointer"
                title="Delete File from Workspace"
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

      {/* Content Viewer / Editor */}
      <div className="bg-surface-card rounded-xl border border-hairline p-4 shadow-2xs">
        {isEditing ? (
          <textarea
            rows={14}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full font-mono text-[11px] bg-canvas p-3 rounded-lg border border-hairline text-ink focus:outline-none focus:border-primary leading-relaxed resize-y"
          />
        ) : (
          <MarkdownRenderer content={artifact.content} />
        )}
      </div>

      {/* Other Available Artifacts */}
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
