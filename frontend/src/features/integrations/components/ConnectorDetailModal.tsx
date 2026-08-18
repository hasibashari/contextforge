import React, { useState } from 'react'
import {
  X,
  Cpu,
  CheckCircle2,
  BookOpen,
  Calendar,
  Globe,
  Database,
  GitPullRequest,
  Mail,
  HardDrive,
  FileText,
  Terminal,
  Zap,
  Check,
  Server,
  Activity,
  Plus,
  Unlink,
  Edit3,
  Save,
  RotateCcw,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react'
import type { Integration } from '@/shared/types/workspace'

interface ConnectorDetailModalProps {
  integration: Integration | null
  onClose: () => void
  onTest: (id: string) => void
  onToggleConnect?: (id: string) => void
  onSaveConfig?: (id: string, updates: Partial<Integration>) => void
  isTesting: boolean
}

interface ConnectorDetailContentProps {
  integration: Integration
  onClose: () => void
  onTest: (id: string) => void
  onToggleConnect?: (id: string) => void
  onSaveConfig?: (id: string, updates: Partial<Integration>) => void
  isTesting: boolean
}

const ConnectorDetailContent: React.FC<ConnectorDetailContentProps> = ({
  integration,
  onClose,
  onTest,
  onToggleConnect,
  onSaveConfig,
  isTesting,
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [formData, setFormData] = useState({
    name: integration.name,
    description: integration.description,
    endpoint: integration.endpoint,
    transport: integration.transport || 'stdio',
    apiKey: 'sec_live_mcp_9a4f21e08cb4418a',
  })

  const getIntegrationIcon = () => {
    const id = integration.id.toLowerCase()
    const name = integration.name.toLowerCase()

    if (id.includes('drive') || name.includes('drive')) {
      return (
        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-canvas border border-hairline flex items-center justify-center shadow-2xs shrink-0">
          <HardDrive className="w-4 h-4 sm:w-5 sm:h-5 text-semantic-success" />
        </div>
      )
    }
    if (id.includes('gmail') || name.includes('gmail') || name.includes('mail')) {
      return (
        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-canvas border border-hairline flex items-center justify-center shadow-2xs shrink-0">
          <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-semantic-error" />
        </div>
      )
    }
    if (id.includes('notion') || name.includes('notion')) {
      return (
        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-canvas border border-hairline flex items-center justify-center text-ink shadow-2xs shrink-0">
          <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      )
    }
    if (id.includes('obsidian') || name.includes('obsidian')) {
      return (
        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-[#7c3aed]/10 border border-[#7c3aed]/20 flex items-center justify-center text-[#7c3aed] shadow-2xs shrink-0">
          <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      )
    }
    if (id.includes('calendar') || name.includes('calendar')) {
      return (
        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-semantic-success/10 border border-semantic-success/20 flex items-center justify-center text-semantic-success shadow-2xs shrink-0">
          <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      )
    }
    if (id.includes('search') || name.includes('search') || name.includes('web') || name.includes('tavily')) {
      return (
        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-[#3b82f6]/10 border border-[#3b82f6]/20 flex items-center justify-center text-[#3b82f6] shadow-2xs shrink-0">
          <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      )
    }
    if (id.includes('github') || name.includes('git')) {
      return (
        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-ink/10 border border-hairline flex items-center justify-center text-ink shadow-2xs shrink-0">
          <GitPullRequest className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      )
    }
    if (id.includes('postgres') || name.includes('database') || name.includes('sql')) {
      return (
        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-[#06b6d4]/10 border border-[#06b6d4]/20 flex items-center justify-center text-[#06b6d4] shadow-2xs shrink-0">
          <Database className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      )
    }
    return (
      <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-2xs shrink-0">
        <Cpu className="w-4 h-4 sm:w-5 sm:h-5" />
      </div>
    )
  }

  const isConnected = integration.status === 'connected'

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    onSaveConfig?.(integration.id, {
      name: formData.name,
      description: formData.description,
      endpoint: formData.endpoint,
      transport: formData.transport,
    })
    setIsEditing(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-ink/40 backdrop-blur-xs">
      <div className="bg-surface-card border border-hairline rounded-xl sm:rounded-2xl max-w-2xl w-full p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto overscroll-contain animate-in fade-in zoom-in-95 duration-150">
        {/* Header with Top-Right Action Controls */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            {getIntegrationIcon()}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <h2 className="text-sm sm:text-base md:text-lg font-semibold text-ink leading-snug truncate">
                  {isEditing ? `Edit: ${formData.name}` : integration.name}
                </h2>
                <CheckCircle2
                  size={15}
                  className="text-primary shrink-0 fill-primary/10"
                />
              </div>
              <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-[10px] sm:text-xs font-mono text-muted mt-0.5">
                <span className="capitalize">{integration.category.replace('_', ' ')}</span>
                <span>·</span>
                <span>{integration.version}</span>
                <span>·</span>
                <span
                  className={`font-semibold flex items-center gap-1 ${
                    isConnected ? 'text-semantic-success' : 'text-muted'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isConnected ? 'bg-semantic-success' : 'bg-muted'
                    }`}
                  />
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>

          {/* Top-Right Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {!isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold text-ink bg-canvas-soft hover:bg-canvas border border-hairline transition-colors cursor-pointer"
                  title="Edit connector endpoint & settings"
                >
                  <Edit3 size={13} />
                  <span className="hidden xs:inline sm:inline">Edit Config</span>
                  <span className="xs:hidden sm:hidden">Edit</span>
                </button>

                {isConnected ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] sm:text-[11px] font-mono text-semantic-success font-semibold px-2 py-0.5 sm:py-1 rounded-lg bg-semantic-success/10 border border-semantic-success/20 hidden md:flex items-center gap-1">
                      <CheckCircle2 size={12} />
                      <span>Connected</span>
                    </span>
                    {onToggleConnect && (
                      <button
                        type="button"
                        onClick={() => onToggleConnect(integration.id)}
                        className="flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold text-semantic-error hover:bg-semantic-error/10 border border-semantic-error/30 transition-colors cursor-pointer"
                        title="Disconnect connector"
                      >
                        <Unlink size={13} />
                        <span className="hidden xs:inline sm:inline">Disconnect</span>
                      </button>
                    )}
                  </div>
                ) : (
                  onToggleConnect && (
                    <button
                      type="button"
                      onClick={() => onToggleConnect(integration.id)}
                      className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1 sm:py-1.5 bg-primary hover:bg-primary/90 text-canvas text-[11px] sm:text-xs font-semibold rounded-lg sm:rounded-xl shadow-xs transition-colors cursor-pointer"
                      title="Connect MCP Server"
                    >
                      <Plus size={14} />
                      <span>Connect</span>
                    </button>
                  )
                )}
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    name: integration.name,
                    description: integration.description,
                    endpoint: integration.endpoint,
                    transport: integration.transport || 'stdio',
                    apiKey: 'sec_live_mcp_9a4f21e08cb4418a',
                  })
                  setIsEditing(false)
                }}
                className="flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold text-muted hover:text-ink bg-canvas-soft hover:bg-canvas border border-hairline transition-colors cursor-pointer"
              >
                <RotateCcw size={13} />
                <span>Cancel</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-canvas-soft text-muted hover:text-ink cursor-pointer transition-colors"
              title="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        {isEditing ? (
          /* EDIT CONFIGURATION FORM */
          <form onSubmit={handleSave} className="space-y-4 pt-1">
            <div className="space-y-3 p-4 bg-canvas rounded-xl border border-hairline">
              <div className="text-xs font-mono uppercase tracking-caption text-primary flex items-center gap-1.5">
                <Edit3 size={13} />
                <span>Connector Connection Parameters</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-ink">Connector Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg bg-surface border border-hairline text-ink focus:outline-hidden focus:border-primary font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-ink">Transport Mode</label>
                  <select
                    value={formData.transport}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        transport: e.target.value as 'stdio' | 'sse' | 'rest',
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg bg-surface border border-hairline text-ink focus:outline-hidden focus:border-primary font-mono capitalize"
                  >
                    <option value="stdio">stdio (Local Subprocess)</option>
                    <option value="sse">sse (Server-Sent Events)</option>
                    <option value="rest">rest (HTTP Webhook API)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-ink">
                  Endpoint Command / Host Connection URI
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.endpoint}
                    onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg bg-surface border border-hairline text-ink focus:outline-hidden focus:border-primary font-mono pr-8"
                    placeholder="e.g. npx -y @modelcontextprotocol/server-postgres"
                  />
                  <Server size={14} className="absolute right-2.5 top-2.5 text-muted pointer-events-none" />
                </div>
                <p className="text-[10px] text-muted font-mono">
                  Command or network URL executed by the orchestrator daemon.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-ink">Description & Scope</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-surface border border-hairline text-ink focus:outline-hidden focus:border-primary resize-none font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-ink flex items-center justify-between">
                  <span>API Key / Secret Token (Encrypted)</span>
                  <span className="text-[10px] text-semantic-success flex items-center gap-1 font-mono">
                    <Lock size={10} /> AES-256 Vault
                  </span>
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={formData.apiKey}
                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-surface border border-hairline text-ink focus:outline-hidden focus:border-primary font-mono pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2.5 top-2 text-muted hover:text-ink cursor-pointer"
                  >
                    {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Edit Form Footer */}
            <div className="pt-3 border-t border-hairline flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    name: integration.name,
                    description: integration.description,
                    endpoint: integration.endpoint,
                    transport: integration.transport || 'stdio',
                    apiKey: 'sec_live_mcp_9a4f21e08cb4418a',
                  })
                  setIsEditing(false)
                }}
                className="px-4 py-2 bg-canvas-soft hover:bg-canvas text-xs font-semibold text-muted hover:text-ink border border-hairline rounded-xl cursor-pointer transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-5 py-2 bg-primary hover:bg-primary/90 text-xs font-semibold text-canvas rounded-xl shadow-xs cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <Save size={14} />
                <span>Save Configuration</span>
              </button>
            </div>
          </form>
        ) : (
          /* VIEW OVERVIEW & TELEMETRY */
          <>
            {/* Description */}
            <div className="p-3.5 bg-canvas-soft rounded-xl border border-hairline text-xs text-body leading-relaxed">
              {integration.description}
            </div>

            {/* Connection Telemetry & Config Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-canvas border border-hairline space-y-1">
                <div className="text-muted text-[10px] uppercase tracking-caption flex items-center gap-1">
                  <Server size={11} className="text-primary" />
                  <span>Endpoint Host</span>
                </div>
                <div className="font-semibold text-ink truncate" title={integration.endpoint}>
                  {integration.endpoint}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-canvas border border-hairline space-y-1">
                <div className="text-muted text-[10px] uppercase tracking-caption flex items-center gap-1">
                  <Activity size={11} className="text-semantic-success" />
                  <span>Response Latency</span>
                </div>
                <div className="font-semibold text-semantic-success">
                  {integration.latencyMs} ms
                </div>
              </div>

              <div className="p-3 rounded-xl bg-canvas border border-hairline space-y-1">
                <div className="text-muted text-[10px] uppercase tracking-caption flex items-center gap-1">
                  <Terminal size={11} className="text-[#8c52ff]" />
                  <span>Transport Mode</span>
                </div>
                <div className="font-semibold text-ink uppercase">
                  {integration.transport || 'stdio'}
                </div>
              </div>
            </div>

            {/* Exposed MCP Tools List */}
            <div className="space-y-2">
              <div className="text-xs font-mono uppercase tracking-caption text-muted flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-primary">
                  <Terminal size={13} />
                  <span>Exposed Tools & Actions ({integration.tools.length}):</span>
                </span>
                <span className="text-[10px] lowercase text-muted">Ready for agent execution</span>
              </div>

              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {integration.tools.map((tool) => (
                  <div
                    key={tool.name}
                    className="p-3 rounded-xl bg-canvas border border-hairline space-y-1.5 text-xs font-mono"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-ink flex items-center gap-1.5">
                        <Terminal size={12} className="text-primary" />
                        <span>{tool.name}</span>
                      </span>
                      <span
                        className={`text-[10px] uppercase px-2 py-0.5 rounded font-semibold ${
                          tool.readOnly
                            ? 'bg-primary/10 text-primary border border-primary/20'
                            : 'bg-semantic-success/10 text-semantic-success border border-semantic-success/20'
                        }`}
                      >
                        {tool.readOnly ? 'Read Only' : 'Mutating Action'}
                      </span>
                    </div>
                    <p className="text-[11px] text-body font-sans leading-relaxed">
                      {tool.description}
                    </p>
                    {tool.parametersSchema && Object.keys(tool.parametersSchema).length > 0 && (
                      <div className="text-[10px] text-muted pt-1 border-t border-hairline/60 flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-ink">Parameters:</span>
                        {Object.entries(tool.parametersSchema).map(([param, type]) => (
                          <span
                            key={param}
                            className="px-1.5 py-0.2 rounded bg-surface-strong text-ink font-mono text-[10px]"
                          >
                            {param}: <em className="text-primary">{String(type)}</em>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="pt-4 border-t border-hairline flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => onTest(integration.id)}
                disabled={isTesting}
                className="flex items-center gap-1.5 px-4 py-2 bg-canvas-soft hover:bg-canvas text-xs font-semibold text-ink border border-hairline rounded-xl transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
              >
                {isTesting ? (
                  <Zap size={14} className="animate-spin text-primary" />
                ) : (
                  <Activity size={14} className="text-semantic-success" />
                )}
                <span>{isTesting ? 'Testing Connection...' : 'Test Ping Server'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-5 py-2 bg-primary hover:bg-primary/90 text-xs font-semibold text-canvas rounded-xl shadow-xs cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  <Check size={14} />
                  <span>Done</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export const ConnectorDetailModal: React.FC<ConnectorDetailModalProps> = ({
  integration,
  onClose,
  onTest,
  onToggleConnect,
  onSaveConfig,
  isTesting,
}) => {
  if (!integration) return null

  return (
    <ConnectorDetailContent
      key={integration.id}
      integration={integration}
      onClose={onClose}
      onTest={onTest}
      onToggleConnect={onToggleConnect}
      onSaveConfig={onSaveConfig}
      isTesting={isTesting}
    />
  )
}
