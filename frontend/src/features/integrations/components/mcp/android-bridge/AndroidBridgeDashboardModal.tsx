import React, { useState, useEffect, useCallback } from 'react'
import {
  Smartphone,
  Activity,
  Clock,
  RefreshCw,
  Sliders,
  Battery,
  Radio,
} from 'lucide-react'
import {
  Modal,
  ModalHeader,
  ModalFooter,
  IntegrationIconBox,
  Button,
  Badge,
} from '@/shared'
import { useWorkspace } from '@/shared'
import { ecosystemApi } from '@/shared/api/ecosystemApi'
import { McpToolsPreview } from '../common/McpToolsPreview'
import type {
  AndroidBridgeDashboardModalProps,
  UsageSummaryData,
} from './android-bridge.types'

export const AndroidBridgeDashboardModal: React.FC<
  AndroidBridgeDashboardModalProps
> = ({ integration, isOpen, onClose }) => {
  const { showToast } = useWorkspace()

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [usageSummary, setUsageSummary] = useState<UsageSummaryData | null>(null)
  const [foregroundApp, setForegroundApp] = useState<{
    currentForegroundApp: string
    friendlyName: string
  } | null>(null)

  const authConfig = integration.authConfig as
    | {
        deviceName?: string
        androidVersion?: string
        batteryLevel?: number
        pairedVia?: string
      }
    | undefined

  // Fetch live telemetry from Android device via MCP tools
  const fetchTelemetry = useCallback(async () => {
    setIsRefreshing(true)
    try {
      const [summaryRes, fgRes] = await Promise.allSettled([
        ecosystemApi.executeMcpTool('android_get_usage_summary', {}),
        ecosystemApi.executeMcpTool('android_get_foreground_app', {}),
      ])

      if (
        summaryRes.status === 'fulfilled' &&
        summaryRes.value.success &&
        summaryRes.value.data
      ) {
        setUsageSummary(summaryRes.value.data as UsageSummaryData)
      }

      if (
        fgRes.status === 'fulfilled' &&
        fgRes.value.success &&
        fgRes.value.data
      ) {
        setForegroundApp(
          fgRes.value.data as {
            currentForegroundApp: string
            friendlyName: string
          },
        )
      }
    } catch {
      showToast('Failed to fetch mobile telemetry', 'error')
    } finally {
      setIsRefreshing(false)
    }
  }, [showToast])

  // Initial fetch on modal open
  useEffect(() => {
    let isMounted = true
    if (isOpen) {
      void (async () => {
        if (isMounted) {
          await fetchTelemetry()
        }
      })()
    }
    return () => {
      isMounted = false
    }
  }, [isOpen, fetchTelemetry])

  // Calculate screen time percentage against 4h baseline
  const screenTimePct = usageSummary?.totalScreenTimeMs
    ? Math.min(100, Math.round((usageSummary.totalScreenTimeMs / (4 * 3600000)) * 100))
    : 0

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalHeader
        icon={<IntegrationIconBox integration={integration} size="sm" />}
        title="Digital Wellbeing Telemetry"
        subtitle={`Monitored via ${integration.endpoint || 'Android MCP Bridge'}`}
        onClose={onClose}
      />

      <div className="space-y-3 font-sans text-xs">
        {/* Device Status & Metadata Header */}
        <div className="flex items-center justify-between gap-2.5 p-2.5 sm:p-3 rounded-xl bg-canvas-soft border border-hairline">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-500/20 shadow-2xs">
              <Smartphone size={14} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-semibold text-ink truncate">
                  {authConfig?.deviceName ||
                    integration.name ||
                    'Android Device'}
                </span>
                <Badge
                  variant={
                    integration.status === 'connected' ? 'success' : 'neutral'
                  }
                  size="xs"
                >
                  <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse mr-1" />
                  <span>{integration.status || 'connected'}</span>
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-muted flex-wrap mt-0.5">
                <span className="inline-flex items-center gap-1">
                  <Radio size={10} className="text-emerald-500" />
                  <span>WS Bridge</span>
                </span>
                {authConfig?.batteryLevel !== undefined && (
                  <>
                    <span>·</span>
                    <span className="inline-flex items-center gap-0.5">
                      <Battery size={10} className="text-emerald-500" />
                      <span>{authConfig.batteryLevel}%</span>
                    </span>
                  </>
                )}
                {authConfig?.androidVersion && (
                  <>
                    <span>·</span>
                    <span>{authConfig.androidVersion}</span>
                  </>
                )}
                <span>·</span>
                <span>{integration.latencyMs || 12}ms</span>
              </div>
            </div>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="xs"
            isLoading={isRefreshing}
            leftIcon={<RefreshCw size={10} />}
            onClick={fetchTelemetry}
            className="shrink-0"
          >
            Refresh
          </Button>
        </div>

        {/* Telemetry Cards: Symmetrical & Compact Side-by-Side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Card 1: Total Screen Time Today */}
          <div className="p-3 rounded-xl bg-canvas border border-hairline shadow-2xs flex flex-col justify-between space-y-2.5 transition-all hover:border-hairline/80">
            {/* Card 1 Header */}
            <div className="flex items-center justify-between text-[11px] text-muted font-medium">
              <span className="flex items-center gap-1.5 min-w-0">
                <div className="w-4 h-4 rounded bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shrink-0">
                  <Clock size={10} />
                </div>
                <span className="font-semibold text-ink truncate">Screen Time Today</span>
              </span>
              <span className="text-[9px] text-muted font-mono px-1 py-0.5 rounded bg-canvas-soft border border-hairline shrink-0">
                Since 00:00
              </span>
            </div>

            {/* Card 1 Body */}
            <div className="space-y-0.5">
              <div className="text-xl font-bold font-mono text-ink tracking-tight">
                {usageSummary?.formattedTotalScreenTime || '0m'}
              </div>
              <div className="text-[10px] text-muted truncate">
                {usageSummary?.mostUsedAppName ? (
                  <>
                    Top:{' '}
                    <span className="font-medium text-ink font-mono">
                      {usageSummary.mostUsedAppName}
                    </span>
                  </>
                ) : (
                  'No app activity logged yet'
                )}
              </div>
            </div>

            {/* Card 1 Footer / Progress */}
            <div className="space-y-1 pt-1 border-t border-hairline/50">
              <div className="flex items-center justify-between text-[9px] text-muted font-mono">
                <span>Baseline (4h)</span>
                <span className="font-semibold text-ink">{screenTimePct}%</span>
              </div>
              <div className="w-full bg-canvas-soft h-1 rounded-full overflow-hidden border border-hairline">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(4, Math.min(100, screenTimePct))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card 2: Current Active Foreground App */}
          <div className="p-3 rounded-xl bg-canvas border border-hairline shadow-2xs flex flex-col justify-between space-y-2.5 transition-all hover:border-hairline/80">
            {/* Card 2 Header */}
            <div className="flex items-center justify-between text-[11px] text-muted font-medium">
              <span className="flex items-center gap-1.5 min-w-0">
                <div className="w-4 h-4 rounded bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0">
                  <Activity size={10} />
                </div>
                <span className="font-semibold text-ink truncate">Active App</span>
              </span>
              <span className="inline-flex items-center gap-1 text-[9px] text-emerald-600 dark:text-emerald-400 font-mono px-1 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 shrink-0">
                <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live</span>
              </span>
            </div>

            {/* Card 2 Body */}
            <div className="space-y-0.5">
              <div className="text-sm font-bold text-ink truncate">
                {foregroundApp?.friendlyName || (
                  <span className="text-muted font-normal text-xs">Waiting for screen...</span>
                )}
              </div>
              <div className="text-[10px] text-muted font-mono truncate">
                {foregroundApp?.currentForegroundApp || 'Standby'}
              </div>
            </div>

            {/* Card 2 Footer / Focus State */}
            <div className="space-y-1 pt-1 border-t border-hairline/50">
              <div className="flex items-center justify-between text-[9px] text-muted font-mono">
                <span className="flex items-center gap-1 text-muted">
                  <span className="w-1 h-1 rounded-full bg-emerald-500" />
                  <span>Foreground Focus</span>
                </span>
                <span className="font-semibold text-ink">
                  {foregroundApp ? 'In Focus' : 'Standby'}
                </span>
              </div>
              <div className="w-full bg-canvas-soft h-1 rounded-full overflow-hidden border border-hairline">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-500"
                  style={{ width: foregroundApp ? '100%' : '15%' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Application Usage Breakdown List */}
        {usageSummary && usageSummary.apps && usageSummary.apps.length > 0 && (
          <div className="p-3 rounded-xl bg-canvas border border-hairline shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-semibold text-ink flex items-center gap-1.5">
                <Sliders size={11} className="text-primary" />
                <span>App Usage Breakdown</span>
              </h4>
              <span className="text-[9px] text-muted font-mono px-1.5 py-0.5 rounded bg-canvas-soft border border-hairline">
                {usageSummary.apps.length} apps
              </span>
            </div>

            <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
              {usageSummary.apps.map((app, idx) => {
                const totalMs = usageSummary.totalScreenTimeMs || 1
                const pct = Math.round(
                  (app.totalTimeInForegroundMs / totalMs) * 100,
                )
                return (
                  <div
                    key={app.packageName || idx}
                    className="p-2 rounded-lg bg-canvas-soft border border-hairline/70 hover:border-hairline flex items-center justify-between gap-2 text-xs transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-4 h-4 rounded bg-canvas text-muted border border-hairline flex items-center justify-center text-[9px] shrink-0 font-semibold font-mono">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="font-semibold text-ink truncate text-[11px]">
                          {app.friendlyName || app.packageName}
                        </div>
                        <div className="text-[9px] text-muted truncate font-mono">
                          {app.packageName}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <div className="text-right">
                        <div className="font-semibold text-ink text-[10px] font-mono">
                          {app.formattedDuration || '0m'}
                        </div>
                        <div className="text-[8px] text-muted font-mono">
                          {pct}%
                        </div>
                      </div>
                      <div className="w-12 sm:w-14 bg-canvas h-1 rounded-full overflow-hidden border border-hairline">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Exposed Server Tools Ready for AI Agent */}
        <McpToolsPreview tools={integration.tools} />

        {/* Modal Footer */}
        <ModalFooter>
          <Button type="button" variant="ghost" size="xs" onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </div>
    </Modal>
  )
}
