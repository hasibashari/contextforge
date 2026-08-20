import React, { useState, useRef } from 'react'
import {
  X,
  Sparkles,
  UploadCloud,
  FileText,
  Trash2,
  Loader2,
  CheckCircle2,
  Layers,
} from 'lucide-react'
import type { KnowledgeSource } from '@/shared/types/workspace'

interface AddSourceModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (source: {
    name: string
    type: KnowledgeSource['type']
    location: string
  }) => void
  onUpload?: (files: File[], name: string) => Promise<unknown>
}

export const AddSourceModal: React.FC<AddSourceModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  onUpload,
}) => {
  const [name, setName] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files)
      setFiles((prev) => [...prev, ...selected])
      if (!name) {
        setName(
          selected.length === 1
            ? selected[0].name.replace(/\.[^/.]+$/, '')
            : `Document Collection (${selected.length} files)`,
        )
      }
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const dropped = Array.from(e.dataTransfer.files)
      setFiles((prev) => [...prev, ...dropped])
      if (!name) {
        setName(
          dropped.length === 1
            ? dropped[0].name.replace(/\.[^/.]+$/, '')
            : `Document Collection (${dropped.length} files)`,
        )
      }
    }
  }

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (files.length === 0) return
    setIsSubmitting(true)

    try {
      const collectionName =
        name.trim() || `Document Collection (${files.length} files)`

      if (onUpload) {
        await onUpload(files, collectionName)
      } else {
        onAdd({
          name: collectionName,
          type: 'document_upload',
          location: `upload://documents/${Date.now()}`,
        })
      }

      // Reset
      setName('')
      setFiles([])
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-ink/40 backdrop-blur-xs">
      <div className="bg-surface-card border border-hairline rounded-xl sm:rounded-2xl max-w-xl w-full p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base md:text-lg font-semibold text-ink leading-snug truncate">
                Connect Knowledge Source
              </h2>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                <Sparkles size={10} />
                <span>1536-dim Vector RAG</span>
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-muted mt-0.5 leading-relaxed">
              Ingest local documents and project files into your isolated vector knowledge base.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-canvas-soft text-muted hover:text-ink cursor-pointer transition-colors shrink-0"
            title="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-ink uppercase tracking-caption font-mono mb-1">
              Source / Collection Name:
            </label>
            <input
              type="text"
              placeholder="e.g. Architecture Specs & Engineering Documentation"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 bg-canvas-soft border border-hairline rounded-lg text-ink focus:outline-none focus:border-primary"
            />
          </div>

          {/* Unified Drag-and-Drop & Browse Zone */}
          <div className="space-y-2">
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors space-y-3 ${isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-hairline hover:border-hairline-strong bg-canvas-soft'
                }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.docx,.doc,.md,.txt,.json,.csv,.ts,.js,.py,.sql"
              />

              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-2xs">
                <UploadCloud size={24} />
              </div>

              <div className="space-y-1">
                <div className="font-semibold text-ink text-xs sm:text-sm">
                  Drag &amp; drop files here, or click to browse
                </div>
                <div className="text-[11px] text-muted font-mono">
                  Supports PDF, DOCX, Markdown (.md), Code (TS/Py/JS/SQL), JSON, TXT, CSV
                </div>
              </div>
            </div>
          </div>

          {/* Selected / Scanned Files List Preview */}
          {files.length > 0 && (
            <div className="p-3 bg-canvas rounded-xl border border-hairline space-y-2 animate-in fade-in duration-150">
              <div className="text-[10px] uppercase font-mono tracking-caption text-muted flex items-center justify-between">
                <span className="flex items-center gap-1 text-ink font-semibold">
                  <CheckCircle2 size={12} className="text-semantic-success" />
                  <span>Selected Files ({files.length})</span>
                </span>
                <span>
                  Total:{' '}
                  {formatFileSize(
                    files.reduce((acc, f) => acc + f.size, 0),
                  )}
                </span>
              </div>

              <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                {files.map((file, idx) => (
                  <div
                    key={`${file.name}-${idx}`}
                    className="flex items-center justify-between p-2 bg-canvas-soft rounded-lg border border-hairline text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText size={14} className="text-primary shrink-0" />
                      <span className="text-ink font-semibold truncate font-mono text-[11px]">
                        {file.name}
                      </span>
                      <span className="text-[10px] font-mono text-muted shrink-0">
                        ({formatFileSize(file.size)})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveFile(idx)
                      }}
                      className="p-1 text-muted hover:text-semantic-error hover:bg-canvas rounded transition-colors cursor-pointer shrink-0"
                      title="Remove file"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Note */}
          <div className="p-3 bg-canvas-soft rounded-xl border border-hairline space-y-1 text-[11px] text-muted leading-relaxed">
            <div className="flex items-center gap-1.5 font-semibold text-ink">
              <Layers size={13} className="text-primary shrink-0" />
              <span>Automatic Vector Chunking &amp; Embedding</span>
            </div>
            <p>
              Documents are extracted, chunked, and embedded using <code className="font-mono text-ink">gemini-embedding-002</code> into PostgreSQL vector tables for real-time grounded reasoning.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-hairline flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-body hover:text-ink cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || files.length === 0}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-canvas font-semibold rounded-lg shadow-xs cursor-pointer transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Vectorizing Chunks...</span>
                </>
              ) : (
                <span>
                  {files.length > 0
                    ? `Ingest ${files.length} Documents (1536-dim RAG)`
                    : 'Connect Knowledge Source'}
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
