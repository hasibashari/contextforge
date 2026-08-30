import { useState, useEffect, useCallback, type FC } from 'react'
import {
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Edit2,
  Check,
  Copy,
  Radio,
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

export const AndroidBridgeConnectModal: FC<
  AndroidBridgeConnectModalProps
> = ({ integration, isOpen, onClose, onSuccess }) => {
  const { refreshIntegrations, showToast } = useWorkspace()

  const [copiedWs, setCopiedWs] = useState(false)

  // QR Pairing Session States
  const isCloudEnv =
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'

  const [customHost, setCustomHost] = useState<string>(() => {
    if (isCloudEnv) return window.location.host
    return localStorage.getItem('contextforge_android_desktop_ip') || ''
  })
  const [isEditingHost, setIsEditingHost] = useState(false)
  const [hostInput, setHostInput] = useState<string>(() => {
    if (isCloudEnv) return window.location.host
    return localStorage.getItem('contextforge_android_desktop_ip') || ''
  })

  const [session, setSession] = useState<PairingSessionData | null>(null)
  const [secondsRemaining, setSecondsRemaining] = useState(300)
  const [isCreatingSession, setIsCreatingSession] = useState(false)
  const [isPairingSuccess, setIsPairingSuccess] = useState(false)
  const [pairedDeviceInfo, setPairedDeviceInfo] = useState<{
    deviceName: string
    deviceEndpoint: string
  } | null>(null)

  // 1. Refresh Pairing Session (User-triggered or expiration)
  const refreshPairingSession = useCallback(
    async (hostOverride?: string) => {
      setIsCreatingSession(true)
      const targetHost = hostOverride !== undefined ? hostOverride : customHost
      try {
        const res = await ecosystemApi.createAndroidPairingSession(
          targetHost.trim() || undefined,
        )
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
    },
    [customHost, showToast],
  )

  const handleSaveHost = () => {
    const trimmed = hostInput.trim()
    if (!trimmed) return
    setCustomHost(trimmed)
    localStorage.setItem('contextforge_android_desktop_ip', trimmed)
    setIsEditingHost(false)
    refreshPairingSession(trimmed)
    showToast(`Updated Desktop IP to ${trimmed}`, 'info')
  }

  const getWebSocketUrl = () => {
    const isHttps = window.location.protocol === 'https:'
    const wsProtocol = isHttps ? 'wss:' : 'ws:'
    if (window.location.port === '5173') {
      const host = session?.desktopHost || customHost || window.location.hostname
      const port = session?.desktopPort || 3001
      return `${wsProtocol}//${host}:${port}/api/android-bridge/ws`
    }
    return `${wsProtocol}//${window.location.host}/api/android-bridge/ws`
  }

  const handleCopyWsUrl = () => {
    const wsUrl = getWebSocketUrl()
    navigator.clipboard.writeText(wsUrl)
    setCopiedWs(true)
    setTimeout(() => setCopiedWs(false), 2000)
    showToast('WebSocket URL copied to clipboard', 'success')
  }

  // Initial session trigger on modal open
  useEffect(() => {
    if (!isOpen) return

    let isMounted = true
    const targetHost = isCloudEnv
      ? window.location.host
      : customHost?.trim() || undefined

    ecosystemApi
      .createAndroidPairingSession(targetHost)
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

    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, customHost, isCloudEnv])

  // 2. Live 1-second interval countdown timer for QR session expiration
  useEffect(() => {
    if (!isOpen || !session || session.status !== 'waiting') return

    const updateCountdown = () => {
      const left = Math.max(
        0,
        Math.floor((session.expiresAt - Date.now()) / 1000),
      )
      setSecondsRemaining(left)
      if (left <= 0) {
        setSession((prev) => (prev ? { ...prev, status: 'expired' } : null))
      }
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => {
      clearInterval(interval)
    }
  }, [isOpen, session])

  // 3. Real-Time Event-Driven listener for mobile scan & handshake confirmation
  useEffect(() => {
    if (!isOpen || !session || session.status !== 'waiting') return

    const handlePairingUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{
        sessionId: string
        status: 'waiting' | 'confirmed' | 'expired'
        deviceInfo?: {
          deviceName: string
          deviceEndpoint?: string
          androidVersion?: string
          batteryLevel?: number
        }
      }>
      const data = customEvent.detail
      if (!data) return

      if (data.sessionId === session.sessionId || !data.sessionId) {
        if (data.status === 'confirmed' && data.deviceInfo) {
          setIsPairingSuccess(true)
          setPairedDeviceInfo({
            deviceName: data.deviceInfo.deviceName,
            deviceEndpoint:
              data.deviceInfo.deviceEndpoint || session.wsUrl || '',
          })
          showToast(
            `✨ Device "${data.deviceInfo.deviceName}" paired successfully!`,
            'success',
          )
          void refreshIntegrations()

          // Auto-close modal after brief celebration
          setTimeout(() => {
            onSuccess?.()
            onClose()
          }, 1500)
        } else if (data.status === 'expired') {
          setSession((prev) => (prev ? { ...prev, status: 'expired' } : null))
        }
      }
    }

    window.addEventListener('contextforge:pairing_updated', handlePairingUpdated)

    return () => {
      window.removeEventListener('contextforge:pairing_updated', handlePairingUpdated)
    }
  }, [isOpen, session, refreshIntegrations, showToast, onSuccess, onClose])

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalHeader
        icon={<IntegrationIconBox integration={integration} size="md" />}
        title={`Connect ${integration.name}`}
        subtitle="Bridge Android Digital Wellbeing, screen time metrics, DND mode, and app limiter"
        onClose={onClose}
      />

      <div className="space-y-4 text-xs font-mono">
        {/* Success State Celebration */}
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
          <>
            {/* WEBSOCKET / QR PAIRING SECTION */}
            <div className="p-4 rounded-2xl bg-canvas border border-hairline flex flex-col items-center justify-center shadow-2xs space-y-3">
              {session ? (
                <>
                  <QrCodeBox
                    value={session.qrPayloadJson}
                    size={190}
                    pinCode={session.pinCode}
                    formattedPin={session.formattedPin}
                    expiresInSeconds={secondsRemaining}
                    isExpired={
                      session.status === 'expired' || secondsRemaining <= 0
                    }
                    onRefresh={() => refreshPairingSession()}
                    isRefreshing={isCreatingSession}
                  />

                  {/* WebSocket URL Copy Box */}
                  <div className="w-full max-w-sm p-2.5 rounded-xl bg-canvas-soft border border-hairline flex flex-col gap-1.5 font-sans">
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1 text-muted">
                        <Radio size={12} className="text-emerald-500" />
                        <span>WebSocket Bridge URL:</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyWsUrl}
                        className="text-emerald-600 dark:text-emerald-400 hover:underline text-[10px] flex items-center gap-0.5 cursor-pointer font-medium"
                      >
                        {copiedWs ? <Check size={10} /> : <Copy size={10} />}
                        <span>{copiedWs ? 'Copied!' : 'Copy URL'}</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between font-mono text-[11px] text-ink font-semibold bg-canvas px-2.5 py-1.5 rounded-lg border border-hairline/60">
                      <span className="truncate select-all">
                        {getWebSocketUrl()}
                      </span>
                    </div>

                    {/* Desktop IP Customizer */}
                    <div className="flex items-center justify-between text-[10px] text-muted pt-0.5">
                      <span>Desktop Wi-Fi IP: <strong className="text-ink">{session.desktopHost}</strong></span>
                      {!isEditingHost ? (
                        <button
                          type="button"
                          onClick={() => {
                            setHostInput(customHost)
                            setIsEditingHost(true)
                          }}
                          className="text-muted hover:text-ink flex items-center gap-0.5 cursor-pointer"
                        >
                          <Edit2 size={9} />
                          <span>Edit IP</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={hostInput}
                            onChange={(e) => setHostInput(e.target.value)}
                            placeholder="192.168.1.8"
                            className="px-1.5 py-0.5 rounded bg-canvas border border-hairline text-[10px] font-mono text-ink w-24"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveHost()
                              if (e.key === 'Escape') setIsEditingHost(false)
                            }}
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={handleSaveHost}
                            className="px-1.5 py-0.5 rounded bg-emerald-600 text-white cursor-pointer text-[10px]"
                          >
                            Save
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-60 flex items-center justify-center text-muted text-xs">
                  Initializing secure pairing session...
                </div>
              )}
            </div>

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
          </>
        )}

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

