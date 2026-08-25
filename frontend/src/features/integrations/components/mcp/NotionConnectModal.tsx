import React, { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import type { Integration } from '@/shared/types/workspace'
import {
  Modal,
  ModalHeader,
  ModalFooter,
  IntegrationIconBox,
  Button,
} from '@/shared/components'
import { useWorkspace } from '@/shared/context'
import { ecosystemApi } from '@/shared/api/ecosystemApi'
import { McpToolsPreview } from './McpToolsPreview'

interface NotionConnectModalProps {
  integration: Integration
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export const NotionConnectModal: React.FC<NotionConnectModalProps> = ({
  integration,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { updateConnectorConfig, discoverTools, refreshIntegrations, showToast } =
    useWorkspace()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const workspaceName =
    (integration.authConfig?.workspaceName as string) || 'Notion Workspace'

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
          workspaceName: workspaceName.trim() || 'Notion Workspace',
        },
      })

      await discoverTools(integration.id)
      await refreshIntegrations()

      showToast('✨ Successfully initiated Notion MCP authorization!', 'success')
      onSuccess?.()
      onClose()
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to connect Notion workspace'
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
        subtitle="Authorize Notion Model Context Protocol workspace"
        onClose={onClose}
      />

      <div className="space-y-4 text-xs font-mono">
        <div className="p-4 rounded-xl bg-canvas-soft border border-hairline space-y-3">
          <div className="flex items-center gap-2.5 font-semibold text-ink text-xs">
            <div className="w-6 h-6 rounded-md bg-black text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
              N
            </div>
            <div>
              <div className="text-xs font-semibold text-ink">
                Notion Workspace Authorization
              </div>
              <div className="text-[11px] text-muted font-normal font-sans">
                Official OAuth MCP Integration
              </div>
            </div>
          </div>

          <p className="text-muted text-xs font-sans leading-relaxed pt-1">
            Authorize ContextForge to connect with your Notion workspace. Clicking{' '}
            <strong className="text-ink font-semibold">Connect in Browser</strong> will
            open Notion&apos;s official authorization window to select pages and databases.
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

        <McpToolsPreview tools={integration.tools} />
      </div>
    </Modal>
  )
}
