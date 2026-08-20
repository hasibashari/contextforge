import React from 'react'
import {
  Settings,
  Plus,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import type { KnowledgeSource } from '@/shared/types/workspace'
import { EcosystemCard } from '@/shared/components/EcosystemCard'
import { KnowledgeIconBox } from '@/shared/components/ui/IconBox'

interface KnowledgeSourceCardProps {
  source: KnowledgeSource
  onOpenDetail: () => void
}

export const KnowledgeSourceCard: React.FC<KnowledgeSourceCardProps> = ({
  source,
  onOpenDetail,
}) => {
  const getEnvBadge = () => {
    if (source.type === 'obsidian_vault') {
      return source.subfolderScope ? `[OBSIDIAN: /${source.subfolderScope}]` : '[OBSIDIAN VAULT]'
    }
    if (source.subfolderScope) {
      return `[FOLDER: /${source.subfolderScope}]`
    }
    if (source.type === 'local_folder' || source.location.includes('paired') || source.location.includes('folder')) {
      return '[LOCAL FOLDER]'
    }
    if (source.type === 'document_upload' || source.type === 'document') {
      return '[LOCAL DOCUMENTS]'
    }
    if (source.type === 'github_repo') {
      return '[GIT REPO]'
    }
    if (source.type === 'database_schema') {
      return '[POSTGRES MCP]'
    }
    return '[KNOWLEDGE BASE]'
  }

  const isSynced = source.status === 'synced'
  const isSyncing = source.status === 'syncing'
  const isError = source.status === 'error'

  const getBadgeLabel = () => {
    if (isSyncing) return 'Indexing...'
    if (isSynced) return 'Vector Synced'
    if (isError) return 'Sync Error'
    return 'Muted'
  }

  const getBadgeVariant = (): 'success' | 'warning' | 'neutral' => {
    if (isSynced) return 'success'
    if (isSyncing || isError) return 'warning'
    return 'neutral'
  }

  return (
    <EcosystemCard
      icon={<KnowledgeIconBox type={source.type} size="sm" />}
      title={source.name}
      subtitle={`${getEnvBadge()} ${source.location}`}
      description={source.description}
      badge={getBadgeLabel()}
      badgeVariant={getBadgeVariant()}
      metaLine={
        <div className="flex items-center justify-between w-full">
          <span>
            {source.filesCount} Files · {source.chunksCount} Chunks (1536-dim) · {source.lastSynced}
          </span>
          <span className="text-primary font-semibold hover:underline">
            Inspect Details →
          </span>
        </div>
      }
      actionIcon={
        isSyncing ? (
          <Loader2 size={16} className="animate-spin text-primary" />
        ) : isError ? (
          <AlertCircle size={16} className="text-semantic-error" />
        ) : isSynced ? (
          <Settings size={16} />
        ) : (
          <Plus size={16} />
        )
      }
      onClick={onOpenDetail}
      onActionClick={onOpenDetail}
      actionTooltip={
        isSynced
          ? 'Grounding Active: Configure & re-index'
          : 'Grounding Muted: Click to inspect & activate'
      }
    />
  )
}
