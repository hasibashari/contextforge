import React, { useState, useEffect, useCallback } from 'react'
import {
  Smartphone,
  Activity,
  Clock,
  RefreshCw,
  Sliders,
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
    if (isOpen) {
      fetchTelemetry()
    }
  }, [isOpen, fetchTelemetry])

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalHeader
        icon={<IntegrationIconBox integration={integration} size="md" />}
        title="Android Digital Wellbeing Telemetry"
        subtitle={`Live device telemetry monitored via ${integration.endpoint || 'Android MCP Bridge'}`}
        onClose={onClose}
      />

      <div className="space-y-4 font-mono text-xs">
        {/* Device Status & Metadata Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-canvas-soft border border-hairline">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-500/20">
              <Smartphone size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-ink font-sans">
                  {integration.authConfig?.deviceName ||
                    'Android Mobile Device'}
                </span>
                <Badge
                  variant={
                    integration.status === 'connected' ? 'success' : 'neutral'
                  }
                  size="xs"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1" />
                  <span>{integration.status || 'connected'}</span>
                </Badge>
              </div>
              <div className="text-[11px] text-muted">
                Port 8080 · Latency: {integration.latencyMs || 12}ms
              </div>
            </div>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="xs"
            isLoading={isRefreshing}
            leftIcon={<RefreshCw size={11} />}
            onClick={fetchTelemetry}
          >
            Refresh Data
          </Button>
        </div>

        {/* Telemetry Cards: Total Screen Time & Current Active App */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Card 1: Total Screen Time Today */}
          <div className="p-4 rounded-xl bg-canvas border border-hairline shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-xs text-muted font-sans font-medium">
              <span className="flex items-center gap-1.5">
                <Clock size={13} className="text-emerald-500" />
                <span>Screen Time Today</span>
              </span>
              <span className="text-[10px] text-muted font-mono">Since 00:00</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-ink">
                {usageSummary?.formattedTotalScreenTime || '0m'}
              </span>
              {usageSummary?.mostUsedAppName && (
                <span className="text-[11px] text-muted font-sans">
                  Top:{' '}
                  <strong className="text-ink">
                    {usageSummary.mostUsedAppName}
                  </strong>
                </span>
              )}
            </div>
            <div className="w-full bg-canvas-soft h-1.5 rounded-full overflow-hidden border border-hairline">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(
                      10,
                      ((usageSummary?.totalScreenTimeMs || 3600000) /
                        (4 * 3600000)) *
                        100,
                    ),
                  )}%`,
                }}
              />
            </div>
          </div>

          {/* Card 2: Live Foreground Application */}
          <div className="p-4 rounded-xl bg-canvas border border-hairline shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-xs text-muted font-sans font-medium">
              <span className="flex items-center gap-1.5">
                <Activity size={13} className="text-emerald-500" />
                <span>Current Foreground App</span>
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span>Live On Screen</span>
              </span>
            </div>
            <div className="flex items-center gap-2.5 pt-1">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                📱
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-ink truncate font-mono">
                  {foregroundApp?.friendlyName || 'Waiting for screen...'}
                </div>
                <div className="text-[10px] text-muted truncate">
                  {foregroundApp?.currentForegroundApp || 'No active foreground event'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Application Usage Breakdown List */}
        {usageSummary && usageSummary.apps && usageSummary.apps.length > 0 && (
          <div className="p-4 rounded-xl bg-canvas border border-hairline shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-ink font-sans flex items-center gap-1.5">
                <Sliders size={13} className="text-primary" />
                <span>Monitored App Usage Breakdown</span>
              </h4>
              <span className="text-[10px] text-muted">
                {usageSummary.apps.length} apps detected
              </span>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {usageSummary.apps.map((app, idx) => {
                const totalMs = usageSummary.totalScreenTimeMs || 1
                const pct = Math.round(
                  (app.totalTimeInForegroundMs / totalMs) * 100,
                )
                return (
                  <div
                    key={app.packageName || idx}
                    className="p-2 rounded-lg bg-canvas-soft border border-hairline/60 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-4 h-4 rounded-full bg-canvas text-muted border border-hairline flex items-center justify-center text-[9px] shrink-0 font-semibold">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="font-semibold text-ink truncate">
                          {app.friendlyName || app.packageName}
                        </div>
                        <div className="text-[9px] text-muted truncate">
                          {app.packageName}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-semibold text-ink text-[11px]">
                        {app.formattedDuration || '0m'}
                      </span>
                      <div className="w-12 bg-canvas h-1.5 rounded-full overflow-hidden border border-hairline">
                        <div
                          className="bg-emerald-500 h-full rounded-full"
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
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </div>
    </Modal>
  )
}
