import type { FC } from 'react'
import { Settings, Zap, Terminal, Globe } from 'lucide-react'
import type { Integration } from '@/shared/types/workspace'
import { IntegrationIconBox } from '@/shared/components/ui/IconBox'
import { StatusPill } from '@/shared/components/ui/StatusPill'
import { Button } from '@/shared/components/ui/Button'

interface IntegrationCardProps {
  integration: Integration
  onOpenDetail: () => void
  onConnect?: () => void
}

export const IntegrationCard: FC<IntegrationCardProps> = ({
  integration,
  onOpenDetail,
  onConnect,
}) => {
  const isConnected = integration.status === 'connected'
  const isRemote =
    integration.transport === 'streamable_http' ||
    integration.transport === 'sse' ||
    integration.transport === 'rest'

  return (
    <div
      onClick={isConnected ? onOpenDetail : onConnect || onOpenDetail}
      className="group relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-surface-card border border-hairline hover:border-primary/40 transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-md"
    >
      {/* Top Header: Icon, Name & Status */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <IntegrationIconBox integration={integration} size="md" />
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-ink group-hover:text-primary transition-colors flex items-center gap-1.5 font-sans truncate">
                <span>{integration.name}</span>
              </h3>
              <div className="flex items-center gap-1.5 text-[11px] text-muted font-mono mt-0.5 flex-wrap">
                {isRemote ? (
                  <span className="flex items-center gap-1">
                    <Globe size={11} className="text-primary" />
                    <span>Streamable HTTP</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Terminal size={11} className="text-[#7c3aed]" />
                    <span>stdio (Local Bridge)</span>
                  </span>
                )}
                <span>·</span>
                <span>{integration.version}</span>
              </div>
            </div>
          </div>

          <StatusPill
            status={
              isConnected
                ? 'connected'
                : integration.status === 'error'
                ? 'error'
                : 'disconnected'
            }
          />
        </div>

        {/* Description */}
        <p className="text-xs text-body font-sans leading-relaxed line-clamp-2">
          {integration.description}
        </p>

        {/* Connected Workspace Badge (Notion) */}
        {isConnected && integration.authConfig?.workspaceName && (
          <div className="inline-flex items-center gap-1.5 text-[10px] text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md font-mono font-medium">
            <span>Workspace: {integration.authConfig.workspaceName}</span>
          </div>
        )}

        {/* Connected Folder Badge (Obsidian) */}
        {isConnected && (integration.authConfig?.vaultName || integration.targetBinding?.folderScope) && (
          <div className="inline-flex items-center gap-1.5 text-[10px] text-[#7c3aed] bg-[#7c3aed]/10 border border-[#7c3aed]/20 px-2 py-0.5 rounded-md font-mono font-medium">
            <span>Folder: 📁 {integration.authConfig?.vaultName || integration.targetBinding?.folderScope}</span>
          </div>
        )}

        {/* Connected Device Badge (Android Bridge) */}
        {isConnected && (integration.id.includes('android') || integration.name.toLowerCase().includes('android')) && (
          <div className="inline-flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md font-mono font-medium">
            <span>Device: 📱 {integration.authConfig?.deviceName || 'Android Native MCP Device'}</span>
          </div>
        )}

        {/* Live Diagnostics Message if Disconnected or Alerting */}
        {(integration.health_message || integration.healthMessage) && (
          <div
            className={`text-[11px] font-mono px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${
              isConnected
                ? 'bg-semantic-success/5 border-semantic-success/20 text-semantic-success'
                : 'bg-semantic-error/10 border-semantic-error/20 text-semantic-error'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isConnected ? 'bg-semantic-success' : 'bg-semantic-error'
              }`}
            />
            <span className="truncate">
              {integration.health_message || integration.healthMessage}
            </span>
          </div>
        )}
      </div>

      {/* Bottom Meta & Action */}
      <div className="pt-4 mt-4 border-t border-hairline/60 flex items-center justify-between gap-2 flex-wrap">
        <div className="text-[11px] font-mono text-muted flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-ink">
            {integration.tools.length} Tools
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-sans font-medium">
            Action Engine
          </span>
          {isConnected && integration.latencyMs > 0 && (
            <>
              <span>·</span>
              <span className="text-semantic-success">
                {integration.latencyMs}ms
              </span>
            </>
          )}
        </div>

        <div>
          {isConnected ? (
            <Button
              type="button"
              variant="secondary"
              size="xs"
              leftIcon={<Settings size={12} />}
              onClick={(e) => {
                e.stopPropagation()
                onOpenDetail()
              }}
            >
              Manage & Sync
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              size="xs"
              leftIcon={<Zap size={12} />}
              onClick={(e) => {
                e.stopPropagation()
                if (onConnect) onConnect()
                else onOpenDetail()
              }}
            >
              Connect
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
