import React from 'react'
import { Settings, Plus, Loader2, AlertCircle } from 'lucide-react'
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
  const getCleanSubtitle = () => {
    if (source.subfolderScope) {
      return `/${source.subfolderScope}`
    }
    if (source.type === 'obsidian_vault') {
      return 'Obsidian Vault'
    }
    if (source.type === 'local_folder') {
      return 'Paired Local Folder'
    }
    if (source.type === 'document_upload') {
      return 'Uploaded Documents'
    }
    if (source.type === 'github_repo') {
      return 'GitHub Repository'
    }
    if (source.type === 'database_schema') {
      return 'PostgreSQL Schema'
    }
    return source.location
  }

  const isSynced = source.status === 'synced'
  const isSyncing = source.status === 'syncing'
  const isError = source.status === 'error'

  const getBadgeLabel = () => {
    if (isSyncing) return 'Indexing...'
    if (isSynced) return 'Synced'
    if (isError) return 'Error'
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
      subtitle={getCleanSubtitle()}
      description={source.description}
      badge={getBadgeLabel()}
      badgeVariant={getBadgeVariant()}
      metaLine={`${source.filesCount} Files · ${source.chunksCount} Chunks · ${source.lastSynced}`}
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
