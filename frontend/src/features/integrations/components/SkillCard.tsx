import React from 'react'
import {
  Sparkles,
  TestTube2,
  ShieldAlert,
  BookOpen,
  Database,
  Layers,
  Settings,
  Plus,
} from 'lucide-react'
import type { Skill } from '@/shared/types/workspace'
import { EcosystemCard } from '@/shared/components/EcosystemCard'

interface SkillCardProps {
  skill: Skill
  onToggle: () => void
  onInspect: () => void
}

export const SkillCard: React.FC<SkillCardProps> = ({
  skill,
  onInspect,
}) => {
  const getCategoryIcon = () => {
    switch (skill.category) {
      case 'qa_testing':
        return (
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-2xs">
            <TestTube2 size={18} />
          </div>
        )
      case 'security':
        return (
          <div className="w-8 h-8 rounded-lg bg-semantic-error/10 border border-semantic-error/20 flex items-center justify-center text-semantic-error shadow-2xs">
            <ShieldAlert size={18} />
          </div>
        )
      case 'knowledge':
        return (
          <div className="w-8 h-8 rounded-lg bg-[#3b82f6]/10 border border-[#3b82f6]/20 flex items-center justify-center text-[#3b82f6] shadow-2xs">
            <BookOpen size={18} />
          </div>
        )
      case 'database':
        return (
          <div className="w-8 h-8 rounded-lg bg-semantic-success/10 border border-semantic-success/20 flex items-center justify-center text-semantic-success shadow-2xs">
            <Database size={18} />
          </div>
        )
      case 'architecture':
        return (
          <div className="w-8 h-8 rounded-lg bg-[#8c52ff]/10 border border-[#8c52ff]/20 flex items-center justify-center text-[#8c52ff] shadow-2xs">
            <Layers size={18} />
          </div>
        )
      default:
        return (
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-2xs">
            <Sparkles size={18} />
          </div>
        )
    }
  }

  return (
    <EcosystemCard
      icon={getCategoryIcon()}
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
