import React, { useState } from 'react'
import { Cpu, Check, Key, Terminal, Globe, Lock } from 'lucide-react'
import { Modal, ModalHeader, ModalFooter } from '@/shared/components/ui/Modal'
import { IconBox } from '@/shared/components/ui/IconBox'

interface AddConnectorModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (data: {
    name: string
    category?: string
    endpoint: string
    description: string
    transport?: 'stdio' | 'streamable_http' | 'sse' | 'rest'
    authType?: 'none' | 'bearer' | 'oauth' | 'api_key'
    authConfig?: {
      token?: string
      headers?: Record<string, string>
      env?: Record<string, string>
    }
  }) => void
}

export const AddConnectorModal: React.FC<AddConnectorModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const [name, setName] = useState('')
  const [transport, setTransport] = useState<'stdio' | 'streamable_http' | 'sse' | 'rest'>('stdio')
  const [endpoint, setEndpoint] = useState('')
  const [authType, setAuthType] = useState<'none' | 'bearer' | 'oauth' | 'api_key'>('none')
  const [authToken, setAuthToken] = useState('')
  const [envVars, setEnvVars] = useState('')
  const [description, setDescription] = useState('')

  if (!isOpen) return null

  const isRemote = transport === 'streamable_http' || transport === 'sse' || transport === 'rest'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !endpoint.trim()) return

    const authConfig: {
      token?: string
      env?: Record<string, string>
    } = {}

    if (isRemote && authType !== 'none' && authToken.trim()) {
      authConfig.token = authToken.trim()
    }

    if (!isRemote && envVars.trim()) {
      const envObj: Record<string, string> = {}
      envVars.split('\n').forEach((line) => {
        const [k, ...v] = line.split('=')
        if (k && v.length) envObj[k.trim()] = v.join('=').trim()
      })
      authConfig.env = envObj
    }

    onAdd({
      name: name.trim(),
      category: 'mcp_server',
      transport,
      authType: isRemote ? authType : 'none',
      authConfig,
      endpoint: endpoint.trim(),
      description:
        description.trim() ||
        'Custom MCP server providing tool execution protocols for ContextForge agents.',
    })

    setName('')
    setEndpoint('')
    setAuthToken('')
    setEnvVars('')
    setDescription('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalHeader
        icon={<IconBox size="md" variant="primary" icon={<Cpu size={19} />} />}
        title="Register MCP Server"
        subtitle="Connect a Model Context Protocol (MCP) server to expose tools to agents"
        onClose={onClose}
      />

      <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
        {/* Server Name & Transport Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 space-y-1">
            <label className="text-ink font-semibold flex items-center gap-1.5">
              <span>MCP Server Name</span>
            </label>
            <input
              type="text"
              placeholder="e.g. GitHub Copilot MCP / Local SQLite MCP"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 bg-canvas border border-hairline rounded-lg text-ink focus:outline-none focus:border-primary text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-ink font-semibold flex items-center gap-1.5">
              <span>Transport</span>
            </label>
            <select
              value={transport}
              onChange={(e) => {
                const val = e.target.value as 'stdio' | 'streamable_http' | 'sse' | 'rest'
                setTransport(val)
                if (val === 'stdio') setAuthType('none')
              }}
              className="w-full px-3 py-2 bg-canvas border border-hairline rounded-lg text-ink focus:outline-none focus:border-primary text-xs cursor-pointer"
            >
              <option value="stdio">stdio (Local Subprocess)</option>
              <option value="streamable_http">Streamable HTTP (Remote)</option>
              <option value="sse">SSE (Server-Sent Events)</option>
              <option value="rest">REST Webhook API</option>
            </select>
          </div>
        </div>

        {/* Endpoint / Command */}
        <div className="space-y-1">
          <label className="text-ink font-semibold flex items-center gap-1.5">
            {transport === 'stdio' ? <Terminal size={13} /> : <Globe size={13} />}
            <span>
              {transport === 'stdio'
                ? 'Command Line Entrypoint (npx / binary executable)'
                : 'Connection URL (Endpoint)'}
            </span>
          </label>
          <input
            type="text"
            placeholder={
              transport === 'stdio'
                ? 'npx -y @modelcontextprotocol/server-filesystem /path/to/dir'
                : 'https://api.githubcopilot.com/mcp/'
            }
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            required
            className="w-full px-3 py-2 bg-canvas border border-hairline rounded-lg text-ink focus:outline-none focus:border-primary text-xs"
          />
        </div>

        {/* Adaptive Authentication for Remote Streamable HTTP / SSE */}
        {isRemote && (
          <div className="p-3.5 rounded-xl bg-canvas-soft border border-hairline space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-semibold text-ink text-xs">
                <Lock size={13} className="text-primary" />
                <span>Authentication & Credentials</span>
              </div>
              <div className="text-[10px] text-muted">Remote MCP Security</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-muted text-[11px]">Auth Method</label>
                <select
                  value={authType}
                  onChange={(e) =>
                    setAuthType(e.target.value as 'none' | 'bearer' | 'oauth' | 'api_key')
                  }
                  className="w-full px-3 py-1.5 bg-canvas border border-hairline rounded-lg text-ink text-xs focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="none">None (Public / Internal Network)</option>
                  <option value="bearer">Bearer Token / API Key</option>
                  <option value="oauth">OAuth 2.0 (SSO / Token Exchange)</option>
                </select>
              </div>

              {authType !== 'none' && (
                <div className="space-y-1 animate-in fade-in duration-150">
                  <label className="text-muted text-[11px] flex items-center gap-1">
                    <Key size={11} />
                    <span>Secret Key / Access Token</span>
                  </label>
                  <input
                    type="password"
                    placeholder="e.g. ghp_**************** or sk_mcp_***"
                    value={authToken}
                    onChange={(e) => setAuthToken(e.target.value)}
                    className="w-full px-3 py-1.5 bg-canvas border border-hairline rounded-lg text-ink text-xs focus:outline-none focus:border-primary font-mono"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Optional Environment Variables for Local stdio */}
        {!isRemote && (
          <div className="space-y-1">
            <label className="text-muted text-[11px] flex items-center justify-between">
              <span>Environment Variables (Optional, KEY=VALUE per line)</span>
              <span className="text-[10px] text-muted font-sans">e.g. GITHUB_TOKEN=ghp_xxx</span>
            </label>
            <textarea
              rows={2}
              placeholder="DATABASE_URL=postgresql://user:pass@localhost:5432/db&#10;DEBUG=mcp:*"
              value={envVars}
              onChange={(e) => setEnvVars(e.target.value)}
              className="w-full px-3 py-1.5 bg-canvas border border-hairline rounded-lg text-ink focus:outline-none focus:border-primary text-xs resize-none font-mono"
            />
          </div>
        )}

        {/* Description */}
        <div className="space-y-1">
          <label className="text-ink font-semibold">Description & Scope</label>
          <textarea
            rows={2}
            placeholder="Describe what tools and capabilities this MCP server exposes to AI agents..."
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
            className="px-4 py-2 bg-primary hover:bg-primary-active text-on-primary text-xs font-semibold rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Check size={13} />
            <span>Register MCP Server</span>
          </button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
