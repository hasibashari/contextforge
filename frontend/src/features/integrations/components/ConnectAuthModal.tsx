import React, { useState } from 'react'
import {
  Folder,
  Zap,
  Terminal,
  Cpu,
  ExternalLink,
  Sparkles,
  BookOpen,
} from 'lucide-react'
import type { Integration } from '@/shared/types/workspace'
import {
  Modal,
  ModalHeader,
  ModalFooter,
  IntegrationIconBox,
  Button,
  Input,
  Select,
  FormField,
  Badge,
} from '@/shared/components'
import { useWorkspace } from '@/shared/mock'
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
    knowledgeSources,
  } = useWorkspace()

  const availableVaultSources = knowledgeSources.filter(
    (s) =>
      s.type === 'obsidian_vault' ||
      s.type === 'local_folder' ||
      Boolean(s.location),
  )

  const initialSourceId =
    availableVaultSources.find(
      (s) =>
        s.name === integration?.targetBinding?.folderScope ||
        s.location === integration?.targetBinding?.folderScope,
    )?.id || (availableVaultSources.length > 0 ? availableVaultSources[0].id : '')

  const [vaultName, setVaultName] = useState<string>(
    (integration?.authConfig?.vaultName as string) || 'Obsidian Vault',
  )
  const [selectedSourceId, setSelectedSourceId] = useState<string>(initialSourceId)
  const [isSubmitting, setIsSubmitting] = useState(false)

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

      await updateConnectorConfig(integration.id, {
        status: 'connected',
        endpoint: 'https://mcp.notion.com/mcp',
        transport: 'streamable_http',
        authType: 'oauth',
        authConfig: {
          workspaceName: 'Notion Workspace',
        },
      })

      await discoverTools(integration.id)
      await refreshIntegrations()

      showToast(
        '✨ Opening Notion authorization in browser & connecting workspace...',
        'success',
      )
      onSuccess?.()
      onClose()
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Failed to open Notion authorization'
      showToast(msg, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ----------------------------------------------------
  // Obsidian: Local Vault stdio Binding
  // ----------------------------------------------------
  const handleObsidianConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const activeVaultName = vaultName.trim() || 'Obsidian Vault'
      const matchedSource = availableVaultSources.find(
        (s) => s.id === selectedSourceId,
      )
      const folderScopeName = matchedSource?.name || ''

      await updateConnectorConfig(integration.id, {
        status: 'connected',
        endpoint: `npx -y @modelcontextprotocol/server-obsidian "${activeVaultName}"`,
        authConfig: {
          vaultName: activeVaultName,
        },
        targetBinding: {
          folderScope: folderScopeName,
          defaultOutputPath: 'Drafts',
        },
      })

      obsidianBridgeService.setPairedVault(activeVaultName, folderScopeName)

      await discoverTools(integration.id)
      await refreshIntegrations()

      showToast(
        `✨ Successfully paired Obsidian vault "${activeVaultName}" (Source: ${folderScopeName || 'Root'})!`,
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
      await updateConnectorConfig(integration.id, {
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
            ? 'Pair local Obsidian vault bridge via Model Context Protocol stdio process'
            : `Establish MCP connection with ${integration.name}`
        }
        onClose={onClose}
      />

      <div className="space-y-4 text-xs font-mono">
        {/* Notion Flow */}
        {isNotion && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-canvas-soft border border-hairline space-y-2">
              <div className="flex items-center gap-2 font-semibold text-ink text-xs">
                <div className="w-5 h-5 rounded bg-black text-white flex items-center justify-center font-bold text-xs shrink-0">
                  N
                </div>
                <span>Notion MCP Workspace Authorization</span>
              </div>
              <p className="text-muted text-[11px] font-sans leading-relaxed">
                Connect your Notion workspace directly. Clicking{' '}
                <strong className="text-ink">Connect in Browser</strong> will
                open Notion&apos;s official authorization page in your browser
                where you can select workspace access for ContextForge.
              </p>
            </div>

            <ModalFooter className="justify-end pt-2">
              <Button type="button" variant="ghost" size="xs" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="dark"
                size="sm"
                isLoading={isSubmitting}
                leftIcon={<ExternalLink size={13} />}
                onClick={handleNotionDirectConnect}
              >
                {isSubmitting ? 'Opening Browser...' : 'Connect in Browser'}
              </Button>
            </ModalFooter>
          </div>
        )}

        {/* Obsidian Flow */}
        {isObsidian && (
          <form onSubmit={handleObsidianConnect} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-canvas-soft border border-hairline space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-ink text-xs">
                <Folder size={14} className="text-[#7c3aed]" />
                <span>Local Vault Binding</span>
              </div>
              <p className="text-muted text-[11px] font-sans leading-relaxed">
                Connect your local Obsidian Vault folder. ContextForge will
                execute the official stdio bridge to read backlinks and format
                atomic Markdown notes with frontmatter.
              </p>
            </div>

            {/* Field 1: Obsidian Desktop App Vault Name */}
            <FormField
              label={
                <span className="flex items-center gap-1.5">
                  <BookOpen size={13} className="text-[#7c3aed]" />
                  <span>Obsidian Desktop Vault Name</span>
                </span>
              }
              badge={<span className="text-muted">Name registered in Obsidian App</span>}
              required
            >
              <Input
                variant="mono"
                value={vaultName}
                onChange={(e) => setVaultName(e.target.value)}
                placeholder="e.g. Obsidian Vault"
                required
              />
            </FormField>

            {/* Field 2: Target Knowledge Source (Subfolder Scope) */}
            {availableVaultSources.length > 0 ? (
              <FormField
                label={
                  <span className="flex items-center gap-1.5">
                    <Folder size={13} className="text-[#7c3aed]" />
                    <span>Mount to Knowledge Source</span>
                  </span>
                }
                badge={<Badge variant="primary" size="xs">✓ Subfolder Scope</Badge>}
              >
                <Select
                  variant="mono"
                  value={selectedSourceId}
                  onChange={(e) => setSelectedSourceId(e.target.value)}
                  options={availableVaultSources.map((ks) => ({
                    label: `📚 ${ks.name} (${ks.filesCount} files)`,
                    value: ks.id,
                  }))}
                />
              </FormField>
            ) : (
              <div className="p-3.5 bg-canvas-soft rounded-xl border border-hairline text-center space-y-1">
                <p className="text-ink font-semibold text-xs">
                  No Knowledge Sources Available
                </p>
                <p className="text-muted text-[11px] font-sans">
                  Please add an Obsidian Vault or folder in the Knowledge Base first before connecting the bridge.
                </p>
              </div>
            )}

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
                disabled={isSubmitting || availableVaultSources.length === 0}
              >
                {isSubmitting ? 'Pairing...' : 'Pair & Connect Vault'}
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
