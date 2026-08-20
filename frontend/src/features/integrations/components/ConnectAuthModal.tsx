import React, { useState } from 'react'
import {
  Folder,
  Zap,
  Terminal,
  Globe,
  Cpu,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import type { Integration } from '@/shared/types/workspace'
import { Modal, ModalHeader, ModalFooter } from '@/shared/components/ui/Modal'
import { IntegrationIconBox } from '@/shared/components/ui/IconBox'
import { useWorkspace } from '@/shared/mock'
import { ecosystemApi } from '@/shared/api/ecosystemApi'

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
  const { updateConnectorConfig, discoverTools, refreshIntegrations, showToast } = useWorkspace()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [vaultPath, setVaultPath] = useState(
    integration?.targetBinding?.folderScope || '~/Documents/ObsidianVault',
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
      // 1. Fetch official Notion authorization URL from backend
      const res = await ecosystemApi.getNotionOAuthUrl().catch(() => ({
        configured: false,
        authUrl:
          'https://api.notion.com/v1/oauth/authorize?client_id=contextforge-workspace&response_type=code&owner=user&redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fapi%2Fecosystem%2Foauth%2Fnotion%2Fcallback',
      }))

      const targetUrl =
        res.authUrl ||
        'https://api.notion.com/v1/oauth/authorize?client_id=contextforge-workspace&response_type=code&owner=user&redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fapi%2Fecosystem%2Foauth%2Fnotion%2Fcallback'

      // 2. Direct browser opening for Notion authorization
      window.open(targetUrl, '_blank', 'noopener,noreferrer')

      // 3. Update PostgreSQL integration status to connected
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
      if (!vaultPath.trim()) {
        showToast('Please specify a valid Obsidian Vault path', 'error')
        setIsSubmitting(false)
        return
      }

      await updateConnectorConfig(integration.id, {
        status: 'connected',
        endpoint: `npx -y @modelcontextprotocol/server-obsidian ${vaultPath.trim()}`,
        targetBinding: {
          folderScope: vaultPath.trim(),
        },
      })

      await discoverTools(integration.id)
      await refreshIntegrations()

      showToast(
        `Successfully paired local Obsidian vault at ${vaultPath.trim()}!`,
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
        {/* Notion: Direct Browser Authorization Design */}
        {isNotion && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-canvas-soft border border-hairline space-y-3">
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
                where you can grant workspace access to ContextForge.
              </p>

              <div className="space-y-2 pt-2 font-sans text-[11px] border-t border-hairline">
                <div className="flex items-start gap-2 text-ink">
                  <ShieldCheck
                    size={14}
                    className="text-semantic-success shrink-0 mt-0.5"
                  />
                  <span>
                    <strong className="font-semibold">
                      Direct Browser Login:
                    </strong>{' '}
                    Authenticate directly on Notion. ContextForge never asks for
                    or stores your account password.
                  </span>
                </div>
                <div className="flex items-start gap-2 text-ink">
                  <Globe size={14} className="text-primary shrink-0 mt-0.5" />
                  <span>
                    <strong className="font-semibold">
                      Streamable HTTP MCP:
                    </strong>{' '}
                    Communicates with Notion&apos;s live MCP server to query
                    databases and format page blocks.
                  </span>
                </div>
                <div className="flex items-start gap-2 text-ink">
                  <CheckCircle2
                    size={14}
                    className="text-primary shrink-0 mt-0.5"
                  />
                  <span>
                    <strong className="font-semibold">Granular Access:</strong>{' '}
                    You choose exactly which pages and databases are shared with
                    ContextForge agents.
                  </span>
                </div>
              </div>
            </div>

            <ModalFooter className="justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs text-body hover:text-ink cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleNotionDirectConnect}
                disabled={isSubmitting}
                className="px-4 py-2 bg-black hover:bg-zinc-800 text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? (
                  <Zap size={13} className="animate-spin text-primary" />
                ) : (
                  <ExternalLink size={13} />
                )}
                <span>
                  {isSubmitting
                    ? 'Opening Browser...'
                    : 'Connect in Browser'}
                </span>
              </button>
            </ModalFooter>
          </div>
        )}

        {/* Obsidian: Local Vault stdio Binding */}
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

            <div className="space-y-1.5">
              <label className="text-ink font-semibold flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Terminal size={13} className="text-[#7c3aed]" />
                  <span>Obsidian Vault Absolute Directory</span>
                </span>
              </label>
              <input
                type="text"
                value={vaultPath}
                onChange={(e) => setVaultPath(e.target.value)}
                required
                className="w-full px-3 py-2 bg-canvas border border-hairline rounded-lg text-ink font-mono focus:outline-none focus:border-primary text-xs"
              />
            </div>

            <ModalFooter className="justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs text-body hover:text-ink cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-primary hover:bg-primary-active text-on-primary text-xs font-semibold rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <Zap size={13} className={isSubmitting ? 'animate-spin' : ''} />
                <span>
                  {isSubmitting ? 'Pairing...' : 'Pair & Connect Vault'}
                </span>
              </button>
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

            <div className="space-y-1.5">
              <label className="text-ink font-semibold flex items-center justify-between">
                <span>Endpoint / Command</span>
              </label>
              <input
                type="text"
                value={integration.endpoint}
                readOnly
                className="w-full px-3 py-2 bg-canvas-soft border border-hairline rounded-lg text-muted font-mono text-xs cursor-not-allowed"
              />
            </div>

            <ModalFooter className="justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs text-body hover:text-ink cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-primary hover:bg-primary-active text-on-primary text-xs font-semibold rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <Zap size={13} className={isSubmitting ? 'animate-spin' : ''} />
                <span>
                  {isSubmitting
                    ? 'Connecting...'
                    : `Connect ${integration.name}`}
                </span>
              </button>
            </ModalFooter>
          </form>
        )}

        {/* Exposed Tools Scope Summary */}
        <div className="space-y-1.5 pt-1 border-t border-hairline/60">
          <div className="text-[11px] font-mono font-semibold uppercase tracking-caption text-muted flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Sparkles size={11} className="text-primary" />
              <span>Exposed MCP Tools</span>
            </span>
            <span>({integration.tools?.length || 0} Tools)</span>
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
