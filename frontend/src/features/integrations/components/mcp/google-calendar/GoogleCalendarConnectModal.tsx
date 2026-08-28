import React, { useState } from 'react'
import { ExternalLink, Calendar, ShieldCheck } from 'lucide-react'
import type { Integration } from '@/shared/types/workspace'
import {
  Modal,
  ModalHeader,
  ModalFooter,
  IntegrationIconBox,
  Button,
} from '@/shared'
import { useWorkspace } from '@/shared'
import { ecosystemApi } from '@/shared/api/ecosystemApi'
import { McpToolsPreview } from '../common/McpToolsPreview'

export interface GoogleCalendarConnectModalProps {
  integration: Integration
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export const GoogleCalendarConnectModal: React.FC<
  GoogleCalendarConnectModalProps
> = ({ integration, isOpen, onClose }) => {
  const { showToast } = useWorkspace()

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleGoogleCalendarDirectConnect = async () => {
    setIsSubmitting(true)
    try {
      const baseOrigin = window.location.port === '5173'
        ? `${window.location.protocol}//${window.location.hostname}:3001`
        : window.location.origin
      const defaultAuthUrl = `${baseOrigin}/api/ecosystem/oauth/google-calendar/authorize`

      const res = await ecosystemApi.getGoogleCalendarOAuthUrl().catch(() => ({
        configured: false,
        authUrl: defaultAuthUrl,
      }))

      const targetUrl = res.authUrl || defaultAuthUrl

      window.open(targetUrl, '_blank', 'noopener,noreferrer')

      showToast(
        '✨ Google Calendar authorization opened in new tab. Please grant access to finish connecting.',
        'info',
      )
      onClose()
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Failed to initiate Google Calendar authorization'
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
        subtitle="Authorize Google Calendar Model Context Protocol workspace"
        onClose={onClose}
      />

      <div className="space-y-4 text-xs font-mono">
        <div className="p-4 rounded-xl bg-canvas-soft border border-hairline space-y-3">
          <div className="flex items-center gap-2.5 font-semibold text-ink text-xs">
            <div className="w-6 h-6 rounded-md bg-[#4285F4]/10 text-[#4285F4] flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs border border-[#4285F4]/20">
              <Calendar size={14} />
            </div>
            <div>
              <div className="text-xs font-semibold text-ink">
                Google Calendar Authorization
              </div>
              <div className="text-[11px] text-muted font-normal font-sans">
                Official Google OAuth 2.0 MCP Integration
              </div>
            </div>
          </div>

          <p className="text-muted text-xs font-sans leading-relaxed pt-1">
            Authorize ContextForge to connect with your Google Calendar account.
            Clicking{' '}
            <strong className="text-ink font-semibold">
              Connect in Browser
            </strong>{' '}
            will open Google&apos;s official authorization window to grant access
            for scheduling events, checking availability, and managing calendar
            agendas.
          </p>

          <div className="pt-2 border-t border-hairline/60 flex items-center gap-2 text-[11px] text-muted font-sans">
            <ShieldCheck size={13} className="text-semantic-success shrink-0" />
            <span>
              Least-privilege OAuth scopes:{' '}
              <code className="font-mono text-[10px] text-ink">
                calendar.events
              </code>
              ,{' '}
              <code className="font-mono text-[10px] text-ink">
                calendar.readonly
              </code>
            </span>
          </div>
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
            onClick={handleGoogleCalendarDirectConnect}
          >
            {isSubmitting ? 'Connecting...' : 'Connect in Browser'}
          </Button>
        </ModalFooter>

        <McpToolsPreview tools={integration.tools} />
      </div>
    </Modal>
  )
}
