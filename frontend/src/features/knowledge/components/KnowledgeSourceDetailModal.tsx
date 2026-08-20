import React, { useState, useEffect, useRef } from 'react'
import {
  CheckCircle2,
  RefreshCw,
  Folder,
  Layers3,
  Cpu,
  Check,
  Plus,
  Unlink,
  Trash2,
  Copy,
  FileCode,
  Info,
  Loader2,
  AlertTriangle,
  UploadCloud,
} from 'lucide-react'
import type { KnowledgeSource } from '@/shared/types/workspace'
import {
  knowledgeApi,
  type BackendKnowledgeChunk,
} from '@/shared/api/knowledgeApi'
import { obsidianBridgeService } from '@/shared/services/obsidianBridge.service'
import { Modal, ModalHeader, ModalFooter } from '@/shared/components/ui/Modal'
import { StatusPill } from '@/shared/components/ui/StatusPill'
import { KnowledgeIconBox } from '@/shared/components/ui/IconBox'

interface KnowledgeSourceDetailModalProps {
  source: KnowledgeSource | null
  onClose: () => void
  onSync: (id: string) => void
  onToggleConnect?: (id: string) => void
  onDelete?: (id: string) => void
  onUploadMore?: (files: File[], name: string, sourceId: string) => Promise<unknown>
}

export const KnowledgeSourceDetailModal: React.FC<
  KnowledgeSourceDetailModalProps
