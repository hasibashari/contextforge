import React from 'react'
import {
  Sparkles,
  Terminal,
  FileText,
  Plus,
  PowerOff,
  Check,
} from 'lucide-react'
import type { Skill } from '@/shared/types/workspace'
import { Modal, ModalHeader, ModalFooter } from '@/shared/components/ui/Modal'
import { StatusPill } from '@/shared/components/ui/StatusPill'
import { SkillIconBox } from '@/shared/components/ui/IconBox'

interface SkillDetailDrawerProps {
  skill: Skill | null
  onClose: () => void
  onToggle: () => void
}

export const SkillDetailDrawer: React.FC<SkillDetailDrawerProps> = ({
  skill,
  onClose,
  onToggle,
}) => {
  if (!skill) return null

  const isEnabled = skill.enabled

  const renderSubtitle = () => (
    <>
      <span className="capitalize">{skill.category.replace('_', ' ')}</span>
      <span>·</span>
      <StatusPill status={isEnabled ? 'enabled' : 'disabled'} />
      {skill.isCustom && (
        <>
          <span>·</span>
          <span className="text-primary font-semibold">Custom</span>
        </>
      )}
    </>
  )

  const renderActions = () => (
    <div className="flex items-center gap-1.5">
      {isEnabled ? (
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-semantic-error hover:bg-semantic-error/10 border border-semantic-error/30 transition-colors cursor-pointer"
          title="Disable reasoning skill"
        >
          <PowerOff size={13} />
          <span>Disable</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center gap-1 px-3 py-1.5 bg-primary hover:bg-primary/90 text-canvas text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          title="Enable reasoning skill"
        >
          <Plus size={13} />
          <span>Enable</span>
        </button>
      )}
    </div>
  )

  return (
    <Modal isOpen={Boolean(skill)} onClose={onClose} size="2xl">
      <ModalHeader
        icon={<SkillIconBox category={skill.category} size="md" />}
        title={skill.name}
        subtitle={renderSubtitle()}
        onClose={onClose}
        actions={renderActions()}
      />

      <div className="space-y-4 text-xs">
        {/* Description */}
        <p className="text-body leading-relaxed text-xs">
          {skill.description}
        </p>

        {/* Reasoning Pipeline / SOP Summary */}
        <div className="p-3 bg-canvas-soft rounded-xl border border-hairline space-y-1 font-mono">
          <div className="text-muted text-[10px] uppercase tracking-caption flex items-center gap-1.5">
            <Sparkles size={12} className="text-primary" />
            <span>Standard Operating Procedure (SOP) Summary:</span>
          </div>
          <div className="text-ink font-medium leading-relaxed">
            {skill.sopSummary}
          </div>
        </div>

        {/* Full AI Instructions / Prompt Rules */}
        <div className="space-y-1.5">
          <div className="text-xs font-mono uppercase tracking-caption text-muted flex items-center gap-1.5">
            <FileText size={13} className="text-primary" />
            <span>AI Reasoning Rules &amp; Playbook Instructions:</span>
          </div>
          <pre className="p-3.5 bg-ink text-canvas font-mono text-xs rounded-xl whitespace-pre-wrap leading-relaxed border border-hairline max-h-44 overflow-y-auto">
            {skill.instructions}
          </pre>
        </div>

        {/* Permitted Sandboxed Tools */}
        <div className="space-y-1.5">
          <div className="text-xs font-mono uppercase tracking-caption text-muted flex items-center gap-1.5">
            <Terminal size={13} className="text-primary" />
            <span>Invoked MCP / System Tools ({skill.assignedTools.length}):</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono">
            {skill.assignedTools.map((tool) => (
              <div
                key={tool}
                className="p-2 rounded-lg bg-canvas border border-hairline flex items-center gap-2 text-ink"
              >
                <Terminal size={12} className="text-primary shrink-0" />
                <span className="truncate">{tool}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <ModalFooter className="justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-primary hover:bg-primary/90 text-xs font-semibold text-canvas rounded-lg shadow-xs cursor-pointer transition-colors flex items-center gap-1"
          >
            <Check size={13} />
            <span>Done</span>
          </button>
        </ModalFooter>
      </div>
    </Modal>
  )
}
