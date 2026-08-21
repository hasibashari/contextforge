import React, { useState } from 'react'
import { Cpu, Check, Terminal, Globe, Lock } from 'lucide-react'
import {
  Modal,
  ModalHeader,
  ModalFooter,
  IconBox,
  Button,
  Input,
  Select,
  Textarea,
  FormField,
} from '@/shared/components'

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
          <div className="sm:col-span-2">
            <FormField label="MCP Server Name" required>
              <Input
                placeholder="e.g. GitHub Copilot MCP / Local SQLite MCP"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </FormField>
          </div>

          <FormField label="Transport">
            <Select
              value={transport}
              onChange={(e) => {
                const val = e.target.value as 'stdio' | 'streamable_http' | 'sse' | 'rest'
                setTransport(val)
                if (val === 'stdio') setAuthType('none')
              }}
              options={[
                { label: 'stdio (Subprocess)', value: 'stdio' },
                { label: 'Streamable HTTP', value: 'streamable_http' },
                { label: 'SSE', value: 'sse' },
                { label: 'REST Webhook', value: 'rest' },
              ]}
            />
          </FormField>
        </div>

        {/* Endpoint / Command */}
        <FormField
          label={
            <span className="flex items-center gap-1.5">
              {transport === 'stdio' ? <Terminal size={13} /> : <Globe size={13} />}
              <span>
                {transport === 'stdio'
                  ? 'Command Line Entrypoint (npx / binary executable)'
                  : 'Connection URL (Endpoint)'}
              </span>
            </span>
          }
          required
        >
          <Input
            variant="mono"
            placeholder={
              transport === 'stdio'
                ? 'npx -y @modelcontextprotocol/server-filesystem /path/to/dir'
                : 'https://api.githubcopilot.com/mcp/'
            }
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            required
          />
        </FormField>

        {/* Adaptive Authentication for Remote Streamable HTTP / SSE */}
        {isRemote && (
          <div className="p-3.5 rounded-xl bg-canvas-soft border border-hairline space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-semibold text-ink text-xs">
                <Lock size={13} className="text-primary" />
                <span>Authentication &amp; Credentials</span>
              </div>
              <div className="text-[10px] text-muted">Remote MCP Security</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Auth Method">
                <Select
                  value={authType}
                  onChange={(e) =>
                    setAuthType(e.target.value as 'none' | 'bearer' | 'oauth' | 'api_key')
                  }
                  options={[
                    { label: 'None (Public / Internal Network)', value: 'none' },
                    { label: 'Bearer Token / API Key', value: 'bearer' },
                    { label: 'OAuth 2.0 (SSO)', value: 'oauth' },
                  ]}
                />
              </FormField>

              {authType !== 'none' && (
                <FormField label="Secret Key / Access Token">
                  <Input
                    type="password"
                    variant="mono"
                    placeholder="e.g. ghp_**************** or sk_mcp_***"
                    value={authToken}
                    onChange={(e) => setAuthToken(e.target.value)}
                    allowToggleVisibility
                  />
                </FormField>
              )}
            </div>
          </div>
        )}

        {/* Optional Environment Variables for Local stdio */}
        {!isRemote && (
          <FormField
            label="Environment Variables (Optional, KEY=VALUE per line)"
            badge={<span className="text-[10px] text-muted font-sans">e.g. GITHUB_TOKEN=ghp_xxx</span>}
          >
            <Textarea
              variant="mono"
              rows={2}
              placeholder="DATABASE_URL=postgresql://user:pass@localhost:5432/db&#10;DEBUG=mcp:*"
              value={envVars}
              onChange={(e) => setEnvVars(e.target.value)}
            />
          </FormField>
        )}

        {/* Description */}
        <FormField label="Description & Scope">
          <Textarea
            rows={2}
            placeholder="Describe what tools and capabilities this MCP server exposes to AI agents..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </FormField>

        {/* Actions */}
        <ModalFooter className="justify-end">
          <Button type="button" variant="ghost" size="xs" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" leftIcon={<Check size={13} />}>
            Register MCP Server
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
