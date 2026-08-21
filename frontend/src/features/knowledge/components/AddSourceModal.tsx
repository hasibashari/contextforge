import React, { useState, useRef } from 'react'
import {
  Sparkles,
  FileText,
  Trash2,
  Layers,
  FolderOpen,
  RefreshCw,
} from 'lucide-react'
import type { KnowledgeSource } from '@/shared/types/workspace'
import { obsidianBridgeService } from '@/shared/services/obsidianBridge.service'
import { browserStorageBridge } from '@/shared/services/browserStorageBridge.service'
import {
  Modal,
  ModalHeader,
  ModalFooter,
  IconBox,
  KnowledgeIconBox,
  Button,
  Input,
  FormField,
  Badge,
} from '@/shared/components'

interface AddSourceModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (source: {
    name: string
    type: KnowledgeSource['type']
    location: string
    subfolderScope?: string
  }) => void
  onUpload?: (
    files: File[],
    name: string,
    sourceId?: string,
  ) => Promise<unknown>
}

export const AddSourceModal: React.FC<AddSourceModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  onUpload,
}) => {
  const [sourceName, setSourceName] = useState('')
  const [detectedType, setDetectedType] = useState<KnowledgeSource['type']>('local_folder')
  const [folderPathLabel, setFolderPathLabel] = useState<string>('')
  const [files, setFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [ingestProgressText, setIngestProgressText] = useState('')

  const directoryInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDefaultName = (raw: string) => {
    return raw
      .replace(/\.[^/.]+$/, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
  }

  const handleSelectFolder = async (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
    if (isScanning) return

    if (obsidianBridgeService.isFileSystemAccessSupported()) {
      setIsScanning(true)
      try {
        const result = await obsidianBridgeService.requestDirectoryPicker()
        if (result) {
          const allFiles = [
            ...result.rootFiles,
            ...result.subfolders.flatMap((sf) => sf.files),
          ]
          const isObsidian =
            result.subfolders.some((sf) => sf.hasObsidianVaultSignature) ||
            result.rootName.toLowerCase().includes('obsidian') ||
            result.rootName.toLowerCase().includes('vault') ||
            allFiles.some((f) => f.name.endsWith('.md'))

          setFiles(allFiles)
          setFolderPathLabel(result.rootName)
          setDetectedType(isObsidian ? 'obsidian_vault' : 'local_folder')
          if (!sourceName) {
            setSourceName(formatDefaultName(result.rootName))
          }

          // Persist directory handle for direct disk write-back & delta sync
          await browserStorageBridge.storeDirectoryHandle(
            result.rootName,
            result.rootName,
            result.handle
          )
        }
      } catch (err) {
        console.error('Folder pick error:', err)
      } finally {
        setIsScanning(false)
      }
    } else {
      directoryInputRef.current?.click()
    }
  }

  const handleWebkitDirectoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files)
      const firstRel =
        (selected[0] as unknown as { webkitRelativePath?: string }).webkitRelativePath || ''
      const rootName = firstRel.split('/')[0] || 'Local Folder'

      const isObsidian =
        rootName.toLowerCase().includes('obsidian') ||
        rootName.toLowerCase().includes('vault') ||
        selected.some((f) => f.name.endsWith('.md'))

      setFiles(selected)
      setFolderPathLabel(rootName)
      setDetectedType(isObsidian ? 'obsidian_vault' : 'local_folder')
      if (!sourceName) {
        setSourceName(formatDefaultName(rootName))
      }
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const dropped = Array.from(e.dataTransfer.files)
      setFiles(dropped)
      const firstFile = dropped[0]
      const fallbackName =
        dropped.length === 1
          ? formatDefaultName(firstFile.name)
          : `Knowledge Folder (${dropped.length} files)`

      setFolderPathLabel(dropped.length === 1 ? firstFile.name : `Dropzone Folder`)
      setDetectedType(
        dropped.some((f) => f.name.endsWith('.md')) ? 'obsidian_vault' : 'local_folder',
      )
      if (!sourceName) {
        setSourceName(fallbackName)
      }
    }
  }

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleResetSelection = () => {
    setFiles([])
    setFolderPathLabel('')
    setSourceName('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (files.length === 0 && !folderPathLabel) return
    setIsSubmitting(true)
    setIngestProgressText('Connecting & vectorizing into PostgreSQL pgvector (1536-dim)...')

    try {
      const finalName =
        sourceName.trim() ||
        (folderPathLabel
          ? formatDefaultName(folderPathLabel)
          : `Knowledge Collection (${files.length} files)`)

      if (files.length > 0 && onUpload) {
        await onUpload(files, finalName)
      } else {
        onAdd({
          name: finalName,
          type: detectedType,
          location: folderPathLabel
            ? `paired://${folderPathLabel}`
            : `upload://documents/${Date.now()}`,
          subfolderScope: folderPathLabel || undefined,
        })
      }

      handleResetSelection()
      onClose()
    } finally {
      setIsSubmitting(false)
      setIngestProgressText('')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      {/* Hidden Directory Input Fallback */}
      <input
        ref={directoryInputRef}
        type="file"
        // @ts-expect-error webkitdirectory attribute
        webkitdirectory=""
        directory=""
        multiple
        onChange={handleWebkitDirectoryChange}
        className="hidden"
      />

      <ModalHeader
        icon={<IconBox size="md" variant="primary" icon={<FolderOpen size={19} />} />}
        title="Connect Knowledge Source"
        badge={
          <Badge variant="primary" size="xs" icon={<Sparkles size={10} />}>
            1536-dim RAG
          </Badge>
        }
        subtitle="Pair a local folder or vault from your computer to ground AI reasoning with isolated vector search."
        onClose={onClose}
      />

      {/* Form Body */}
      <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
        {/* Source Name Field */}
        <FormField label="Knowledge Source Name:">
          <Input
            placeholder="e.g. Engineering Specs, Personal Obsidian Vault, or Research Papers"
            value={sourceName}
            onChange={(e) => setSourceName(e.target.value)}
          />
        </FormField>

        {/* Unified Folder Dropzone Area */}
        {files.length === 0 && !folderPathLabel ? (
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={handleSelectFolder}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer space-y-3 font-sans ${
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-hairline hover:border-primary/50 bg-canvas-soft hover:bg-canvas'
            }`}
          >
            <div className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-2xs">
              <FolderOpen size={22} />
            </div>

            <div className="space-y-1 max-w-md mx-auto">
              <div className="font-semibold text-ink text-sm sm:text-base">
                Select or Drop a Folder from Laptop
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Click anywhere to browse a local folder, or drag and drop your project documents here.
              </p>
            </div>

            {/* Action Button */}
            <div className="pt-1">
              <Button
                type="button"
                variant="primary"
                size="sm"
                isLoading={isScanning}
                leftIcon={<FolderOpen size={14} />}
              >
                {isScanning ? 'Scanning Folder...' : 'Select Folder from Laptop'}
              </Button>
            </div>

            <div className="text-[11px] text-muted font-mono pt-0.5">
              Obsidian Vaults, Markdown (.md), PDF, DOCX, Code (TS/Py/JS/SQL), JSON, TXT, CSV
            </div>
          </div>
        ) : (
          /* Selected Folder Summary & Files List Preview */
          <div className="p-3.5 bg-canvas rounded-xl border border-hairline space-y-3 animate-in fade-in duration-150 font-sans">
            {/* Top Banner Status */}
            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-hairline">
              <div className="flex items-center gap-2.5 min-w-0">
                <KnowledgeIconBox type={detectedType} size="sm" />

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-ink text-xs truncate">
                      {folderPathLabel ? `/${folderPathLabel}` : 'Paired Folder'}
                    </span>
                    <Badge variant="primary" size="xs">
                      {detectedType === 'obsidian_vault' ? 'Obsidian Vault' : 'Local Folder'}
                    </Badge>
                  </div>
                  <div className="text-[11px] text-muted font-mono mt-0.5">
                    {files.length} documents ready for RAG · Total:{' '}
                    {formatFileSize(files.reduce((acc, f) => acc + f.size, 0))}
                  </div>
                </div>
              </div>

              <Button
                type="button"
                variant="secondary"
                size="xs"
                leftIcon={<RefreshCw size={11} />}
                onClick={handleResetSelection}
              >
                Change
              </Button>
            </div>

            {/* Scanned Files List Preview */}
            <div className="max-h-36 sm:max-h-40 overflow-y-auto space-y-1 pr-1 overscroll-contain">
              {files.slice(0, 40).map((file, idx) => (
                <div
                  key={`${file.name}-${idx}`}
                  className="flex items-center justify-between p-2 bg-canvas-soft rounded-lg border border-hairline text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText size={13} className="text-primary shrink-0" />
                    <span className="text-ink font-semibold truncate font-mono text-[11px]">
                      {file.name}
                    </span>
                    <span className="text-[10px] font-mono text-muted shrink-0">
                      ({formatFileSize(file.size)})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(idx)}
                    className="p-1 text-muted hover:text-semantic-error hover:bg-canvas rounded transition-colors cursor-pointer shrink-0"
                    title="Exclude file from indexing"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              {files.length > 40 && (
                <div className="text-[10px] text-muted text-center py-1 font-mono">
                  + {files.length - 40} more documents in folder
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footnote Badge */}
        <div className="flex items-center gap-2 text-xs text-muted bg-canvas-soft/80 p-2.5 rounded-xl border border-hairline font-sans leading-relaxed">
          <Layers size={14} className="text-primary shrink-0" />
          <span>Living folder sync &amp; 1536-dim vector RAG grounding active for AI agents.</span>
        </div>

        {/* Action Buttons */}
        <ModalFooter className="justify-end font-sans">
          <Button type="button" variant="ghost" size="xs" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
            disabled={isSubmitting || (files.length === 0 && !folderPathLabel)}
          >
            {isSubmitting
              ? ingestProgressText || 'Vectorizing...'
              : files.length > 0
              ? `Connect & Ingest (${files.length} Docs)`
              : folderPathLabel
              ? `Connect /${folderPathLabel}`
              : 'Connect Knowledge Source'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
