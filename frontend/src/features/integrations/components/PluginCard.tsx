import React from 'react'
import { Package, Settings, Plus } from 'lucide-react'
import type { Plugin, Integration, Skill } from '@/shared/types/workspace'
import { EcosystemCard } from '@/shared/components/EcosystemCard'
import { IconBox } from '@/shared/components/ui/IconBox'

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

  return (
    <EcosystemCard
      icon={<IconBox size="sm" variant="primary" icon={<Package size={17} />} />}
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
