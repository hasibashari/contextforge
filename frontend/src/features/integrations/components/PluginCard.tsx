import React from 'react'
import { Package, Settings, Plus } from 'lucide-react'
import type { Plugin, Integration, Skill } from '@/shared/types/workspace'
import { EcosystemCard } from '@/shared/components/EcosystemCard'

interface PluginCardProps {
  plugin: Plugin
  allConnectors: Integration[]
  allSkills: Skill[]
  onOpenDetail: () => void
  onToggleInstall?: () => void
}

export const PluginCard: React.FC<PluginCardProps> = ({
  plugin,
  allConnectors,
  allSkills,
  onOpenDetail,
  onToggleInstall,
}) => {
  const bundledConnectors = allConnectors.filter((c) =>
    plugin.bundledConnectorIds.includes(c.id)
  )
  const bundledSkills = allSkills.filter((s) =>
    plugin.bundledSkillIds.includes(s.id)
  )

  const icon = (
    <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-2xs">
      <Package size={18} />
    </div>
  )

  return (
    <EcosystemCard
      icon={icon}
      title={plugin.name}
      description={plugin.description}
      badge={plugin.badge}
      metaLine={`${bundledConnectors.length} Connectors · ${bundledSkills.length} Skills · by ${plugin.author}`}
      actionIcon={plugin.installed ? <Settings size={16} /> : <Plus size={16} />}
      onClick={onOpenDetail}
      onActionClick={onToggleInstall || onOpenDetail}
      actionTooltip={
        plugin.installed
          ? 'Installed: Configure & manage plugin pack'
          : '1-Click Install Pack'
      }
    />
  )
}
