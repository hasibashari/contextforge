import React from 'react'
import { Zap } from 'lucide-react'
import type { Skill } from '@/shared/types/workspace'

interface SlashCommandPopoverProps {
  skills: Skill[]
  onSelectSkill: (skillCommand: string) => void
}

export const SlashCommandPopover: React.FC<SlashCommandPopoverProps> = ({
  skills,
  onSelectSkill,
}) => {
  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 bg-surface-card border border-hairline rounded-xl p-2 shadow-xl space-y-1 text-xs font-mono max-h-48 overflow-y-auto z-20">
      <div className="text-[10px] uppercase text-muted px-2 py-1 flex items-center gap-1">
        <Zap size={11} className="text-primary" />
        <span>Available Reasoning Skills:</span>
      </div>
      {skills.map((skill) => (
        <button
          key={skill.id}
          type="button"
          onClick={() => onSelectSkill(skill.id.replace('skill-', ''))}
          className="w-full px-2.5 py-1.5 rounded-lg hover:bg-canvas-soft text-left flex items-center justify-between text-ink transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span className="font-semibold text-primary">
              /{skill.id.replace('skill-', '')}
            </span>
            <span className="text-muted truncate">{skill.name}</span>
          </div>
          <span className="text-[10px] text-muted">{skill.category}</span>
        </button>
      ))}
    </div>
  )
}
