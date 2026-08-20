import React from 'react'
import {
  FileText,
  BookOpen,
  Settings,
  Plus,
  Loader2,
  AlertCircle,
  UploadCloud,
  HardDrive,
  Globe,
  Database,
  Terminal,
  Layers,
} from 'lucide-react'
import type { KnowledgeSource } from '@/shared/types/workspace'
import { EcosystemCard } from '@/shared/components/EcosystemCard'

interface KnowledgeSourceCardProps {
  source: KnowledgeSource
  onOpenDetail: () => void
}

export const KnowledgeSourceCard: React.FC<KnowledgeSourceCardProps> = ({
  source,
  onOpenDetail,
}) => {
  const getSourceIcon = (type: KnowledgeSource['type']) => {
    switch (type) {
      case 'document_upload':
      case 'document':
        return (
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-2xs">
            <UploadCloud size={18} />
          </div>
        )
      case 'obsidian_vault':
        return (
          <div className="w-8 h-8 rounded-lg bg-[#7c3aed]/10 border border-[#7c3aed]/20 flex items-center justify-center text-[#7c3aed] shadow-2xs">
            <BookOpen size={18} />
          </div>
        )
      case 'local_folder':
        return (
          <div className="w-8 h-8 rounded-lg bg-semantic-success/10 border border-semantic-success/20 flex items-center justify-center text-semantic-success shadow-2xs">
            <HardDrive size={18} />
          </div>
        )
      case 'github_repo':
        return (
          <div className="w-8 h-8 rounded-lg bg-ink/10 border border-hairline flex items-center justify-center text-ink shadow-2xs">
            <Terminal size={18} />
          </div>
        )
      case 'notion_workspace':
        return (
          <div className="w-8 h-8 rounded-lg bg-canvas border border-hairline flex items-center justify-center text-ink shadow-2xs">
            <Layers size={18} />
          </div>
        )
      case 'openapi_spec':
      case 'web_search':
        return (
          <div className="w-8 h-8 rounded-lg bg-[#06b6d4]/10 border border-[#06b6d4]/20 flex items-center justify-center text-[#06b6d4] shadow-2xs">
            <Globe size={18} />
          </div>
        )
      case 'database_schema':
        return (
          <div className="w-8 h-8 rounded-lg bg-semantic-success/10 border border-semantic-success/20 flex items-center justify-center text-semantic-success shadow-2xs">
            <Database size={18} />
          </div>
        )
      default:
        return (
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-2xs">
            <FileText size={18} />
          </div>
        )
    }
  }

  const getEnvBadge = () => {
    if (source.type === 'local_folder' || source.location.includes('folder')) {
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
      icon={getSourceIcon(source.type)}
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
