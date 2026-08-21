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
import {
  Modal,
  ModalHeader,
  ModalFooter,
  StatusPill,
  SkillIconBox,
  Button,
  Badge,
} from '@/shared/components'

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
          <Badge variant="primary" size="xs">
            Custom
          </Badge>
        </>
      )}
    </>
  )

  const renderActions = () => (
    <div className="flex items-center gap-1.5">
      {isEnabled ? (
        <Button
          variant="danger"
          size="xs"
          leftIcon={<PowerOff size={13} />}
          onClick={onToggle}
          title="Disable reasoning skill"
        >
          Disable
        </Button>
      ) : (
        <Button
          variant="primary"
          size="xs"
          leftIcon={<Plus size={13} />}
          onClick={onToggle}
          title="Enable reasoning skill"
        >
          Enable
        </Button>
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

      <div className="space-y-3.5 text-xs font-sans">
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
          <div className="text-ink font-medium leading-relaxed text-xs">
            {skill.sopSummary}
          </div>
        </div>

        {/* AI Reasoning Playbook Rules */}
        <div className="space-y-1">
          <div className="text-[11px] font-mono uppercase tracking-caption text-muted flex items-center gap-1.5">
            <FileText size={12} className="text-primary" />
            <span>AI Reasoning Rules &amp; Playbook Instructions:</span>
          </div>
          <pre className="p-3 bg-canvas border border-hairline text-ink font-mono text-xs rounded-xl whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto">
            {skill.instructions}
          </pre>
        </div>

        {/* Permitted Sandboxed Tools */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-mono uppercase tracking-caption text-muted flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Terminal size={12} className="text-primary" />
              <span>Invoked MCP / System Tools ({skill.assignedTools.length}):</span>
            </span>
            <Badge variant="neutral" size="xs">
              {skill.assignedTools.length} Tools
            </Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono">
            {skill.assignedTools.map((tool) => (
              <div
                key={tool}
                className="p-2 rounded-lg bg-canvas border border-hairline flex items-center gap-2 text-ink"
              >
                <Terminal size={12} className="text-primary shrink-0" />
                <span className="truncate text-xs">{tool}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <ModalFooter className="justify-end">
          <Button variant="primary" size="sm" leftIcon={<Check size={13} />} onClick={onClose}>
            Done
          </Button>
        </ModalFooter>
      </div>
    </Modal>
  )
}
