import React, { useState } from 'react'
import {
  Key,
  Shield,
  Database,
  Globe,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Trash2,
  ExternalLink,
  Lock,
} from 'lucide-react'
import type { WorkspaceConnection } from '@/shared/types/workspace'
import { StatusPill } from '@/shared/components/ui/StatusPill'

interface ConnectionCardProps {
  connection: WorkspaceConnection
  onTest: (id: string) => Promise<boolean>
  onDelete: (id: string) => void
}

export const ConnectionCard: React.FC<ConnectionCardProps> = ({
  connection,
  onTest,
  onDelete,
}) => {
  const [isTesting, setIsTesting] = useState(false)

  const handleTest = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsTesting(true)
    await onTest(connection.id)
    setIsTesting(false)
  }

  const getTypeIcon = () => {
    switch (connection.connectionType) {
      case 'llm_provider':
        return <Key size={16} className="text-primary" />
      case 'oauth_service':
        return <Globe size={16} className="text-secondary" />
      case 'database':
        return <Database size={16} className="text-emerald-500" />
      case 'mcp_server':
        return <Shield size={16} className="text-amber-500" />
      default:
        return <Key size={16} className="text-primary" />
    }
  }

  const getTypeLabel = () => {
    switch (connection.connectionType) {
      case 'llm_provider':
        return 'LLM Provider'
      case 'oauth_service':
        return 'OAuth 2.0'
      case 'database':
        return 'Database'
      case 'mcp_server':
        return 'Remote MCP'
      default:
        return connection.connectionType
    }
  }

  const isConnected = connection.status === 'active'

  return (
    <div className="p-5 flex flex-col justify-between h-full bg-surface-card border border-hairline hover:border-primary/40 transition-all rounded-xl sm:rounded-2xl shadow-xs">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-canvas-soft border border-hairline flex items-center justify-center shadow-2xs">
              {getTypeIcon()}
            </div>
            <div>
              <h3 className="text-sm font-bold text-ink tracking-tight flex items-center gap-1.5">
                {connection.name}
              </h3>
              <p className="text-xs font-mono text-muted capitalize">
                {connection.provider.replace('_', ' ')} · {connection.authType.replace('_', ' ')}
              </p>
            </div>
          </div>
          <StatusPill status={isConnected ? 'connected' : 'error'} label={getTypeLabel()} />
        </div>

        {/* Endpoint & Config Details */}
        {connection.endpointUrl && (
          <div className="bg-canvas-soft border border-hairline/60 rounded-lg px-3 py-2 text-xs font-mono text-body flex items-center justify-between gap-2 overflow-hidden">
            <span className="truncate max-w-65 text-muted">
              {connection.endpointUrl}
            </span>
            <ExternalLink size={12} className="text-muted shrink-0" />
          </div>
        )}

        {/* Security indicator */}
        <div className="flex items-center gap-1.5 text-xs text-muted font-mono">
          <Lock size={12} className="text-primary" />
          <span>Encrypted credential storage active</span>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="pt-4 mt-2 border-t border-hairline flex items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center gap-1.5">
          {isConnected ? (
            <span className="flex items-center gap-1 text-semantic-success font-medium">
              <CheckCircle2 size={13} />
              <span>Verified Active</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-semantic-warning font-medium">
              <AlertTriangle size={13} />
              <span>{connection.status}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleTest}
            disabled={isTesting}
            className="px-2.5 py-1.5 rounded-lg border border-hairline hover:border-primary/40 bg-canvas text-ink hover:text-primary transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Test connection ping & credentials"
          >
            <RefreshCw size={12} className={isTesting ? 'animate-spin' : ''} />
            <span>{isTesting ? 'Testing...' : 'Ping Test'}</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(connection.id)
            }}
            className="p-1.5 rounded-lg border border-hairline hover:border-semantic-danger/40 hover:bg-semantic-danger/10 text-muted hover:text-semantic-danger transition-all cursor-pointer"
            title="Delete connection"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}
