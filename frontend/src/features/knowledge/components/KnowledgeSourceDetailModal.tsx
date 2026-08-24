import React, { useState, useEffect } from 'react'
import {
  CheckCircle2,
  RefreshCw,
  Check,
  Plus,
  Unlink,
  Trash2,
  Copy,
  UploadCloud,
} from 'lucide-react'
import type { KnowledgeSource } from '@/shared/types/workspace'
import { obsidianBridgeService } from '@/shared/services/obsidianBridge.service'
import {
  Modal,
  ModalHeader,
  ModalFooter,
  StatusPill,
  KnowledgeIconBox,
  ConfirmDeleteModal,
  Button,
  Badge,
} from '@/shared/components'

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
  const [isCopied, setIsCopied] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isUploadingMore, setIsUploadingMore] = useState(false)
  const [hasLocalHandle, setHasLocalHandle] = useState(false)

  const sourceName = source?.name

  useEffect(() => {
    if (!sourceName) return

    let isMounted = true

    // Check if directory handle is active on this device
    obsidianBridgeService.getDirectoryHandle(sourceName).then((h) => {
      if (isMounted) setHasLocalHandle(Boolean(h))
    })

    return () => {
      isMounted = false
    }
  }, [sourceName])

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

  const handleSmartSync = async () => {
    if (hasLocalHandle && onUploadMore && source) {
      try {
        const modified = await obsidianBridgeService.scanModifiedFiles(
          source.name,
          source.lastSynced
        )
        if (modified.length > 0) {
          await onUploadMore(modified, source.name, source.id)
        }
      } catch {
        // Continue with normal sync
      }
    }
    onSync(source.id)
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
        <Button
          variant={isSynced ? 'secondary' : 'primary'}
          size="xs"
          leftIcon={isSynced ? <Unlink size={13} /> : <Plus size={13} />}
          onClick={() => onToggleConnect(source.id)}
          title={
            isSynced
              ? 'Mute Grounding (Temporarily pause reading this source)'
              : 'Enable Grounding (Active in Chat)'
          }
        >
          {isSynced ? 'Mute' : 'Connect'}
        </Button>
      )}

      {onDelete && (
        <Button
          variant="danger"
          size="icon"
          onClick={() => setShowDeleteModal(true)}
          title="Delete Knowledge Source"
          className="w-7 h-7"
        >
          <Trash2 size={14} />
        </Button>
      )}
    </div>
  )

  return (
    <>
      <Modal isOpen={Boolean(source)} onClose={onClose} size="3xl">
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

        <div className="space-y-3.5 text-xs font-sans">
          {/* Live Paired Status Banner */}
          {hasLocalHandle && (
            <div className="flex items-center justify-between p-2.5 bg-semantic-success/5 rounded-xl border border-semantic-success/20 text-xs">
              <div className="flex items-center gap-2 text-ink">
                <span className="w-2 h-2 rounded-full bg-semantic-success animate-pulse" />
                <span className="font-semibold">Live Paired with Laptop Disk</span>
              </div>
              <Badge variant="success" size="xs">
                Direct Disk Write-Back Active
              </Badge>
            </div>
          )}

          {/* Description */}
          <p className="text-body leading-relaxed text-xs">
            {source.description}
          </p>

          {/* Compact Telemetry & Metadata Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2.5 bg-canvas-soft rounded-lg border border-hairline font-mono text-[11px]">
            <div className="flex items-center gap-1.5 text-ink truncate">
              <span className="text-muted">Type:</span>
              <span className="font-semibold truncate">{source.type}</span>
            </div>
            <div className="flex items-center gap-1.5 text-ink truncate">
              <span className="text-muted">Files:</span>
              <span className="font-semibold">{source.filesCount} notes/files</span>
            </div>
            <div className="flex items-center gap-1.5 text-ink truncate">
              <span className="text-muted">Chunks:</span>
              <span className="font-semibold text-primary">{source.chunksCount} vectors</span>
            </div>
          </div>

          {/* Location URI Row with Copy Action */}
          <div className="flex items-center justify-between gap-2 p-2.5 bg-canvas rounded-xl border border-hairline font-mono text-xs">
            <span className="text-ink truncate font-medium text-[11px]">{source.location}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopyUri}
              title="Copy Location URI"
              className="w-6 h-6"
            >
              {isCopied ? (
                <Check size={13} className="text-semantic-success" />
              ) : (
                <Copy size={13} />
              )}
            </Button>
          </div>

          {/* Upload More Files Dropzone */}
          {onUploadMore && (
            <div className="p-3 bg-canvas-soft rounded-xl border border-dashed border-hairline flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold text-ink text-xs truncate">
                  Add more documents to this source
                </div>
                <div className="text-[11px] text-muted truncate font-sans">
                  Supports .md, .txt, .pdf, .ts, .json (chunked into 1536-dim vectors)
                </div>
              </div>
              <input
                type="file"
                id={`upload-more-${source.id}`}
                multiple
                className="hidden"
                onChange={handleUploadMoreFiles}
                disabled={isUploadingMore}
              />
              <Button
                variant="primary"
                size="xs"
                isLoading={isUploadingMore}
                leftIcon={<UploadCloud size={13} />}
                onClick={() =>
                  document.getElementById(`upload-more-${source.id}`)?.click()
                }
                disabled={isUploadingMore}
              >
                {isUploadingMore ? 'Uploading...' : 'Upload Files'}
              </Button>
            </div>
          )}

          {/* Footer Actions */}
          <ModalFooter>
            <Button
              variant="secondary"
              size="sm"
              isLoading={isSyncing}
              leftIcon={<RefreshCw size={13} className={isSyncing ? 'text-primary' : 'text-semantic-success'} />}
              onClick={handleSmartSync}
              disabled={isSyncing}
            >
              {isSyncing ? 'Re-indexing...' : 'Re-index'}
            </Button>

            <Button variant="primary" size="sm" leftIcon={<Check size={13} />} onClick={onClose}>
              Done
            </Button>
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
