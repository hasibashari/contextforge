import React from 'react'
import {
  Cpu,
  BookOpen,
  Calendar,
  Globe,
  Database,
  GitPullRequest,
  Mail,
  HardDrive,
  FileText,
  Settings,
  Plus,
} from 'lucide-react'
import type { Integration } from '@/shared/types/workspace'
import { EcosystemCard } from '@/shared/components/EcosystemCard'

interface IntegrationCardProps {
  integration: Integration
  onOpenDetail: () => void
}

export const IntegrationCard: React.FC<IntegrationCardProps> = ({
  integration,
  onOpenDetail,
}) => {
  const getIntegrationIcon = () => {
    const id = integration.id.toLowerCase()
    const name = integration.name.toLowerCase()

    if (id.includes('drive') || name.includes('drive')) {
      return (
        <div className="w-8 h-8 rounded-lg bg-canvas border border-hairline flex items-center justify-center shadow-2xs">
          <HardDrive size={18} className="text-semantic-success" />
        </div>
      )
    }
    if (id.includes('gmail') || name.includes('gmail') || name.includes('mail')) {
      return (
        <div className="w-8 h-8 rounded-lg bg-canvas border border-hairline flex items-center justify-center shadow-2xs">
          <Mail size={18} className="text-semantic-error" />
        </div>
      )
    }
    if (id.includes('notion') || name.includes('notion')) {
      return (
        <div className="w-8 h-8 rounded-lg bg-canvas border border-hairline flex items-center justify-center text-ink shadow-2xs">
          <FileText size={18} />
        </div>
      )
    }
    if (id.includes('obsidian') || name.includes('obsidian')) {
      return (
        <div className="w-8 h-8 rounded-lg bg-[#7c3aed]/10 border border-[#7c3aed]/20 flex items-center justify-center text-[#7c3aed] shadow-2xs">
          <BookOpen size={18} />
        </div>
      )
    }
    if (id.includes('calendar') || name.includes('calendar')) {
      return (
        <div className="w-8 h-8 rounded-lg bg-semantic-success/10 border border-semantic-success/20 flex items-center justify-center text-semantic-success shadow-2xs">
          <Calendar size={18} />
        </div>
      )
    }
    if (id.includes('search') || name.includes('search') || name.includes('web') || name.includes('tavily')) {
      return (
        <div className="w-8 h-8 rounded-lg bg-[#3b82f6]/10 border border-[#3b82f6]/20 flex items-center justify-center text-[#3b82f6] shadow-2xs">
          <Globe size={18} />
        </div>
      )
    }
    if (id.includes('github') || name.includes('git')) {
      return (
        <div className="w-8 h-8 rounded-lg bg-ink/10 border border-hairline flex items-center justify-center text-ink shadow-2xs">
          <GitPullRequest size={18} />
        </div>
      )
    }
    if (id.includes('postgres') || name.includes('database') || name.includes('sql')) {
      return (
        <div className="w-8 h-8 rounded-lg bg-[#06b6d4]/10 border border-[#06b6d4]/20 flex items-center justify-center text-[#06b6d4] shadow-2xs">
          <Database size={18} />
        </div>
      )
    }
    return (
      <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-2xs">
        <Cpu size={18} />
      </div>
    )
  }

  const isConnected = integration.status === 'connected'

  return (
    <EcosystemCard
      icon={getIntegrationIcon()}
      title={integration.name}
      description={integration.description}
      metaLine={`${integration.tools.length} Tools Ready · ${integration.latencyMs}ms · ${integration.version}`}
      actionIcon={isConnected ? <Settings size={16} /> : <Plus size={16} />}
      onClick={onOpenDetail}
      onActionClick={onOpenDetail}
      actionTooltip={
        isConnected
          ? 'Connected: Configure & test connector'
          : 'Connect MCP server'
      }
    />
  )
}
