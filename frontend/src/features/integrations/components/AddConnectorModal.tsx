import React, { useState } from 'react'
import { X, Cpu, Check } from 'lucide-react'
import type { Integration } from '@/shared/types/workspace'

interface AddConnectorModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (data: {
    name: string
    category: Integration['category']
    endpoint: string
    description: string
    transport?: 'stdio' | 'sse' | 'rest'
  }) => void
}

export const AddConnectorModal: React.FC<AddConnectorModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const [name, setName] = useState('')
  const [category, setCategory] = useState<Integration['category']>('mcp_server')
  const [transport, setTransport] = useState<'stdio' | 'sse' | 'rest'>('stdio')
  const [endpoint, setEndpoint] = useState('')
  const [description, setDescription] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !endpoint.trim()) return

    onAdd({
      name: name.trim(),
      category,
      transport,
      endpoint: endpoint.trim(),
      description: description.trim() || 'Custom MCP connector for ContextForge agentic workflows.',
    })

    setName('')
    setEndpoint('')
    setDescription('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-ink/40 backdrop-blur-xs">
      <div className="bg-surface-card border border-hairline rounded-xl sm:rounded-2xl max-w-lg w-full p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-sm shrink-0">
              <Cpu className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base md:text-lg font-semibold text-ink leading-snug truncate">
                Connect Custom MCP Server
              </h2>
              <p className="text-[11px] sm:text-xs text-muted mt-0.5 leading-relaxed truncate">
                Register a local or remote Model Context Protocol provider
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-canvas-soft text-muted hover:text-ink cursor-pointer transition-colors shrink-0"
            title="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-ink font-semibold">Connector Name</label>
            <input
              type="text"
              placeholder="e.g. Sentry Error MCP / Local SQLite"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 bg-canvas border border-hairline rounded-lg text-ink focus:outline-none focus:border-primary"
            />
          </div>

          {/* Category & Transport Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-ink font-semibold">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Integration['category'])}
                className="w-full px-3 py-2 bg-canvas border border-hairline rounded-lg text-ink focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="mcp_server">MCP Server</option>
                <option value="git_provider">Git Provider</option>
                <option value="productivity">Productivity</option>
                <option value="documentation">Documentation</option>
                <option value="telemetry">Telemetry</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-ink font-semibold">Transport Protocol</label>
              <select
                value={transport}
                onChange={(e) => setTransport(e.target.value as 'stdio' | 'sse' | 'rest')}
                className="w-full px-3 py-2 bg-canvas border border-hairline rounded-lg text-ink focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="stdio">stdio (Local Command)</option>
                <option value="sse">SSE (Server-Sent Events)</option>
                <option value="rest">REST API</option>
              </select>
            </div>
          </div>

          {/* Endpoint / Command */}
          <div className="space-y-1.5">
            <label className="text-ink font-semibold">
              {transport === 'stdio' ? 'Command Line Entrypoint' : 'Endpoint URL'}
            </label>
            <input
              type="text"
              placeholder={
                transport === 'stdio'
                  ? 'npx -y @modelcontextprotocol/server-sqlite /data/db.sqlite'
                  : 'http://localhost:8080/sse'
              }
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              required
              className="w-full px-3 py-2 bg-canvas border border-hairline rounded-lg text-ink focus:outline-none focus:border-primary"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-ink font-semibold">Description / Scope</label>
            <textarea
              rows={2}
              placeholder="What tools does this connector expose to agents?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-canvas border border-hairline rounded-lg text-ink focus:outline-none focus:border-primary font-sans text-xs"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-hairline flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 bg-canvas-soft hover:bg-canvas text-xs font-semibold text-ink border border-hairline rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-canvas text-xs font-semibold rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Check size={14} />
              <span>Connect MCP Server</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
