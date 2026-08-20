import React from 'react'
import { Settings, Plus } from 'lucide-react'
import type { Skill } from '@/shared/types/workspace'
import { EcosystemCard } from '@/shared/components/EcosystemCard'
import { SkillIconBox } from '@/shared/components/ui/IconBox'

interface SkillCardProps {
  skill: Skill
  onToggle: () => void
  onInspect: () => void
}

export const SkillCard: React.FC<SkillCardProps> = ({
  skill,
  onInspect,
}) => {
  return (
    <EcosystemCard
      icon={<SkillIconBox category={skill.category} size="sm" />}
      title={skill.name}
      description={skill.description}
      badge={skill.isCustom ? 'Custom' : skill.category.replace('_', ' ')}
      metaLine={`${skill.assignedTools.length} Permitted Tools · ${
        skill.enabled ? 'Active in Workspace' : 'Inactive SOP'
      }`}
      actionIcon={skill.enabled ? <Settings size={16} /> : <Plus size={16} />}
      onClick={onInspect}
      onActionClick={onInspect}
      actionTooltip={
        skill.enabled
          ? 'Active SOP: Click to inspect & configure'
          : 'Enable reasoning skill SOP'
      }
    />
  )
}
