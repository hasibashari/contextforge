import React, { useState } from 'react'
import {
  Folder,
  Zap,
  Terminal,
  Cpu,
  ExternalLink,
  Sparkles,
} from 'lucide-react'
import type { Integration } from '@/shared/types/workspace'
import {
  Modal,
  ModalHeader,
  ModalFooter,
  IntegrationIconBox,
  Button,
  Input,
  FormField,
  Badge,
} from '@/shared/components'
import { useWorkspace } from '@/shared/context'
import { ecosystemApi } from '@/shared/api/ecosystemApi'
import { obsidianBridgeService } from '@/shared/services/obsidianBridge.service'

interface ConnectAuthModalProps {
  integration: Integration | null
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export const ConnectAuthModal: React.FC<ConnectAuthModalProps> = ({
  integration,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const {
    updateConnectorConfig,
    discoverTools,
    refreshIntegrations,
    showToast,
  } = useWorkspace()

  const [targetFolder, setTargetFolder] = useState<string>(
    (integration?.targetBinding?.defaultOutputPath as string) ||
      (integration?.targetBinding?.folderScope as string) ||
      'Notes',
  )
  const [isFolderHandleActive, setIsFolderHandleActive] = useState<boolean>(
    Boolean(obsidianBridgeService.getPairedDirectoryHandle()),
  )
  const [pairedDiskFolderName, setPairedDiskFolderName] = useState<string>(
    obsidianBridgeService.getPairedDirectoryHandle()?.name || '',
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notionWorkspace] = useState<string>(
    (integration?.authConfig?.workspaceName as string) || 'Notion Workspace',
  )

  if (!isOpen || !integration) return null

  const isNotion =
    integration.id.includes('notion') ||
    integration.name.toLowerCase().includes('notion')
  const isObsidian =
    integration.id.includes('obsidian') ||
    integration.name.toLowerCase().includes('obsidian')

  // ----------------------------------------------------
  // Notion: Direct Browser Authorization Flow
  // ----------------------------------------------------

  const handleNotionDirectConnect = async () => {
    setIsSubmitting(true)
    try {
      const res = await ecosystemApi.getNotionOAuthUrl().catch(() => ({
        configured: false,
        authUrl:
          'https://api.notion.com/v1/oauth/authorize?client_id=contextforge-workspace&response_type=code&owner=user&redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fapi%2Fecosystem%2Foauth%2Fnotion%2Fcallback',
      }))

      const targetUrl =
        res.authUrl ||
        'https://api.notion.com/v1/oauth/authorize?client_id=contextforge-workspace&response_type=code&owner=user&redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fapi%2Fecosystem%2Foauth%2Fnotion%2Fcallback'

      window.open(targetUrl, '_blank', 'noopener,noreferrer')

      updateConnectorConfig(integration.id, {
        status: 'connected',
        endpoint: 'https://mcp.notion.com/mcp',
        transport: 'streamable_http',
        authType: 'oauth',
        authConfig: {
          workspaceName: notionWorkspace.trim() || 'Notion Workspace',
        },
      })

      await discoverTools(integration.id)
      await refreshIntegrations()

      showToast(
        `✨ Successfully initiated Notion MCP authorization!`,
        'success',
      )
      onSuccess?.()
      onClose()
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Failed to connect Notion workspace'
      showToast(msg, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ----------------------------------------------------
  // Obsidian: Local Directory Picker (HTML5 File System Access)
  // ----------------------------------------------------
  const handlePickLocalFolder = async () => {
    try {
      const res = await obsidianBridgeService.requestVaultDirectory('', '')
      if (res) {
        setIsFolderHandleActive(true)
        setPairedDiskFolderName(res.handle.name)
        setTargetFolder(res.handle.name)
        obsidianBridgeService.setPairedVault(res.handle.name, '')
        showToast(
          `📁 Folder connected: "${res.handle.name}" (${res.files.length} .md files)`,
          'success',
        )
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to connect folder'
      showToast(msg, 'error')
    }
  }

  // ----------------------------------------------------
  // Obsidian: Local Vault stdio Binding
  // ----------------------------------------------------
  const handleObsidianConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const activeFolder =
        pairedDiskFolderName || targetFolder.trim() || 'Obsidian Vault'

      updateConnectorConfig(integration.id, {
        status: 'connected',
        endpoint: 'npx -y @modelcontextprotocol/server-obsidian',
        authConfig: {
          vaultName: activeFolder,
          vaultPath: activeFolder,
        },
        targetBinding: {
          folderScope: activeFolder,
          defaultOutputPath: '',
        },
      })

      obsidianBridgeService.setPairedVault(activeFolder, '')

      await discoverTools(integration.id)
      await refreshIntegrations()

      showToast(
        `✨ Successfully connected Obsidian folder "${activeFolder}"!`,
        'success',
      )
      onSuccess?.()
      onClose()
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Connection verification failed'
      showToast(msg, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ----------------------------------------------------
  // Generic MCP Server Connection
  // ----------------------------------------------------
  const handleGenericConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      updateConnectorConfig(integration.id, {
        status: 'connected',
      })

      await discoverTools(integration.id)
      await refreshIntegrations()

      showToast(`✨ Connected ${integration.name}!`, 'success')
      onSuccess?.()
      onClose()
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Connection verification failed'
      showToast(msg, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalHeader
        icon={<IntegrationIconBox integration={integration} size="md" />}
        title={`Connect ${integration.name}`}
        subtitle={
          isNotion
            ? 'Authorize Notion Model Context Protocol workspace'
            : isObsidian
            ? 'Select an Obsidian folder for automated note synchronization'
            : `Establish MCP connection with ${integration.name}`
        }
        onClose={onClose}
      />

      <div className="space-y-4 text-xs font-mono">
        {/* Notion Flow */}
        {isNotion && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-canvas-soft border border-hairline space-y-3">
              <div className="flex items-center gap-2.5 font-semibold text-ink text-xs">
                <div className="w-6 h-6 rounded-md bg-black text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                  N
                </div>
                <div>
                  <div className="text-xs font-semibold text-ink">Notion Workspace Authorization</div>
                  <div className="text-[11px] text-muted font-normal font-sans">Official OAuth MCP Integration</div>
                </div>
              </div>

              <p className="text-muted text-xs font-sans leading-relaxed pt-1">
                Authorize ContextForge to connect with your Notion workspace. Clicking{' '}
                <strong className="text-ink font-semibold">Connect in Browser</strong> will open Notion&apos;s official authorization window to select pages and databases.
              </p>
            </div>

            <ModalFooter className="justify-end pt-2">
              <Button type="button" variant="ghost" size="xs" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                isLoading={isSubmitting}
                leftIcon={<ExternalLink size={13} />}
                onClick={handleNotionDirectConnect}
              >
                {isSubmitting ? 'Connecting...' : 'Connect in Browser'}
              </Button>
            </ModalFooter>
          </div>
        )}

        {/* Obsidian Flow */}
        {isObsidian && (
          <form onSubmit={handleObsidianConnect} className="space-y-4">
            <div className="p-4 rounded-xl bg-[#7c3aed]/5 border border-[#7c3aed]/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-ink text-xs">
                  <Folder size={16} className="text-[#7c3aed]" />
                  <span>Select Obsidian Folder</span>
                </div>
                {isFolderHandleActive && (
                  <Badge variant="success" size="xs">
                    ✓ Folder Connected
                  </Badge>
                )}
              </div>
              <p className="text-muted text-[11px] font-sans leading-relaxed">
                Choose an Obsidian note directory on your computer. Notes created by
                Action Agent will be written directly into this folder.
              </p>

              {/* Folder Selector Status & Action */}
              <div className="p-3.5 bg-canvas rounded-xl border border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      isFolderHandleActive
                        ? 'bg-semantic-success/10 text-semantic-success'
                        : 'bg-[#7c3aed]/10 text-[#7c3aed]'
                    }`}
                  >
                    <Folder size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-ink text-xs truncate">
                      {isFolderHandleActive
                        ? `📁 ${pairedDiskFolderName}`
                        : targetFolder.trim()
                        ? `📁 ${targetFolder.trim()}`
                        : 'No folder selected yet'}
                    </div>
                    <div className="text-[11px] text-muted font-sans truncate">
                      {isFolderHandleActive || targetFolder.trim()
                        ? 'Notes will be saved directly to this folder'
                        : 'Click the button to select your Obsidian folder'}
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  variant={isFolderHandleActive ? 'outline' : 'primary'}
                  size="sm"
                  leftIcon={<Folder size={13} />}
                  onClick={handlePickLocalFolder}
                  className="shrink-0"
                >
                  {isFolderHandleActive
                    ? 'Change Folder'
                    : 'Select Folder on Disk'}
                </Button>
              </div>

              {!isFolderHandleActive && (
                <FormField label="Or Vault Name / Folder Scope">
                  <Input
                    value={targetFolder}
                    onChange={(e) => setTargetFolder(e.target.value)}
                    placeholder="e.g. My Obsidian Notes"
                  />
                </FormField>
              )}
            </div>

            <ModalFooter className="justify-end pt-2">
              <Button type="button" variant="ghost" size="xs" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSubmitting}
                leftIcon={<Zap size={13} />}
                disabled={isSubmitting || (!isFolderHandleActive && !targetFolder.trim())}
              >
                {isSubmitting ? 'Connecting...' : 'Connect Folder'}
              </Button>
            </ModalFooter>
          </form>
        )}

        {/* Generic MCP Server Connection */}
        {!isNotion && !isObsidian && (
          <form onSubmit={handleGenericConnect} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-canvas-soft border border-hairline space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-ink text-xs">
                <Cpu size={14} className="text-primary" />
                <span>MCP Server Connection</span>
              </div>
              <p className="text-muted text-[11px] font-sans leading-relaxed">
                Connect and activate this Model Context Protocol server to
                expose tools to workspace agents.
              </p>
            </div>

            <FormField label="Endpoint / Command">
              <Input
                variant="mono"
                value={integration.endpoint}
                readOnly
                disabled
              />
            </FormField>

            <ModalFooter className="justify-end pt-2">
              <Button type="button" variant="ghost" size="xs" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSubmitting}
                leftIcon={<Zap size={13} />}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Connecting...' : `Connect ${integration.name}`}
              </Button>
            </ModalFooter>
          </form>
        )}

        {/* Exposed Tools Scope Summary */}
        <div className="space-y-1.5 pt-1 border-t border-hairline/60">
          <div className="text-[11px] font-mono font-semibold uppercase tracking-caption text-muted flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Sparkles size={11} className="text-primary" />
              <span>Exposed Server Tools</span>
            </span>
            <Badge variant="neutral" size="xs">
              {integration.tools?.length || 0} Tools
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {integration.tools?.map((tool) => (
              <div
                key={tool.name}
                className="p-2 rounded-lg bg-canvas border border-hairline flex flex-col justify-between"
              >
                <div className="font-semibold text-ink text-[11px] flex items-center gap-1">
                  <Terminal size={10} className="text-primary shrink-0" />
                  <span className="truncate">{tool.name}</span>
                </div>
                <div className="text-[10px] text-muted truncate font-sans mt-0.5">
                  {tool.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  )
}
