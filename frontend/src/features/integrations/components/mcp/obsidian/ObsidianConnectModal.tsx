import React, { useState } from 'react'
import { Folder, Zap } from 'lucide-react'
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
} from '@/shared'
import { useWorkspace } from '@/shared'
import { obsidianBridgeService } from '@/shared/services/obsidianBridge.service'
import { McpToolsPreview } from '../common/McpToolsPreview'

export interface ObsidianConnectModalProps {
  integration: Integration
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export const ObsidianConnectModal: React.FC<ObsidianConnectModalProps> = ({
  integration,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { updateConnectorConfig, discoverTools, refreshIntegrations, showToast } =
    useWorkspace()

  const getInitialObsidianPath = () => {
    if (integration.authConfig?.vaultPath) return integration.authConfig.vaultPath
    const endpoint = integration.endpoint || ''
    const match = endpoint.match(/(?:server-obsidian\s+)(.+)$/)
    if (match && match[1]) {
      return match[1].replace(/^["']|["']$/g, '').trim()
    }
    return (
      (integration.targetBinding?.folderScope as string) ||
      (integration.targetBinding?.defaultOutputPath as string) ||
      ''
    )
  }

  const [targetFolder, setTargetFolder] = useState<string>(getInitialObsidianPath)
  const [isFolderHandleActive, setIsFolderHandleActive] = useState<boolean>(
    Boolean(obsidianBridgeService.getPairedDirectoryHandle()),
  )
  const [pairedDiskFolderName, setPairedDiskFolderName] = useState<string>(
    obsidianBridgeService.getPairedDirectoryHandle()?.name || '',
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  const handleObsidianConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const activePath =
        targetFolder.trim() ||
        (integration.authConfig?.vaultPath as string) ||
        ''
      const activeName =
        pairedDiskFolderName ||
        targetFolder.trim() ||
        (integration.authConfig?.vaultName as string) ||
        'Obsidian Vault'

      const endpoint = activePath
        ? `npx -y @modelcontextprotocol/server-obsidian "${activePath}"`
        : integration.endpoint || 'npx -y @modelcontextprotocol/server-obsidian'

      updateConnectorConfig(integration.id, {
        status: 'connected',
        endpoint,
        authConfig: {
          ...integration.authConfig,
          vaultName: activeName,
          vaultPath: activePath,
        },
        targetBinding: {
          folderScope: activeName,
          defaultOutputPath: activePath,
        },
      })

      obsidianBridgeService.setPairedVault(activeName, '')

      await discoverTools(integration.id)
      await refreshIntegrations()

      showToast(
        `✨ Successfully connected Obsidian folder "${activeName}"!`,
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalHeader
        icon={<IntegrationIconBox integration={integration} size="md" />}
        title={`Connect ${integration.name}`}
        subtitle="Select an Obsidian folder for automated note synchronization"
        onClose={onClose}
      />

      <div className="space-y-4 text-xs font-mono">
        <form onSubmit={handleObsidianConnect} className="space-y-4">
          <div className="p-4 rounded-2xl bg-surface-card border border-hairline hover:border-primary/40 transition-all space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-ink text-xs">
                <Folder size={16} className="text-primary" />
                <span>Select Obsidian Folder</span>
              </div>
              {isFolderHandleActive && (
                <Badge variant="success" size="xs">
                  ✓ Browser Storage Paired
                </Badge>
              )}
            </div>
            <p className="text-muted text-[11px] font-sans leading-relaxed">
              Connect your Obsidian Vault. You can pair your folder directly in the browser
              (HTML5 File System) and/or specify your local host path.
            </p>

            {/* Folder Selector Status & Action */}
            <div className="p-3.5 bg-surface-strong/60 rounded-xl border border-hairline hover:border-primary/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    isFolderHandleActive
                      ? 'bg-semantic-success/10 text-semantic-success'
                      : 'bg-primary-soft text-primary'
                  }`}
                >
                  <Folder size={18} />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-ink text-xs truncate">
                    {isFolderHandleActive
                      ? `📁 ${pairedDiskFolderName}`
                      : 'Pair Browser Folder (Auto-Save)'}
                  </div>
                  <div className="text-[11px] text-muted font-sans truncate">
                    {isFolderHandleActive
                      ? 'Browser will auto-save notes directly into this folder'
                      : 'Click to select folder from your Windows / Mac / Linux disk'}
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
                {isFolderHandleActive ? 'Change Folder' : 'Select Folder on Disk'}
              </Button>
            </div>

            {/* Optional Host / Server Disk Path */}
            <FormField label="Vault Disk Path">
              <Input
                value={targetFolder}
                onChange={(e) => setTargetFolder(e.target.value)}
                placeholder="e.g. C:\Users\Username\Documents\MyObsidianVault"
                className="font-mono text-xs"
              />
            </FormField>
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
              disabled={
                isSubmitting || (!isFolderHandleActive && !targetFolder.trim())
              }
            >
              {isSubmitting ? 'Connecting...' : 'Connect Folder'}
            </Button>
          </ModalFooter>
        </form>

        <McpToolsPreview tools={integration.tools} />
      </div>
    </Modal>
  )
}
