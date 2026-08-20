import React, { useState } from 'react'
import { Key, Globe, Database, Shield, Lock, Check } from 'lucide-react'
import type { WorkspaceConnection } from '@/shared/types/workspace'
import { Modal, ModalHeader, ModalFooter } from '@/shared/components/ui/Modal'
import { IconBox } from '@/shared/components/ui/IconBox'

interface AddConnectionModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (data: {
    name: string
    connectionType: WorkspaceConnection['connectionType']
    provider: string
    authType: WorkspaceConnection['authType']
    endpointUrl?: string
    config?: Record<string, unknown>
  }) => void
}

export const AddConnectionModal: React.FC<AddConnectionModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const [name, setName] = useState('')
  const [connectionType, setConnectionType] =
    useState<WorkspaceConnection['connectionType']>('llm_provider')
  const [provider, setProvider] = useState('google_gemini')
  const [authType, setAuthType] =
    useState<WorkspaceConnection['authType']>('api_key')
  const [endpointUrl, setEndpointUrl] = useState(
    'https://generativelanguage.googleapis.com'
  )
  const [secretKey, setSecretKey] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    onAdd({
      name: name.trim(),
      connectionType,
      provider,
      authType,
      endpointUrl: endpointUrl.trim() || undefined,
      config: secretKey ? { maskedKey: '••••••••••••••••' } : {},
    })

    setName('')
    setSecretKey('')
    onClose()
  }

  const handleProviderChange = (newProvider: string) => {
    setProvider(newProvider)
    if (newProvider === 'google_gemini') {
      setName('Google Gemini Production API')
      setConnectionType('llm_provider')
      setAuthType('api_key')
      setEndpointUrl('https://generativelanguage.googleapis.com')
    } else if (newProvider === 'github') {
      setName('GitHub Enterprise OAuth')
      setConnectionType('oauth_service')
      setAuthType('oauth2')
      setEndpointUrl('https://api.github.com')
    } else if (newProvider === 'google_calendar') {
      setName('Google Calendar Sync')
      setConnectionType('oauth_service')
      setAuthType('oauth2')
      setEndpointUrl('https://www.googleapis.com/calendar/v3')
    } else if (newProvider === 'postgres') {
      setName('PostgreSQL Database Connection')
      setConnectionType('database')
      setAuthType('connection_string')
      setEndpointUrl('postgresql://user:pass@host:5432/dbname')
    } else if (newProvider === 'custom_mcp') {
      setName('Remote MCP Server Connection')
      setConnectionType('mcp_server')
      setAuthType('bearer_token')
      setEndpointUrl('https://mcp.custom.domain/sse')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalHeader
        icon={<IconBox size="md" variant="primary" icon={<Key size={19} />} />}
        title="Create Workspace Connection"
        subtitle="Manage Google Gemini API keys, OAuth 2.0 services, and databases"
        onClose={onClose}
      />

      <form onSubmit={handleSubmit} className="space-y-3.5 text-xs font-mono">
        <div className="space-y-1.5">
          <label className="font-semibold text-ink">Provider Preset</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { id: 'google_gemini', label: 'Google Gemini', icon: Key },
              { id: 'github', label: 'GitHub OAuth', icon: Globe },
              { id: 'google_calendar', label: 'Google Calendar', icon: Globe },
              { id: 'postgres', label: 'PostgreSQL DB', icon: Database },
              { id: 'custom_mcp', label: 'Remote MCP', icon: Shield },
            ].map((p) => {
              const Icon = p.icon
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleProviderChange(p.id)}
                  className={`p-2.5 rounded-xl border text-xs font-mono flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    provider === p.id
                      ? 'border-primary bg-primary/10 text-primary font-bold shadow-2xs'
                      : 'border-hairline bg-canvas hover:bg-canvas-soft text-body'
                  }`}
                >
                  <Icon size={13} />
                  <span>{p.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="space-y-1">
          <label className="font-semibold text-ink">Connection Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            placeholder="e.g., Google Gemini Production API"
            className="w-full px-3 py-2 bg-canvas border border-hairline rounded-lg text-ink focus:outline-none focus:border-primary text-xs"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="font-semibold text-ink">Connection Type</label>
            <select
              value={connectionType}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setConnectionType(
                  e.target.value as WorkspaceConnection['connectionType']
                )
              }
              className="w-full px-3 py-2 bg-canvas border border-hairline rounded-lg text-xs text-ink focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="llm_provider">LLM Provider</option>
              <option value="oauth_service">OAuth 2.0 Service</option>
              <option value="database">Database Connection</option>
              <option value="mcp_server">Remote MCP Server</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-ink">Authentication Type</label>
            <select
              value={authType}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setAuthType(e.target.value as WorkspaceConnection['authType'])
              }
              className="w-full px-3 py-2 bg-canvas border border-hairline rounded-lg text-xs text-ink focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="api_key">API Key</option>
              <option value="oauth2">OAuth 2.0</option>
              <option value="connection_string">Connection String</option>
              <option value="bearer_token">Bearer Token</option>
              <option value="none">None (Public)</option>
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="font-semibold text-ink">Endpoint URL / Host</label>
          <input
            type="text"
            value={endpointUrl}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndpointUrl(e.target.value)}
            placeholder="https://api.example.com"
            className="w-full px-3 py-2 bg-canvas border border-hairline rounded-lg text-ink focus:outline-none focus:border-primary text-xs"
          />
        </div>

        <div className="space-y-1">
          <label className="font-semibold text-ink">API Key / Secret Credential</label>
          <input
            type="password"
            value={secretKey}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSecretKey(e.target.value)}
            placeholder="sk-..."
            className="w-full px-3 py-2 bg-canvas border border-hairline rounded-lg text-ink focus:outline-none focus:border-primary text-xs"
          />
          <p className="text-[11px] text-muted">Stored securely and encrypted in PostgreSQL.</p>
        </div>

        <div className="flex items-center gap-2 p-3 bg-canvas-soft border border-hairline rounded-xl text-xs text-muted font-mono">
          <Lock size={14} className="text-primary shrink-0" />
          <span>
            ContextForge Zero-Leak Architecture: Credentials are encrypted at rest and never returned in plaintext to the frontend.
          </span>
        </div>

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
            disabled={!name.trim()}
            className="px-4 py-1.5 bg-primary hover:bg-primary/90 text-canvas text-xs font-semibold rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            <Check size={13} />
            <span>Save Connection</span>
          </button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
