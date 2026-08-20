import React, { useState } from 'react'
import { Cpu, Check } from 'lucide-react'
import type { Integration } from '@/shared/types/workspace'
import { Modal, ModalHeader, ModalFooter } from '@/shared/components/ui/Modal'
import { IconBox } from '@/shared/components/ui/IconBox'

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
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalHeader
        icon={<IconBox size="md" variant="primary" icon={<Cpu size={19} />} />}
        title="Connect Custom MCP Server"
        subtitle="Register a local or remote Model Context Protocol provider"
        onClose={onClose}
      />

      <form onSubmit={handleSubmit} className="space-y-3.5 text-xs font-mono">
        {/* Name */}
        <div className="space-y-1">
          <label className="text-ink font-semibold">Connector Name</label>
          <input
            type="text"
            placeholder="e.g. Sentry Error MCP / Local SQLite"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 bg-canvas border border-hairline rounded-lg text-ink focus:outline-none focus:border-primary text-xs"
          />
        </div>

        {/* Category & Transport Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-ink font-semibold">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Integration['category'])}
              className="w-full px-3 py-2 bg-canvas border border-hairline rounded-lg text-ink focus:outline-none focus:border-primary text-xs cursor-pointer"
            >
              <option value="mcp_server">MCP Server</option>
              <option value="git_provider">Git Provider</option>
              <option value="productivity">Productivity</option>
              <option value="documentation">Documentation</option>
              <option value="telemetry">Telemetry</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-ink font-semibold">Transport Protocol</label>
            <select
              value={transport}
              onChange={(e) => setTransport(e.target.value as 'stdio' | 'sse' | 'rest')}
              className="w-full px-3 py-2 bg-canvas border border-hairline rounded-lg text-ink focus:outline-none focus:border-primary text-xs cursor-pointer"
            >
              <option value="stdio">stdio (Local Command)</option>
              <option value="sse">SSE (Server-Sent Events)</option>
              <option value="rest">REST API</option>
            </select>
          </div>
        </div>

        {/* Endpoint / Command */}
        <div className="space-y-1">
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
            className="w-full px-3 py-2 bg-canvas border border-hairline rounded-lg text-ink focus:outline-none focus:border-primary text-xs"
          />
        </div>

        {/* Description */}
        <div className="space-y-1">
          <label className="text-ink font-semibold">Description / Scope</label>
          <textarea
            rows={2}
            placeholder="What tools does this connector expose to agents?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 bg-canvas border border-hairline rounded-lg text-ink focus:outline-none focus:border-primary font-sans text-xs resize-none"
          />
        </div>

        {/* Actions */}
        <ModalFooter className="justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs text-body hover:text-ink cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-1.5 bg-primary hover:bg-primary/90 text-canvas text-xs font-semibold rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Check size={13} />
            <span>Connect MCP Server</span>
          </button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