> = ({ source, onClose, onSync, onToggleConnect, onDelete, onUploadMore }) => {
  const [chunks, setChunks] = useState<BackendKnowledgeChunk[]>([])
  const [isLoadingChunks, setIsLoadingChunks] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const [isUploadingMore, setIsUploadingMore] = useState(false)

  const uploadMoreInputRef = useRef<HTMLInputElement>(null)

  const sourceId = source?.id
  const sourceStatus = source?.status
  const sourceLastSynced = source?.lastSynced

  useEffect(() => {
    if (!sourceId) return

    let isMounted = true
    const fetchChunks = async () => {
      setIsLoadingChunks(true)
      try {
        const data = await knowledgeApi.getSourceChunks(sourceId, 3)
        if (isMounted) {
          setChunks(data || [])
        }
      } catch {
        if (isMounted) setChunks([])
      } finally {
        if (isMounted) setIsLoadingChunks(false)
      }
    }

    void fetchChunks()

    return () => {
      isMounted = false
    }
  }, [sourceId, sourceStatus, sourceLastSynced])

  if (!source) return null

  const isSynced = source.status === 'synced'
  const isSyncing = source.status === 'syncing'

  const handleCopyUri = () => {
    void navigator.clipboard.writeText(source.location)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  const handleDelete = () => {
    if (onDelete) {
      onDelete(source.id)
      onClose()
    }
  }

  const handleUploadMoreFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && onUploadMore) {
      const selected = Array.from(e.target.files)
      setIsUploadingMore(true)
      try {
        await onUploadMore(selected, source.name, source.id)
      } finally {
        setIsUploadingMore(false)
      }
    }
  }

  const getResolvedPathNote = () => {
    if (source.subfolderScope) {
      return `Scoped to subfolder "/${source.subfolderScope}". Paired from local storage and ingested into 1536-dim vector embeddings.`
    }
    if (source.type === 'document_upload') {
      return `Physical storage in backend: "storage/uploads/${source.id}".`
    }
    if (source.type === 'obsidian_vault') {
      const parsed = obsidianBridgeService.parseObsidianUri(source.location)
      const scopeText = parsed.subfolderScope
        ? ` (Scoped to "/${parsed.subfolderScope}")`
        : ''
      return `Target Vault: "${parsed.vaultName}"${scopeText}. Mapped locally or dispatched via Obsidian protocol.`
    }
    if (source.type === 'local_folder') {
      if (
        source.location.startsWith('upload://') ||
        source.location.includes('paired')
      ) {
        return `Paired from laptop folder and ingested into 1536-dim vector embeddings.`
      }
      return `Direct server filesystem scan from "${source.location}".`
    }
    return `Vectorized into PostgreSQL using gemini-embedding-002 (1536-dim).`
  }

  const renderSubtitle = () => (
    <>
      <span className="capitalize">{source.type.replace('_', ' ')}</span>
      <span>·</span>
      <StatusPill status={source.status} />
      <span>·</span>
      <span>{source.lastSynced}</span>
    </>
  )

  const renderActions = () => (
    <div className="flex items-center gap-1.5">
      {onToggleConnect && (
        <button
          type="button"
          onClick={() => onToggleConnect(source.id)}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
            isSynced
              ? 'text-muted hover:text-ink bg-canvas-soft border-hairline hover:bg-surface-strong'
              : 'text-canvas bg-primary hover:bg-primary/90 border-transparent shadow-xs'
          }`}
          title={
            isSynced
              ? 'Mute Grounding (Temporarily pause reading this source)'
              : 'Enable Grounding (Active in Chat)'
          }
        >
          {isSynced ? <Unlink size={13} /> : <Plus size={13} />}
          <span>{isSynced ? 'Mute' : 'Connect'}</span>
        </button>
      )}

      {onDelete && !isConfirmingDelete && (
        <button
          type="button"
          onClick={() => setIsConfirmingDelete(true)}
          className="p-1.5 rounded-lg text-muted hover:text-semantic-error hover:bg-semantic-error/10 border border-transparent hover:border-semantic-error/20 transition-colors cursor-pointer"
          title="Delete Knowledge Source and Vector Chunks"
        >
          <Trash2 size={15} />
        </button>
      )}
    </div>
  )

  return (
    <Modal isOpen={Boolean(source)} onClose={onClose} size="2xl">
      <ModalHeader
        icon={<KnowledgeIconBox type={source.type} size="md" />}
        title={source.name}
        badge={
          isSynced ? (
            <CheckCircle2
              size={15}
              className="text-semantic-success/80 shrink-0 fill-semantic-success/10"
            />
          ) : undefined
        }
        subtitle={renderSubtitle()}
        onClose={onClose}
        actions={renderActions()}
      />

      <div className="space-y-4 text-xs">
        {/* Delete Confirmation Banner if triggered */}
        {isConfirmingDelete && (
          <div className="p-3 bg-semantic-error/10 border border-semantic-error/30 rounded-xl space-y-2 animate-in fade-in duration-150">
            <div className="flex items-start gap-2 text-xs text-semantic-error font-semibold">
              <AlertTriangle size={15} className="shrink-0 mt-0.5" />
              <span>
                Permanent Delete: Are you sure you want to remove &quot;{source.name}&quot;
                and purge all {source.chunksCount} 1536-dim vector embeddings?
              </span>
            </div>
            <div className="flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(false)}
                className="px-3 py-1 bg-canvas text-ink border border-hairline rounded-lg hover:bg-canvas-soft transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-3 py-1 bg-semantic-error text-white font-semibold rounded-lg hover:bg-semantic-error/90 transition-colors cursor-pointer shadow-xs"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        )}

        {/* Description */}
        <p className="text-body leading-relaxed text-xs">
          {source.description}
        </p>

        {/* Telemetry Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 font-mono">
          <div className="p-2.5 rounded-xl bg-canvas border border-hairline space-y-0.5">
            <div className="text-muted text-[10px] uppercase tracking-caption flex items-center gap-1">
              <Folder size={11} className="text-primary" />
              <span>Source Files</span>
            </div>
            <div className="font-semibold text-ink">
              {source.filesCount} Documents
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-canvas border border-hairline space-y-0.5">
            <div className="text-muted text-[10px] uppercase tracking-caption flex items-center gap-1">
              <Layers3 size={11} className="text-[#8c52ff]" />
              <span>Vector Chunks</span>
            </div>
            <div className="font-semibold text-[#8c52ff]">
              {source.chunksCount} Embeddings
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-canvas border border-hairline space-y-0.5">
            <div className="text-muted text-[10px] uppercase tracking-caption flex items-center gap-1">
              <Cpu size={11} className="text-semantic-success" />
              <span>Grounding Dimension</span>
            </div>
            <div
              className="font-semibold text-semantic-success truncate"
              title="1536-dim (gemini-embedding-002)"
            >
              1536-dim (Gemini 2)
            </div>
          </div>
        </div>

        {/* Storage Location & Path with Copy Action */}
        <div className="p-3 bg-canvas-soft rounded-xl border border-hairline space-y-1.5 font-mono">
          <div className="text-[10px] uppercase tracking-caption text-muted flex items-center justify-between">
            <span>Root Indexing URI &amp; Local Resolver</span>
            <span className="text-primary font-semibold">
              {source.type === 'document_upload'
                ? '[UPLOAD STORAGE]'
                : source.type === 'obsidian_vault'
                  ? '[LOCAL SANDBOX]'
                  : '[SERVER FILESYSTEM]'}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 bg-surface-strong px-2.5 py-1.5 rounded-lg border border-hairline">
            <span className="text-ink font-semibold break-all text-xs">
              {source.location}
            </span>
            <button
              type="button"
              onClick={handleCopyUri}
              className="p-1 rounded text-muted hover:text-ink hover:bg-canvas-soft transition-colors cursor-pointer shrink-0"
              title="Copy URI"
            >
              {isCopied ? (
                <Check size={14} className="text-semantic-success" />
              ) : (
                <Copy size={14} />
              )}
            </button>
          </div>
          <p className="text-[11px] text-muted font-sans flex items-center gap-1 pt-0.5">
            <Info size={12} className="text-primary shrink-0" />
            <span>{getResolvedPathNote()}</span>
          </p>
        </div>

        {/* Upload More Files Action */}
        {onUploadMore && (
          <div className="p-3 bg-primary/5 rounded-xl border border-primary/20 flex items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <div className="font-semibold text-ink">Add Documents to this Collection</div>
              <div className="text-[11px] text-muted">Upload more PDF, DOCX, Markdown, or code files.</div>
            </div>
            <input
              ref={uploadMoreInputRef}
              type="file"
              multiple
              onChange={handleUploadMoreFiles}
              className="hidden"
              accept=".pdf,.docx,.doc,.md,.txt,.json,.csv,.ts,.js,.py,.sql"
            />
            <button
              type="button"
              disabled={isUploadingMore}
              onClick={() => uploadMoreInputRef.current?.click()}
              className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-canvas font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs"
            >
              {isUploadingMore ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <UploadCloud size={13} />
              )}
              <span>{isUploadingMore ? 'Uploading...' : 'Upload Files'}</span>
            </button>
          </div>
        )}

        {/* Live Chunks Preview (Sample Grounding Context) */}
        <div className="space-y-1.5 font-mono">
          <div className="text-[10px] uppercase tracking-caption text-muted flex items-center justify-between">
            <span className="flex items-center gap-1">
              <FileCode size={11} className="text-primary" />
              <span>Sample Grounding Chunks (PostgreSQL Embeddings)</span>
            </span>
            <span>Showing top {chunks.length} of {source.chunksCount}</span>
          </div>

          {isLoadingChunks ? (
            <div className="p-4 bg-canvas rounded-xl border border-hairline flex items-center justify-center gap-2 text-muted">
              <Loader2 size={14} className="animate-spin text-primary" />
              <span>Loading vector chunks from database...</span>
            </div>
          ) : chunks.length > 0 ? (
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {chunks.map((chk, idx) => (
                <div
                  key={chk.id || idx}
                  className="p-2 bg-canvas-soft rounded-lg border border-hairline space-y-1 text-[11px]"
                >
                  <div className="flex items-center justify-between text-muted text-[10px]">
                    <span className="text-primary font-semibold truncate">
                      {chk.file_path}
                    </span>
                    <span>Chunk #{chk.chunk_index}</span>
                  </div>
                  <p className="text-ink line-clamp-2 text-[11px] font-sans">
                    {chk.chunk_content}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 bg-canvas rounded-xl border border-hairline text-center text-muted text-xs">
              No vector chunks indexed yet. Click &quot;Trigger Re-index&quot; below.
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <ModalFooter>
          <button
            type="button"
            onClick={() => onSync(source.id)}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-canvas-soft hover:bg-canvas text-xs font-semibold text-ink border border-hairline rounded-lg transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
          >
            <RefreshCw
              size={13}
              className={
                isSyncing
                  ? 'animate-spin text-primary'
                  : 'text-semantic-success'
              }
            />
            <span>
              {isSyncing ? 'Re-indexing...' : 'Trigger Re-index'}
            </span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-primary hover:bg-primary/90 text-xs font-semibold text-canvas rounded-lg shadow-xs cursor-pointer transition-colors flex items-center gap-1"
          >
            <Check size={13} />
            <span>Done</span>
          </button>
        </ModalFooter>
      </div>
    </Modal>
  )
}
