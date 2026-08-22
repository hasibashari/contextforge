import React, { useState } from 'react'
import {
  CheckCircle2,
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
  Folder,
  ExternalLink,
  RefreshCw,
} from 'lucide-react'
import type { Integration } from '@/shared/types/workspace'
import { obsidianBridgeService } from '@/shared/services/obsidianBridge.service'
import { useWorkspace } from '@/shared/context'
import {
  Modal,
  ModalHeader,
  ModalFooter,
  StatusPill,
  IntegrationIconBox,
  Button,
  Input,
  Select,
  Textarea,
  FormField,
  Badge,
} from '@/shared/components'

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
  const { integrations, discoverTools } = useWorkspace()
  const currentIntegration =
    integrations.find((i) => i.id === integration.id) || integration

  const [isEditing, setIsEditing] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  const [formData, setFormData] = useState({
    name: integration.name,
    description: integration.description,
    endpoint: integration.endpoint,
    transport: integration.transport || 'stdio',
    apiKey: 'sec_live_mcp_9a4f21e08cb4418a',
  })

  const [selectedFolder, setSelectedFolder] = useState(
    currentIntegration.targetBinding?.folderScope ||
      obsidianBridgeService.getPairedDirectoryHandle()?.name ||
      '',
  )

  const isConnected = currentIntegration.status === 'connected'

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    onSaveConfig?.(integration.id, {
      name: formData.name,
      description: formData.description,
      endpoint: formData.endpoint,
      transport: formData.transport,
      targetBinding: integration.id.includes('obsidian')
        ? {
            folderScope: selectedFolder,
            defaultOutputPath: '',
          }
        : currentIntegration.targetBinding,
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
          <Badge variant="primary" size="xs">
            {currentIntegration.authType}
          </Badge>
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
        <Button
          variant="secondary"
          size="xs"
          leftIcon={<RotateCcw size={13} />}
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
        >
          Cancel
        </Button>
      )
    }

    return (
      <div className="flex items-center gap-1.5">
        <Button
          variant="secondary"
          size="xs"
          leftIcon={<Edit3 size={13} />}
          onClick={() => setIsEditing(true)}
          title="Edit connector configuration"
        >
          Edit
        </Button>

        {onToggleConnect && isConnected && (
          <Button
            variant="danger"
            size="xs"
            leftIcon={<Unlink size={13} />}
            onClick={() => onToggleConnect(integration.id)}
            title="Disconnect connector"
          >
            Disconnect
          </Button>
        )}

        {onToggleConnect && !isConnected && (
          <Button
            variant="primary"
            size="xs"
            leftIcon={<Plus size={13} />}
            onClick={() => onToggleConnect(integration.id)}
            title="Connect MCP Server"
          >
            Connect
          </Button>
        )}
      </div>
    )
  }

  return (
    <Modal isOpen={true} onClose={onClose} size="3xl">
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
            <FormField label="Connector Name" required>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </FormField>

            <FormField label="Transport Protocol">
              <Select
                value={formData.transport}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    transport: e.target.value as 'stdio' | 'sse' | 'rest',
                  })
                }
                options={[
                  { label: 'stdio (Local Subprocess)', value: 'stdio' },
                  { label: 'sse (Server-Sent Events)', value: 'sse' },
                  { label: 'rest (HTTP Webhook API)', value: 'rest' },
                ]}
              />
            </FormField>
          </div>

          <FormField label="Endpoint Host / URI" required>
            <Input
              variant="mono"
              value={formData.endpoint}
              onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
              required
              placeholder="e.g. http://localhost:27123/mcp/obsidian"
            />
          </FormField>

          {/* Obsidian Connected Folder Configuration in Edit Mode */}
          {integration.id.includes('obsidian') && (
            <div className="p-3.5 bg-[#7c3aed]/5 rounded-xl border border-[#7c3aed]/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-semibold text-ink text-xs">
                  <Folder size={14} className="text-[#7c3aed]" />
                  <span>Connected Obsidian Folder</span>
                </div>
                {selectedFolder && (
                  <Badge variant="success" size="xs">
                    ✓ Connected
                  </Badge>
                )}
              </div>

              <div className="p-3 bg-canvas rounded-xl border border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#7c3aed]/10 text-[#7c3aed] flex items-center justify-center shrink-0">
                    <Folder size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-ink text-xs truncate">
                      {selectedFolder ? `📁 ${selectedFolder}` : 'No folder selected'}
                    </div>
                    <div className="text-[11px] text-muted font-sans truncate">
                      {selectedFolder
                        ? 'Notes will be saved directly into this folder'
                        : 'Click the button to select an Obsidian folder'}
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  leftIcon={<Folder size={12} />}
                  onClick={async () => {
                    const res =
                      await obsidianBridgeService.requestVaultDirectory('', '')
                    if (res) {
                      setSelectedFolder(res.handle.name)
                    }
                  }}
                  className="shrink-0"
                >
                  Change Folder
                </Button>
              </div>
            </div>
          )}

          <FormField label="Description">
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </FormField>

          <FormField
            label="API Key / Secret Token"
            badge={
              <Badge variant="success" size="xs" icon={<Lock size={10} />}>
                Encrypted
              </Badge>
            }
          >
            <Input
              type="password"
              variant="mono"
              value={formData.apiKey}
              onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
              allowToggleVisibility
            />
          </FormField>

          {/* Save Buttons */}
          <ModalFooter className="justify-end">
            <Button type="button" variant="ghost" size="xs" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" leftIcon={<Save size={13} />}>
              Save Configuration
            </Button>
          </ModalFooter>
        </form>
      ) : (
        /* VIEW OVERVIEW */
        <div className="space-y-3.5 text-xs">
          <p className="text-body leading-relaxed text-xs">
            {integration.description}
          </p>

          {/* Storage & Mount Banner for Obsidian */}
          {integration.id.includes('obsidian') && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-[#7c3aed]/5 rounded-xl border border-[#7c3aed]/20 gap-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <Folder size={16} className="text-[#7c3aed]" />
                <div className="min-w-0">
                  <div className="font-semibold text-ink text-xs truncate">
                    Connected Folder: 📁 {currentIntegration.targetBinding?.folderScope || obsidianBridgeService.getPairedDirectoryHandle()?.name || 'Selected Folder'}
                  </div>
                  <div className="text-[11px] text-muted font-mono">
                    Notes are automatically saved directly into this folder
                  </div>
                </div>
              </div>

              <Button
                variant="purple"
                size="xs"
                leftIcon={<ExternalLink size={12} />}
                onClick={() => {
                  const targetFolder =
                    currentIntegration.targetBinding?.folderScope || ''
                  obsidianBridgeService.openInObsidianApp(targetFolder, '')
                }}
                className="shrink-0 self-start sm:self-auto"
              >
                Open in Obsidian
              </Button>
            </div>
          )}

          {/* Workspace Banner for Notion */}
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
          <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 bg-canvas-soft rounded-xl border border-hairline font-mono text-[11px] text-muted">
            <div className="flex items-center gap-2 min-w-0">
              <Server size={13} className="text-primary shrink-0" />
              <span className="text-ink truncate font-medium">{currentIntegration.endpoint}</span>
            </div>
            <div className="flex items-center gap-3.5 shrink-0">
              <span className="flex items-center gap-1.5 text-semantic-success font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-semantic-success animate-pulse" />
                <span>{currentIntegration.latencyMs}ms</span>
              </span>
              <Badge variant="mono" size="xs">
                {currentIntegration.transport || 'stdio'}
              </Badge>
            </div>
          </div>

          {/* Exposed Tools List */}
          <div className="space-y-2.5 pt-1">
            <div className="text-[11px] font-mono font-semibold uppercase tracking-caption text-muted flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-ink">
                <span>Exposed Server Tools</span>
                <Badge variant="primary" size="xs">
                  {currentIntegration.tools.length}
                </Badge>
              </span>
              <Button
                variant="outline"
                size="xs"
                isLoading={isSyncing}
                leftIcon={<RefreshCw size={11} />}
                onClick={async () => {
                  setIsSyncing(true)
                  await discoverTools(currentIntegration.id)
                  setIsSyncing(false)
                }}
                disabled={isSyncing}
              >
                {isSyncing ? 'Syncing...' : 'Sync Tools (tools/list)'}
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {currentIntegration.tools.map((tool) => (
                <div
                  key={tool.name}
                  className="p-3 rounded-xl bg-canvas border border-hairline hover:border-primary/40 hover:bg-canvas-soft/40 transition-all flex flex-col justify-between space-y-2 shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-1.5 font-mono">
                    <span className="font-semibold text-ink flex items-center gap-1.5 text-xs truncate">
                      <Terminal size={12} className="text-primary shrink-0" />
                      <span className="truncate">{tool.name}</span>
                    </span>
                    <Badge variant={tool.readOnly ? 'primary' : 'success'} size="xs">
                      {tool.readOnly ? 'read' : 'write'}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted leading-relaxed line-clamp-2">
                    {tool.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <ModalFooter>
            <Button
              variant="secondary"
              size="sm"
              isLoading={isTesting}
              leftIcon={isTesting ? <Zap size={13} /> : <Activity size={13} className="text-semantic-success" />}
              onClick={() => onTest(integration.id)}
              disabled={isTesting}
            >
              {isTesting ? 'Pinging...' : 'Test Ping'}
            </Button>

            <Button variant="primary" size="sm" leftIcon={<Check size={13} />} onClick={onClose}>
              Done
            </Button>
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
