import React, { useState } from 'react'
import { X } from 'lucide-react'
import type { KnowledgeSource } from '@/shared/types/workspace'

interface AddSourceModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (source: { name: string; type: KnowledgeSource['type']; location: string }) => void
}

export const AddSourceModal: React.FC<AddSourceModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const [name, setName] = useState('')
  const [type, setType] = useState<KnowledgeSource['type']>('github_repo')
  const [location, setLocation] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !location.trim()) return
    onAdd({ name: name.trim(), type, location: location.trim() })
    setName('')
    setLocation('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-ink/40 backdrop-blur-xs">
      <div className="bg-surface-card border border-hairline rounded-xl sm:rounded-2xl max-w-lg w-full p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base md:text-lg font-semibold text-ink leading-snug truncate">
              Connect Knowledge Source
            </h2>
            <p className="text-[11px] sm:text-xs text-muted mt-0.5 leading-relaxed">
              Ingest codebase repository URL, Notion workspace, or OpenAPI spec.
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

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-ink uppercase tracking-caption font-mono mb-1">
              Source Name:
            </label>
            <input
              type="text"
              required
              placeholder="e.g. acme-billing-microservice"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 bg-canvas-soft border border-hairline rounded-lg text-ink focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block font-semibold text-ink uppercase tracking-caption font-mono mb-1">
              Source Type:
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as KnowledgeSource['type'])}
              className="w-full p-2.5 bg-canvas-soft border border-hairline rounded-lg text-ink focus:outline-none focus:border-primary font-mono"
            >
              <option value="github_repo">GitHub Repository</option>
              <option value="notion_workspace">Notion Documentation Workspace</option>
              <option value="openapi_spec">Live OpenAPI 3.1 Specification</option>
              <option value="database_schema">PostgreSQL Schema (MCP)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-ink uppercase tracking-caption font-mono mb-1">
              Target URI / Location:
            </label>
            <input
              type="text"
              required
              placeholder="e.g. github.com/acme/service:main"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full p-2.5 bg-canvas-soft border border-hairline rounded-lg text-ink focus:outline-none focus:border-primary font-mono"
            />
          </div>

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
              className="px-4 py-2 bg-primary hover:bg-primary-active text-on-primary font-semibold rounded-lg shadow-xs cursor-pointer"
            >
              Connect & Ingest Chunks
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
