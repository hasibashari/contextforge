import type { FC } from 'react'
import type { Integration } from '@/shared/types/workspace'
import { AndroidBridgeConnectModal } from './mcp/android-bridge/AndroidBridgeConnectModal'
import { GoogleCalendarConnectModal } from './mcp/google-calendar/GoogleCalendarConnectModal'
import { NotionConnectModal } from './mcp/notion/NotionConnectModal'
import { ObsidianConnectModal } from './mcp/obsidian/ObsidianConnectModal'
import { GenericConnectModal } from './mcp/generic/GenericConnectModal'

export interface ConnectAuthModalProps {
  integration: Integration | null
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

/**
 * Polymorphic MCP Connector Modal Dispatcher
 * Routes the active integration to its dedicated, isolated MCP connector modal.
 */
export const ConnectAuthModal: FC<ConnectAuthModalProps> = ({
  integration,
  isOpen,
  onClose,
  onSuccess,
}) => {
  if (!isOpen || !integration) return null

  const id = integration.id.toLowerCase()
  const name = integration.name.toLowerCase()

  // 1. Google Calendar MCP Server
  if (id.includes('calendar') || name.includes('calendar')) {
    return (
      <GoogleCalendarConnectModal
        integration={integration}
        isOpen={isOpen}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    )
  }

  // 2. Notion Workspace MCP Server
  if (id.includes('notion') || name.includes('notion')) {
    return (
      <NotionConnectModal
        integration={integration}
        isOpen={isOpen}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    )
  }

  // 3. Obsidian Vault MCP Bridge
  if (id.includes('obsidian') || name.includes('obsidian')) {
    return (
      <ObsidianConnectModal
        integration={integration}
        isOpen={isOpen}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    )
  }

  // 4. Android Bridge & Digital Wellbeing MCP
  if (id.includes('android') || name.includes('android')) {
    return (
      <AndroidBridgeConnectModal
        integration={integration}
        isOpen={isOpen}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    )
  }

  // 5. Generic / Dynamic Remote MCP Server Fallback
  return (
    <GenericConnectModal
      integration={integration}
      isOpen={isOpen}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  )
}
