import React, { useState } from 'react'
import {
  CheckCircle2,
  BookOpen,
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
  Folder,
  ExternalLink,
  RefreshCw,
} from 'lucide-react'
import type { Integration } from '@/shared/types/workspace'
import { obsidianBridgeService } from '@/shared/services/obsidianBridge.service'
import { useWorkspace } from '@/shared/mock'
import { Modal, ModalHeader, ModalFooter } from '@/shared/components/ui/Modal'
import { StatusPill } from '@/shared/components/ui/StatusPill'
import { IntegrationIconBox } from '@/shared/components/ui/IconBox'

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
  const { knowledgeSources, integrations, discoverTools } = useWorkspace()
  const currentIntegration =
    integrations.find((i) => i.id === integration.id) || integration

  const [isEditing, setIsEditing] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)

  const [selectedVaultScope, setSelectedVaultScope] = useState(
    integration.targetBinding?.folderScope || 'Obsidian',
  )
  const [outputPath, setOutputPath] = useState(
    integration.targetBinding?.defaultOutputPath || 'Drafts/',
  )

  const [formData, setFormData] = useState({
    name: integration.name,
    description: integration.description,
    endpoint: integration.endpoint,
    transport: integration.transport || 'stdio',
    apiKey: 'sec_live_mcp_9a4f21e08cb4418a',
  })

  const isConnected = currentIntegration.status === 'connected'

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    onSaveConfig?.(integration.id, {
      name: formData.name,
      description: formData.description,
      endpoint: formData.endpoint,
      transport: formData.transport,
      targetBinding: {
        folderScope: selectedVaultScope,
        defaultOutputPath: outputPath,
      },
    })
    setIsEditing(false)
  }

  const renderSubtitle = () => (
    <>
      <span className="uppercase text-[11px] font-mono">
        {currentIntegration.transport || 'stdio'}
      </span>
      {currentIntegration.authType && currentIntegration.authType !== 'none' && (
        <>
          <span>·</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-primary/10 text-primary font-semibold uppercase">
            {currentIntegration.authType}
          </span>
        </>
      )}
      <span>·</span>
      <span>{currentIntegration.version}</span>
      <span>·</span>
      <StatusPill status={currentIntegration.status} />
    </>
  )

  const renderHeaderActions = () => {
    if (isEditing) {
      return (
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
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-muted hover:text-ink bg-canvas-soft hover:bg-canvas border border-hairline transition-colors cursor-pointer"
        >
          <RotateCcw size={13} />
          <span>Cancel</span>
        </button>
      )
    }

    return (
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-ink bg-canvas-soft hover:bg-canvas border border-hairline transition-colors cursor-pointer"
          title="Edit connector configuration"
        >
          <Edit3 size={13} />
          <span>Edit</span>
        </button>

        {onToggleConnect && isConnected && (
          <button
            type="button"
            onClick={() => onToggleConnect(integration.id)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-semantic-error hover:bg-semantic-error/10 border border-semantic-error/30 transition-colors cursor-pointer"
            title="Disconnect connector"
          >
            <Unlink size={13} />
            <span>Disconnect</span>
          </button>
        )}

        {onToggleConnect && !isConnected && (
          <button
            type="button"
            onClick={() => onToggleConnect(integration.id)}
            className="flex items-center gap-1 px-3 py-1.5 bg-primary hover:bg-primary/90 text-canvas text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            title="Connect MCP Server"
          >
            <Plus size={13} />
            <span>Connect</span>
          </button>
        )}
      </div>
    )
  }

  return (
    <Modal isOpen={true} onClose={onClose} size="2xl">
      <ModalHeader
        icon={<IntegrationIconBox integration={integration} size="md" />}
        title={isEditing ? `Edit: ${formData.name}` : integration.name}
        badge={<CheckCircle2 size={15} className="text-primary shrink-0" />}
        subtitle={renderSubtitle()}
        onClose={onClose}
        actions={renderHeaderActions()}
      />

      {/* Modal Body */}
      {isEditing ? (
        /* EDIT CONFIGURATION FORM */
        <form onSubmit={handleSave} className="space-y-3.5 text-xs font-sans">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-ink">Connector Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-3 py-2 bg-canvas border border-hairline rounded-lg text-ink focus:outline-none focus:border-primary text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-ink">Transport Protocol</label>
              <select
                value={formData.transport}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    transport: e.target.value as 'stdio' | 'sse' | 'rest',
                  })
                }
                className="w-full px-3 py-2 bg-canvas border border-hairline rounded-lg text-ink focus:outline-none focus:border-primary text-xs cursor-pointer"
              >
                <option value="stdio">stdio (Local Subprocess)</option>
                <option value="sse">sse (Server-Sent Events)</option>
                <option value="rest">rest (HTTP Webhook API)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-ink">Endpoint Host / URI</label>
            <input
              type="text"
              value={formData.endpoint}
              onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
              required
              className="w-full px-3 py-2 bg-canvas border border-hairline rounded-lg text-ink focus:outline-none focus:border-primary font-mono text-xs"
              placeholder="e.g. http://localhost:27123/mcp/obsidian"
            />
          </div>

          {/* Storage & Knowledge Mounting Selector in Edit Mode */}
          {(integration.id.includes('obsidian') ||
            integration.id.includes('filesystem') ||
            integration.category === 'documentation' ||
            integration.category === 'mcp_server') && (
            <div className="p-3 bg-primary/5 rounded-xl border border-primary/20 space-y-2.5">
              <div className="flex items-center gap-1.5 font-semibold text-ink text-xs">
                <BookOpen size={13} className="text-primary" />
                <span>Target Knowledge Source Mount &amp; Output Route</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] text-muted flex items-center gap-1">
                    <Folder size={11} className="text-primary" />
                    <span>Mount to Knowledge Source:</span>
                  </label>
                  <select
                    value={selectedVaultScope}
                    onChange={(e) => setSelectedVaultScope(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-canvas border border-hairline rounded-lg text-ink focus:outline-none focus:border-primary text-xs font-mono cursor-pointer"
                  >
                    {knowledgeSources.length > 0 ? (
                      knowledgeSources.map((ks) => (
                        <option key={ks.id} value={ks.subfolderScope || ks.name}>
                          📚 {ks.name} ({ks.filesCount} files)
                        </option>
                      ))
                    ) : (
                      <option value="Personal Obsidian Vault">📚 Personal Obsidian Vault</option>
                    )}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-muted">Default Output Subfolder</label>
                  <input
                    type="text"
                    value={outputPath}
                    onChange={(e) => setOutputPath(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-canvas border border-hairline rounded-lg text-ink focus:outline-none focus:border-primary text-xs font-mono"
                    placeholder="e.g. Drafts/ or Notes/"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="font-semibold text-ink">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 bg-canvas border border-hairline rounded-lg text-ink focus:outline-none focus:border-primary resize-none text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-ink flex items-center justify-between">
              <span>API Key / Secret Token</span>
              <span className="text-[10px] text-semantic-success flex items-center gap-1 font-mono">
                <Lock size={10} /> Encrypted
              </span>
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                className="w-full px-3 py-2 bg-canvas border border-hairline rounded-lg text-ink focus:outline-none focus:border-primary font-mono text-xs pr-9"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2.5 top-2.5 text-muted hover:text-ink cursor-pointer"
              >
                {showApiKey ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
          </div>

          {/* Save Buttons */}
          <ModalFooter className="justify-end">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-3.5 py-1.5 text-xs text-body hover:text-ink cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-primary hover:bg-primary/90 text-xs font-semibold text-canvas rounded-lg shadow-xs cursor-pointer transition-colors flex items-center gap-1.5"
            >
              <Save size={13} />
              <span>Save Configuration</span>
            </button>
          </ModalFooter>
        </form>
      ) : (
        /* VIEW OVERVIEW */
        <div className="space-y-3.5 text-xs">
          {/* Description */}
          <p className="text-body leading-relaxed text-xs">
            {integration.description}
          </p>

          {/* Sleek Storage & Mount Banner */}
          {(integration.id.includes('obsidian') ||
            integration.id.includes('filesystem') ||
            Boolean(integration.targetBinding)) && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-primary/5 rounded-xl border border-primary/20 gap-2.5">
              <div className="flex items-center gap-2 min-w-0">
                {integration.id.includes('obsidian') ? (
                  <BookOpen size={16} className="text-[#7c3aed] shrink-0" />
                ) : (
                  <Folder size={16} className="text-primary shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="font-semibold text-ink text-xs truncate">
                    Mounted to: 📚 {selectedVaultScope}
                  </div>
                  <div className="text-[11px] text-muted font-mono">
                    Target Storage Route: /{selectedVaultScope}/{outputPath}
                  </div>
                </div>
              </div>

              {integration.id.includes('obsidian') && (
                <button
                  type="button"
                  onClick={() =>
                    obsidianBridgeService.openInObsidianApp(
                      selectedVaultScope || 'Engineering-HQ',
                      '',
                    )
                  }
                  className="px-3 py-1.5 bg-[#7c3aed] hover:bg-[#7c3aed]/90 text-white font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-xs shadow-2xs shrink-0 self-start sm:self-auto"
                >
                  <ExternalLink size={12} />
                  <span>Open in Obsidian</span>
                </button>
              )}
            </div>
          )}

          {/* Sleek Workspace Banner for Notion */}
          {integration.id.includes('notion') && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-primary/5 rounded-xl border border-primary/20 gap-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-5 h-5 rounded bg-black text-white flex items-center justify-center font-bold text-xs shrink-0">
                  N
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-ink text-xs truncate">
                    Workspace: 🌐 {currentIntegration.authConfig?.workspaceName || 'Notion MCP Workspace'}
                  </div>
                  <div className="text-[11px] text-muted font-mono">
                    Endpoint: {currentIntegration.endpoint || 'https://mcp.notion.com/mcp'}
                  </div>
                </div>
              </div>

              <a
                href="https://www.notion.so"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-black hover:bg-zinc-800 text-white font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-xs shadow-2xs shrink-0 self-start sm:self-auto"
              >
                <ExternalLink size={12} />
                <span>Open in Notion</span>
              </a>
            </div>
          )}

          {/* Compact Connection Info Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-canvas-soft rounded-lg border border-hairline font-mono text-[11px] text-muted">
            <div className="flex items-center gap-1.5 min-w-0">
              <Server size={12} className="text-primary shrink-0" />
              <span className="text-ink truncate">{currentIntegration.endpoint}</span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="flex items-center gap-1 text-semantic-success">
                <Activity size={11} />
                <span>{currentIntegration.latencyMs}ms</span>
              </span>
              <span className="uppercase text-ink font-semibold">
                {currentIntegration.transport || 'stdio'}
              </span>
            </div>
          </div>

          {/* Exposed Tools List */}
          <div className="space-y-2 pt-1">
            <div className="text-[11px] font-mono font-semibold uppercase tracking-caption text-muted flex items-center justify-between">
              <span>Available Tools ({currentIntegration.tools.length})</span>
              <button
                type="button"
                onClick={async () => {
                  setIsSyncing(true)
                  await discoverTools(currentIntegration.id)
                  setIsSyncing(false)
                }}
                disabled={isSyncing}
                className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={11} className={isSyncing ? 'animate-spin' : ''} />
                <span>{isSyncing ? 'Syncing...' : 'Sync Tools (tools/list)'}</span>
              </button>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {currentIntegration.tools.map((tool) => (
                <div
                  key={tool.name}
                  className="p-2.5 rounded-lg bg-canvas border border-hairline space-y-1"
                >
                  <div className="flex items-center justify-between gap-2 font-mono">
                    <span className="font-semibold text-ink flex items-center gap-1.5 text-xs">
                      <Terminal size={12} className="text-primary" />
                      <span>{tool.name}</span>
                    </span>
                    <span
                      className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-semibold ${
                        tool.readOnly
                          ? 'bg-primary/10 text-primary'
                          : 'bg-semantic-success/10 text-semantic-success'
                      }`}
                    >
                      {tool.readOnly ? 'read' : 'write'}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted leading-relaxed">
                    {tool.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <ModalFooter>
            <button
              type="button"
              onClick={() => onTest(integration.id)}
              disabled={isTesting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-canvas-soft hover:bg-canvas text-xs font-semibold text-ink border border-hairline rounded-lg transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
            >
              {isTesting ? (
                <Zap size={13} className="animate-spin text-primary" />
              ) : (
                <Activity size={13} className="text-semantic-success" />
              )}
              <span>{isTesting ? 'Pinging...' : 'Test Ping'}</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-primary hover:bg-primary/90 text-xs font-semibold text-canvas rounded-lg shadow-xs cursor-pointer transition-colors flex items-center gap-1"
            >
              <Check size={13} />
              <span>Done</span>
            </button>
          </ModalFooter>
        </div>
      )}
    </Modal>
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
