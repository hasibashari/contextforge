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
  Loader2,
  UploadCloud,
} from 'lucide-react'
import type { KnowledgeSource } from '@/shared/types/workspace'
import {
  knowledgeApi,
  type BackendKnowledgeChunk,
} from '@/shared/api/knowledgeApi'
import { Modal, ModalHeader, ModalFooter } from '@/shared/components/ui/Modal'
import { StatusPill } from '@/shared/components/ui/StatusPill'
import { KnowledgeIconBox } from '@/shared/components/ui/IconBox'
import { ConfirmDeleteModal } from '@/shared/components/ui/ConfirmDeleteModal'

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
  const [showDeleteModal, setShowDeleteModal] = useState(false)
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

  const handleConfirmDelete = () => {
    if (onDelete) {
      onDelete(source.id)
      setShowDeleteModal(false)
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

      {onDelete && (
        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="p-1.5 rounded-lg text-muted hover:text-semantic-error hover:bg-semantic-error/10 border border-transparent hover:border-semantic-error/20 transition-colors cursor-pointer"
          title="Delete Knowledge Source"
        >
          <Trash2 size={15} />
        </button>
      )}
    </div>
  )

  return (
    <>
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

        <div className="space-y-3.5 text-xs">
          {/* Description */}
          <p className="text-body leading-relaxed text-xs">
            {source.description}
          </p>

          {/* Compact Telemetry & Metadata Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2.5 bg-canvas-soft rounded-lg border border-hairline font-mono text-[11px]">
            <div className="flex items-center gap-1.5 text-ink truncate">
              <Folder size={12} className="text-primary shrink-0" />
              <span>{source.filesCount} Documents</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#8c52ff] truncate">
              <Layers3 size={12} className="shrink-0" />
              <span>{source.chunksCount} Vector Chunks</span>
            </div>
            <div className="flex items-center gap-1.5 text-semantic-success truncate">
              <Cpu size={12} className="shrink-0" />
              <span>1536-dim (Gemini)</span>
            </div>
          </div>

          {/* Clean Location Row with Copy Action */}
          <div className="flex items-center justify-between gap-2 p-2 bg-canvas rounded-lg border border-hairline font-mono text-xs">
            <span className="text-ink truncate font-medium">{source.location}</span>
            <button
              type="button"
              onClick={handleCopyUri}
              className="p-1 rounded text-muted hover:text-ink hover:bg-canvas-soft transition-colors cursor-pointer shrink-0"
              title="Copy Location URI"
            >
              {isCopied ? (
                <Check size={13} className="text-semantic-success" />
              ) : (
                <Copy size={13} />
              )}
            </button>
          </div>

          {/* Upload More Files Action */}
          {onUploadMore && (
            <div className="p-2.5 bg-primary/5 rounded-lg border border-primary/20 flex items-center justify-between gap-3 text-xs">
              <div className="min-w-0">
                <div className="font-semibold text-ink text-xs">Add Documents to Collection</div>
                <div className="text-[11px] text-muted truncate">Upload PDF, DOCX, Markdown, or code files.</div>
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
                className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-canvas font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 shadow-2xs text-xs"
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
                <span>Vector Grounding Preview</span>
              </span>
              <span>Showing top {chunks.length} of {source.chunksCount}</span>
            </div>

            {isLoadingChunks ? (
              <div className="p-3 bg-canvas rounded-lg border border-hairline flex items-center justify-center gap-2 text-muted text-xs">
                <Loader2 size={13} className="animate-spin text-primary" />
                <span>Loading vector chunks from database...</span>
              </div>
            ) : chunks.length > 0 ? (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {chunks.map((chk, idx) => (
                  <div
                    key={chk.id || idx}
                    className="p-2 bg-canvas rounded-lg border border-hairline space-y-0.5 text-[11px]"
                  >
                    <div className="flex items-center justify-between text-muted text-[10px]">
                      <span className="text-primary font-semibold truncate">
                        {chk.file_path}
                      </span>
                      <span>Chunk #{chk.chunk_index}</span>
                    </div>
                    <p className="text-ink line-clamp-2 text-[11px] font-sans leading-relaxed">
                      {chk.chunk_content}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-2.5 bg-canvas rounded-lg border border-hairline text-center text-muted text-xs">
                No vector chunks indexed yet. Click &quot;Re-index&quot; below.
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <ModalFooter>
            <button
              type="button"
              onClick={() => onSync(source.id)}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-canvas-soft hover:bg-canvas text-xs font-semibold text-ink border border-hairline rounded-lg transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
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
                {isSyncing ? 'Re-indexing...' : 'Re-index'}
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

      {/* Dedicated Confirmation Modal for Deletion */}
      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Knowledge Source"
        itemName={source.name}
        description={`Are you sure you want to permanently delete "${source.name}"? This will purge all ${source.chunksCount} vector embeddings and unlink the source.`}
        confirmLabel="Confirm Delete"
      />
    </>
  )
}
