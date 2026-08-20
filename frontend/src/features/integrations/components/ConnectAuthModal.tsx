import React, { useState, useEffect } from 'react'
import {
  Key,
  Folder,
  Zap,
  Terminal,
  ExternalLink,
  ShieldCheck,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  Globe,
  Lock,
  AlertCircle,
  Loader2,
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
  const [authMethod, setAuthMethod] = useState<'oauth' | 'manual'>('oauth')
  const [showSecret, setShowSecret] = useState(false)

  // Real OAuth State from Backend
  const [oauthConfig, setOauthConfig] = useState<{
    configured: boolean
    authUrl: string
    message?: string
  } | null>(null)
  const [isLoadingOauthUrl, setIsLoadingOauthUrl] = useState(false)

  // Notion manual token state
  const [notionToken, setNotionToken] = useState('')
  const [customWorkspaceName, setCustomWorkspaceName] = useState('')

  // Obsidian state
  const [vaultPath, setVaultPath] = useState('~/Documents/ObsidianVault')

  const isNotion =
    integration?.id.includes('notion') ||
    integration?.name.toLowerCase().includes('notion')
  const isObsidian =
    integration?.id.includes('obsidian') ||
    integration?.name.toLowerCase().includes('obsidian')

  // Fetch real OAuth URL from backend when Notion modal opens
  useEffect(() => {
    let active = true
    if (isOpen && isNotion) {
      ecosystemApi
        .getNotionOAuthUrl()
        .then((res) => {
          if (!active) return
          setOauthConfig(res)
          if (!res.configured) {
            setAuthMethod('manual')
          }
        })
        .catch(() => {
          if (!active) return
          setOauthConfig({
            configured: false,
            authUrl: '',
            message: 'Could not connect to backend OAuth endpoint',
          })
          setAuthMethod('manual')
        })
        .finally(() => {
          if (active) {
            setIsLoadingOauthUrl(false)
          }
        })
    }
    return () => {
      active = false
    }
  }, [isOpen, isNotion])

  // Listen for real OAuth Popup Completion via window.postMessage
  useEffect(() => {
    const handleAuthMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'NOTION_AUTH_SUCCESS') {
        const wsName = event.data.workspaceName || 'Notion Workspace'
        showToast(`✨ Real Notion OAuth Connected to: "${wsName}"!`, 'success')
        await refreshIntegrations()
        onSuccess?.()
        onClose()
      } else if (event.data?.type === 'NOTION_AUTH_ERROR') {
        showToast(
          `Notion OAuth error: ${event.data.error || 'Authorization cancelled'}`,
          'error',
        )
        setIsSubmitting(false)
      }
    }

    window.addEventListener('message', handleAuthMessage)
    return () => window.removeEventListener('message', handleAuthMessage)
  }, [refreshIntegrations, onSuccess, onClose, showToast])

  if (!isOpen || !integration) return null

  // Trigger Real Notion OAuth Popup
  const handleLaunchNotionOAuth = () => {
    if (!oauthConfig?.configured || !oauthConfig.authUrl) {
      showToast(
        oauthConfig?.message || 'Notion OAuth is not configured in backend/.env',
        'info',
      )
      return
    }

    setIsSubmitting(true)
    const width = 600
    const height = 750
    const left = window.screenX + (window.outerWidth - width) / 2
    const top = window.screenY + (window.outerHeight - height) / 2

    const popup = window.open(
      oauthConfig.authUrl,
      'NotionOAuth',
      `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes`,
    )

    // Check if popup was blocked
    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      setIsSubmitting(false)
      showToast('Popup was blocked by your browser. Please allow popups for Notion authorization.', 'error')
    }
  }

  // Handle Manual Real Token Verification
  const handleManualTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (isNotion) {
        if (!notionToken.trim()) {
          showToast('Please enter your Notion Integration Token', 'error')
          setIsSubmitting(false)
          return
        }

        // Live verify token against real Notion API via backend
        const res = await ecosystemApi.verifyNotionToken(
          notionToken.trim(),
          customWorkspaceName.trim() || undefined,
        )

        await refreshIntegrations()
        showToast(
          `Successfully connected to real Notion workspace "${res.workspaceName}"!`,
          'success',
        )
        onSuccess?.()
        onClose()
      } else if (isObsidian) {
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
      }
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
            ? 'Authorize Notion Model Context Protocol server via Streamable HTTP (https://mcp.notion.com/mcp)'
            : isObsidian
            ? 'Pair local Obsidian vault bridge via Model Context Protocol stdio process'
            : `Establish MCP connection with ${integration.name}`
        }
        onClose={onClose}
      />

      <div className="space-y-4 text-xs font-mono">
        {/* Notion Authentication Flow */}
        {isNotion && (
          <div className="space-y-4">
            {/* Method Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-canvas-soft border border-hairline rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setAuthMethod('oauth')}
                className={`flex-1 py-1.5 px-3 rounded-lg font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  authMethod === 'oauth'
                    ? 'bg-ink text-canvas shadow-xs'
                    : 'text-muted hover:text-ink'
                }`}
              >
                <Globe size={13} />
                <span>Notion OAuth 2.0 (Real Flow)</span>
              </button>
              <button
                type="button"
                onClick={() => setAuthMethod('manual')}
                className={`flex-1 py-1.5 px-3 rounded-lg font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  authMethod === 'manual'
                    ? 'bg-ink text-canvas shadow-xs'
                    : 'text-muted hover:text-ink'
                }`}
              >
                <Key size={13} />
                <span>Integration Token (API Key)</span>
              </button>
            </div>

            {authMethod === 'oauth' ? (
              /* Real Notion OAuth Redirect UI */
              <div className="p-4 rounded-2xl bg-canvas border border-hairline shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-hairline/60 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center font-bold text-base shadow-xs">
                      N
                    </div>
                    <div>
                      <div className="font-semibold text-ink text-xs flex items-center gap-1">
                        <span>Notion 3-Legged OAuth 2.0</span>
                        <ShieldCheck size={13} className="text-semantic-success" />
                      </div>
                      <div className="text-[10px] text-muted font-mono">
                        Target MCP: https://mcp.notion.com/mcp
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                    Streamable HTTP
                  </span>
                </div>

                {isLoadingOauthUrl ? (
                  <div className="py-6 flex flex-col items-center justify-center gap-2 text-muted">
                    <Loader2 size={20} className="animate-spin text-primary" />
                    <span>Loading Notion OAuth configuration...</span>
                  </div>
                ) : oauthConfig?.configured ? (
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-canvas-soft border border-hairline space-y-2">
                      <div className="text-[11px] font-semibold text-ink flex items-center gap-1.5">
                        <CheckCircle2 size={13} className="text-semantic-success" />
                        <span>Real Notion Login & Consent Screen</span>
                      </div>
                      <p className="text-muted text-[11px] font-sans leading-relaxed">
                        Clicking the button below will open the official{' '}
                        <strong>Notion Authorization Window</strong>. You will be able to log in to
                        your real Notion account, select your workspace, and grant tool permissions.
                      </p>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleLaunchNotionOAuth}
                        disabled={isSubmitting}
                        className="w-full py-2.5 bg-ink hover:bg-black text-canvas text-xs font-semibold rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-2 transition-transform active:scale-[0.99] disabled:opacity-50"
                      >
                        <Globe size={14} className="text-primary" />
                        <span>
                          {isSubmitting ? 'Waiting for Notion Authorization...' : 'Authorize via Notion (Open Notion.com)'}
                        </span>
                        <ExternalLink size={12} className="text-muted" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-canvas-soft border border-hairline space-y-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                      <AlertCircle size={14} className="text-semantic-warning" />
                      <span>Setup Notion Public OAuth Client</span>
                    </div>
                    <p className="text-muted text-[11px] font-sans leading-relaxed">
                      To use automatic OAuth browser redirect, provide <code>NOTION_CLIENT_ID</code> and{' '}
                      <code>NOTION_CLIENT_SECRET</code> in <code>backend/.env</code>.
                      <br />
                      Alternatively, use the <strong>Integration Token</strong> tab to connect
                      directly using your internal integration secret!
                    </p>
                    <button
                      type="button"
                      onClick={() => setAuthMethod('manual')}
                      className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
                    >
                      <Key size={12} />
                      <span>Switch to Integration Token Verification &rarr;</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Real Token Input with Live API Verification */
              <form onSubmit={handleManualTokenSubmit} className="space-y-3">
                <div className="p-3.5 rounded-xl bg-canvas-soft border border-hairline space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-semibold text-ink text-xs">
                      <Lock size={13} className="text-primary" />
                      <span>Direct Notion API Key Verification</span>
                    </div>
                    <a
                      href="https://www.notion.so/my-integrations"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-[11px] text-primary hover:underline font-sans"
                    >
                      <span>notion.so/my-integrations</span>
                      <ExternalLink size={10} />
                    </a>
                  </div>
                  <p className="text-muted text-[11px] font-sans leading-relaxed">
                    Enter your real Notion integration secret (starts with <code>secret_</code> or{' '}
                    <code>ntn_</code>). ContextForge will verify it live against{' '}
                    <code>https://api.notion.com/v1/users/me</code>.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-ink font-semibold flex items-center justify-between">
                    <span>Notion Secret Key / Token</span>
                    <span className="text-[10px] text-muted">secret_...</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showSecret ? 'text' : 'password'}
                      placeholder="secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      value={notionToken}
                      onChange={(e) => setNotionToken(e.target.value)}
                      required
                      className="w-full px-3 py-2 pr-9 bg-canvas border border-hairline rounded-lg text-ink font-mono focus:outline-none focus:border-primary text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret((p) => !p)}
                      className="absolute right-2.5 top-2.5 text-muted hover:text-ink cursor-pointer"
                    >
                      {showSecret ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-muted text-[11px] flex items-center justify-between">
                    <span>Workspace Display Name (Optional)</span>
                    <span className="text-[10px] text-muted">e.g. My Notion Workspace</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Leave empty to auto-detect from Notion bot profile"
                    value={customWorkspaceName}
                    onChange={(e) => setCustomWorkspaceName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-canvas border border-hairline rounded-lg text-ink font-sans focus:outline-none focus:border-primary text-xs"
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
                    <span>{isSubmitting ? 'Verifying with Notion...' : 'Verify & Connect Token'}</span>
                  </button>
                </ModalFooter>
              </form>
            )}
          </div>
        )}

        {/* Obsidian Local Bridge */}
        {isObsidian && (
          <form onSubmit={handleManualTokenSubmit} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-canvas-soft border border-hairline space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-ink text-xs">
                <Folder size={14} className="text-[#7c3aed]" />
                <span>Local Vault Binding</span>
              </div>
              <p className="text-muted text-[11px] font-sans leading-relaxed">
                Connect your local Obsidian Vault folder. ContextForge will execute the official
                stdio bridge to read backlinks and format atomic Markdown notes with frontmatter.
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
                <span>{isSubmitting ? 'Pairing...' : 'Pair & Connect Vault'}</span>
              </button>
            </ModalFooter>
          </form>
        )}

        {/* Tools Scope Summary */}
        <div className="space-y-1.5 pt-1 border-t border-hairline/60">
          <div className="text-[11px] font-mono font-semibold uppercase tracking-caption text-muted flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Sparkles size={11} className="text-primary" />
              <span>Exposed MCP Tools</span>
            </span>
            <span>({integration.tools.length} Tools)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-32 overflow-y-auto">
            {integration.tools.map((tool) => (
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
