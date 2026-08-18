import React from 'react'
import {
  Terminal,
  Layers,
  Globe,
  Database,
  FileText,
  BookOpen,
  Settings,
  Plus,
} from 'lucide-react'
import type { KnowledgeSource } from '../../../shared/types/workspace'
import { EcosystemCard } from '../../../shared/components/EcosystemCard'

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
      case 'obsidian_vault':
        return (
          <div className="w-8 h-8 rounded-lg bg-[#7c3aed]/10 border border-[#7c3aed]/20 flex items-center justify-center text-[#7c3aed] shadow-2xs">
            <BookOpen size={18} />
          </div>
        )
      case 'web_search':
        return (
          <div className="w-8 h-8 rounded-lg bg-[#3b82f6]/10 border border-[#3b82f6]/20 flex items-center justify-center text-[#3b82f6] shadow-2xs">
            <Globe size={18} />
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

  const isSynced = source.status === 'synced'
  const isSyncing = source.status === 'syncing'

  return (
    <EcosystemCard
      icon={getSourceIcon(source.type)}
      title={source.name}
      description={source.description}
      badge={isSyncing ? 'Syncing...' : isSynced ? 'Synced' : 'Disconnected'}
      metaLine={`${source.filesCount} Files · ${source.chunksCount} Chunks · Updated ${source.lastSynced}`}
      actionIcon={isSynced ? <Settings size={16} /> : <Plus size={16} />}
      onClick={onOpenDetail}
      onActionClick={onOpenDetail}
      actionTooltip={
        isSynced
          ? 'Grounding Active: Configure & re-index'
          : 'Connect & index knowledge source'
      }
    />
  )
}
