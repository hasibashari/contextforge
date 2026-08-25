import React, { useState } from 'react'
import {
  Calendar,
  Key,
  ExternalLink,
  Zap,
  ShieldCheck,
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
} from '@/shared/components'
import { useWorkspace } from '@/shared/context'
import { ecosystemApi } from '@/shared/api/ecosystemApi'
import { McpToolsPreview } from './McpToolsPreview'

interface GoogleCalendarConnectModalProps {
  integration: Integration
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export const GoogleCalendarConnectModal: React.FC<GoogleCalendarConnectModalProps> = ({
  integration,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { updateConnectorConfig, discoverTools, refreshIntegrations, showToast } =
    useWorkspace()

  const [authTab, setAuthTab] = useState<'oauth' | 'manual'>('oauth')
  const [token, setToken] = useState<string>(
    (integration.authConfig?.token as string) || '',
  )
  const [refreshToken, setRefreshToken] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleOAuthConnect = async () => {
    setIsSubmitting(true)
    try {
      const res = await ecosystemApi.getGoogleCalendarOAuthUrl().catch(() => ({
        configured: false,
        authUrl: `${window.location.protocol}//${window.location.hostname}:3001/api/ecosystem/oauth/google-calendar/authorize`,
      }))

      const targetUrl =
        res.authUrl ||
        `${window.location.protocol}//${window.location.hostname}:3001/api/ecosystem/oauth/google-calendar/authorize`

      window.open(targetUrl, '_blank', 'noopener,noreferrer')

      updateConnectorConfig(integration.id, {
        status: 'connected',
        endpoint: 'https://www.googleapis.com/calendar/v3',
        transport: 'streamable_http',
        authType: 'oauth',
      })

      await discoverTools(integration.id)
      await refreshIntegrations()

      showToast(
        '✨ Google Calendar authorization opened in new window.',
        'info',
      )
      onSuccess?.()
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

  const handleManualTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token.trim()) {
      showToast('Please enter an Access Token or API Key', 'warning')
      return
    }

    setIsSubmitting(true)
    try {
      await ecosystemApi.verifyGoogleCalendarToken(
        token.trim(),
        refreshToken.trim() || undefined,
      )

      updateConnectorConfig(integration.id, {
        status: 'connected',
        endpoint: 'https://www.googleapis.com/calendar/v3',
        transport: 'streamable_http',
        authType: 'oauth',
        authConfig: {
          token: token.trim(),
        },
      })

      await discoverTools(integration.id)
      await refreshIntegrations()

      showToast('✨ Google Calendar connected successfully!', 'success')
      onSuccess?.()
      onClose()
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Google Calendar connection failed'
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
        subtitle="Authorize Google Calendar MCP server for scheduling, meeting discovery, and availability checks"
        onClose={onClose}
      />

      <div className="space-y-4 text-xs font-mono">
        {/* Auth Mode Tabs */}
        <div className="flex border-b border-hairline gap-2 pb-1">
          <button
            type="button"
            onClick={() => setAuthTab('oauth')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              authTab === 'oauth'
                ? 'bg-primary/10 text-primary border border-primary/30'
                : 'text-muted hover:text-ink hover:bg-canvas-soft'
            }`}
          >
            <Calendar size={13} />
            <span>Google OAuth 2.0 (Recommended)</span>
          </button>
          <button
            type="button"
            onClick={() => setAuthTab('manual')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              authTab === 'manual'
                ? 'bg-primary/10 text-primary border border-primary/30'
                : 'text-muted hover:text-ink hover:bg-canvas-soft'
            }`}
          >
            <Key size={13} />
            <span>Manual Token</span>
          </button>
        </div>

        {authTab === 'oauth' ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-canvas-soft border border-hairline space-y-3">
              <div className="flex items-center gap-2.5 font-semibold text-ink text-xs">
                <div className="w-7 h-7 rounded-lg bg-[#4285F4]/10 text-[#4285F4] flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs border border-[#4285F4]/20">
                  <Calendar size={15} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-ink">Google Calendar OAuth 2.0</div>
                  <div className="text-[11px] text-muted font-normal font-sans">
                    Full Calendar v3 REST & Availability Inspection
                  </div>
                </div>
              </div>

              <p className="text-muted text-xs font-sans leading-relaxed pt-1">
                Connect your Google Calendar account. Autonomous agents can check your free/busy agenda, discover available meeting slots, and schedule events with Google Meet links.
              </p>

              <div className="pt-2 border-t border-hairline/60 flex items-center gap-2 text-[11px] text-muted font-sans">
                <ShieldCheck size={13} className="text-semantic-success shrink-0" />
                <span>
                  Least-privilege OAuth scopes:{' '}
                  <code className="font-mono text-[10px] text-ink">calendar.events</code>,{' '}
                  <code className="font-mono text-[10px] text-ink">calendar.readonly</code>
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
                onClick={handleOAuthConnect}
              >
                {isSubmitting ? 'Connecting...' : 'Connect with Google'}
              </Button>
            </ModalFooter>
          </div>
        ) : (
          <form onSubmit={handleManualTokenSubmit} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-canvas-soft border border-hairline space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-ink text-xs">
                <Key size={14} className="text-primary" />
                <span>Enter Google OAuth Access Token</span>
              </div>
              <p className="text-muted text-[11px] font-sans leading-relaxed">
                Provide a valid Google OAuth Bearer access token or OAuth Playground token.
              </p>
            </div>

            <FormField label="OAuth Access Token">
              <Input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ya29.a0AfH6SM..."
                className="font-mono text-xs"
                required
              />
            </FormField>

            <FormField label="Refresh Token (Optional)">
              <Input
                type="password"
                value={refreshToken}
                onChange={(e) => setRefreshToken(e.target.value)}
                placeholder="1//04..."
                className="font-mono text-xs"
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
                disabled={isSubmitting || !token.trim()}
              >
                {isSubmitting ? 'Verifying...' : 'Save & Connect'}
              </Button>
            </ModalFooter>
          </form>
        )}

        <McpToolsPreview tools={integration.tools} />
      </div>
    </Modal>
  )
}
