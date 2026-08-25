import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import {
  Modal,
  ModalHeader,
  ModalFooter,
  IntegrationIconBox,
  Button,
  QrCodeBox,
} from '@/shared'
import { useWorkspace } from '@/shared'
import { ecosystemApi } from '@/shared/api/ecosystemApi'
import { McpToolsPreview } from '../common/McpToolsPreview'
import type {
  AndroidBridgeConnectModalProps,
  PairingSessionData,
} from './android-bridge.types'

export const AndroidBridgeConnectModal: React.FC<
  AndroidBridgeConnectModalProps
> = ({ integration, isOpen, onClose, onSuccess }) => {
  const { refreshIntegrations, showToast } = useWorkspace()

  // QR Pairing Session States
  const [session, setSession] = useState<PairingSessionData | null>(null)
  const [secondsRemaining, setSecondsRemaining] = useState(300)
  const [isCreatingSession, setIsCreatingSession] = useState(false)
  const [isPairingSuccess, setIsPairingSuccess] = useState(false)
  const [pairedDeviceInfo, setPairedDeviceInfo] = useState<{
    deviceName: string
    deviceEndpoint: string
  } | null>(null)

  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null)

  // 1. Refresh Pairing Session (User-triggered or expiration)
  const refreshPairingSession = useCallback(async () => {
    setIsCreatingSession(true)
    try {
      const res = await ecosystemApi.createAndroidPairingSession()
      if (res && res.sessionId) {
        setSession(res)
        const left = Math.max(
          0,
          Math.floor((res.expiresAt - Date.now()) / 1000),
        )
        setSecondsRemaining(left)
        setIsPairingSuccess(false)
      }
    } catch {
      showToast('Failed to initialize QR pairing session', 'error')
    } finally {
      setIsCreatingSession(false)
    }
  }, [showToast])

  // Initial session trigger on modal open
  useEffect(() => {
    let isMounted = true
    if (isOpen) {
      ecosystemApi
        .createAndroidPairingSession()
        .then((res) => {
          if (!isMounted) return
          if (res && res.sessionId) {
            setSession(res)
            const left = Math.max(
              0,
              Math.floor((res.expiresAt - Date.now()) / 1000),
            )
            setSecondsRemaining(left)
            setIsPairingSuccess(false)
          }
        })
        .catch(() => {
          if (isMounted) {
            showToast('Failed to initialize QR pairing session', 'error')
          }
        })
    }
    return () => {
      isMounted = false
    }
  }, [isOpen, showToast])

  // 2. Countdown Timer
  useEffect(() => {
    if (!isOpen || !session || session.status !== 'waiting') return

    countdownTimerRef.current = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.floor((session.expiresAt - Date.now()) / 1000),
      )
      setSecondsRemaining(remaining)
      if (remaining <= 0) {
        setSession((prev) => (prev ? { ...prev, status: 'expired' } : null))
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
      }
    }, 1000)

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
    }
  }, [isOpen, session])

  // 3. Polling for mobile handshake scan confirmation
  useEffect(() => {
    if (!isOpen || !session || session.status !== 'waiting') return

    const pollStatus = async () => {
      try {
        const res = await ecosystemApi.checkAndroidPairingStatus(
          session.sessionId,
        )
        if (res) {
          if (res.status === 'confirmed' && res.deviceInfo) {
            setIsPairingSuccess(true)
            setPairedDeviceInfo({
              deviceName: res.deviceInfo.deviceName,
              deviceEndpoint: res.deviceInfo.deviceEndpoint,
            })
            showToast(
              `✨ Device "${res.deviceInfo.deviceName}" paired successfully!`,
              'success',
            )
            await refreshIntegrations()

            // Auto-close modal after brief celebration
            setTimeout(() => {
              onSuccess?.()
              onClose()
            }, 1800)
          } else if (res.status === 'expired') {
            setSession((prev) =>
              prev ? { ...prev, status: 'expired' } : null,
            )
          }
        }
      } catch {
        // Silent catch during background poll
      }
    }

    pollingTimerRef.current = setInterval(pollStatus, 2000)

    return () => {
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current)
    }
  }, [isOpen, session, refreshIntegrations, showToast, onSuccess, onClose])

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalHeader
        icon={<IntegrationIconBox integration={integration} size="md" />}
        title={`Pair ${integration.name}`}
        subtitle="Point your phone camera to pair ContextForge with the Android MCP Bridge app"
        onClose={onClose}
      />

      <div className="space-y-4 text-xs font-mono">
        {/* Success State Animation */}
        {isPairingSuccess ? (
          <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 size={24} />
            </div>
            <div className="space-y-1">
              <div className="text-sm font-bold text-ink">
                Android Device Paired!
              </div>
              <div className="text-xs text-muted font-sans">
                Connected to{' '}
                <strong className="text-emerald-600 dark:text-emerald-400">
                  {pairedDeviceInfo?.deviceName || 'Mobile Device'}
                </strong>{' '}
                at {pairedDeviceInfo?.deviceEndpoint}
              </div>
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
              <Sparkles size={12} />
              <span>Configuring workspace tools and sync...</span>
            </div>
          </div>
        ) : (
          /* Single Centered Column for QR Code */
          <div className="p-5 rounded-2xl bg-canvas border border-hairline flex flex-col items-center justify-center shadow-2xs">
            {session ? (
              <QrCodeBox
                value={session.qrPayloadJson}
                size={210}
                pinCode={session.pinCode}
                formattedPin={session.formattedPin}
                expiresInSeconds={secondsRemaining}
                isExpired={
                  session.status === 'expired' || secondsRemaining <= 0
                }
                onRefresh={refreshPairingSession}
                isRefreshing={isCreatingSession}
              />
            ) : (
              <div className="h-60 flex items-center justify-center text-muted text-xs">
                Initializing secure pairing session...
              </div>
            )}
          </div>
        )}

        {/* Android Permissions Checklist */}
        <div className="p-3 rounded-xl bg-canvas border border-hairline space-y-1.5 shadow-2xs">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-ink font-sans">
            <ShieldCheck size={13} className="text-semantic-success" />
            <span>Required Android Permissions (Active in App):</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px] text-muted font-mono">
            <div className="p-1 rounded bg-canvas-soft border border-hairline/60 flex items-center gap-1 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="truncate">USAGE_STATS</span>
            </div>
            <div className="p-1 rounded bg-canvas-soft border border-hairline/60 flex items-center gap-1 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="truncate">DND_POLICY</span>
            </div>
            <div className="p-1 rounded bg-canvas-soft border border-hairline/60 flex items-center gap-1 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="truncate">ALERT_WINDOW</span>
            </div>
            <div className="p-1 rounded bg-canvas-soft border border-hairline/60 flex items-center gap-1 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="truncate">NOTIFICATIONS</span>
            </div>
          </div>
        </div>

        {/* Tools Preview */}
        <McpToolsPreview tools={integration.tools} />

        {/* Footer */}
        <ModalFooter>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </div>
    </Modal>
  )
}
