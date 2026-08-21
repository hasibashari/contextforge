import React from 'react'
import {
  Sparkles,
  Terminal,
  FileText,
  Plus,
  PowerOff,
  Check,
  Layers,
  Wrench,
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

interface SkillDetailModalProps {
  skill: Skill | null
  onClose: () => void
  onToggle: () => void
}

export const SkillDetailModal: React.FC<SkillDetailModalProps> = ({
  skill,
  onClose,
  onToggle,
}) => {
  if (!skill) return null

  const isEnabled = skill.enabled

  const renderSubtitle = () => (
    <div className="flex items-center gap-2 flex-wrap">
      <Badge variant="neutral" size="xs">
        {skill.category.replace('_', ' ')}
      </Badge>
      <span className="text-hairline">·</span>
      <StatusPill status={isEnabled ? 'enabled' : 'disabled'} />
      <span className="text-hairline">·</span>
      <span className="text-[11px] text-muted font-mono">
        {skill.assignedTools.length} Tools Bound
      </span>
      {skill.isCustom && (
        <>
          <span className="text-hairline">·</span>
          <Badge variant="primary" size="xs">
            Custom
          </Badge>
        </>
      )}
    </div>
  )

  const renderActions = () => (
    <div className="flex items-center gap-2">
      {isEnabled ? (
        <Button
          variant="danger"
          size="xs"
          leftIcon={<PowerOff size={12} />}
          onClick={onToggle}
          title="Disable reasoning skill in workspace"
        >
          Disable SOP
        </Button>
      ) : (
        <Button
          variant="primary"
          size="xs"
          leftIcon={<Plus size={12} />}
          onClick={onToggle}
          title="Enable reasoning skill in workspace"
        >
          Enable SOP
        </Button>
      )}
    </div>
  )

  return (
    <Modal isOpen={Boolean(skill)} onClose={onClose} size="3xl">
      <ModalHeader
        icon={<SkillIconBox skill={skill} category={skill.category} size="md" />}
        title={skill.name}
        subtitle={renderSubtitle()}
        onClose={onClose}
        actions={renderActions()}
      />

      <div className="space-y-4 text-xs font-sans">
        {/* Description & Overview Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 bg-canvas-soft rounded-xl border border-hairline font-mono text-[11px]">
          <div>
            <div className="text-muted text-[10px] uppercase flex items-center gap-1">
              <Layers size={11} className="text-primary" />
              <span>Skill Category</span>
            </div>
            <div className="font-semibold text-ink mt-0.5 capitalize">
              {skill.category.replace('_', ' ')}
            </div>
          </div>
          <div>
            <div className="text-muted text-[10px] uppercase flex items-center gap-1">
              <Sparkles size={11} className="text-primary" />
              <span>Runtime State</span>
            </div>
            <div className="font-semibold text-ink mt-0.5 flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isEnabled ? 'bg-semantic-success animate-pulse' : 'bg-muted'
                }`}
              />
              <span>{isEnabled ? 'Active in Workspace' : 'Inactive (Disabled)'}</span>
            </div>
          </div>
          <div>
            <div className="text-muted text-[10px] uppercase flex items-center gap-1">
              <Wrench size={11} className="text-primary" />
              <span>Execution Scope</span>
            </div>
            <div className="font-semibold text-ink mt-0.5">
              {skill.assignedTools.length} Authorized Tools
            </div>
          </div>
        </div>

        {/* SOP Summary Box */}
        <div className="p-3.5 bg-canvas rounded-xl border border-hairline space-y-1.5 shadow-2xs">
          <div className="text-muted text-[10px] font-mono uppercase tracking-caption flex items-center gap-1.5">
            <Sparkles size={12} className="text-primary" />
            <span>Standard Operating Procedure (SOP) Summary:</span>
          </div>
          <p className="text-ink text-xs leading-relaxed font-sans">
            {skill.sopSummary || skill.description}
          </p>
        </div>

        {/* Symmetrical Two-Column Content: Instructions (Left) & Tools (Right) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 items-stretch">
          {/* Column 1: AI Reasoning Instructions */}
          <div className="p-3.5 bg-canvas rounded-xl border border-hairline flex flex-col justify-between space-y-2 shadow-2xs">
            <div className="text-[11px] font-mono font-semibold uppercase tracking-caption text-muted flex items-center gap-1.5">
              <FileText size={12} className="text-primary" />
              <span>Playbook Instructions</span>
            </div>
            <pre className="p-2.5 bg-canvas-soft border border-hairline/60 text-ink font-mono text-[11px] rounded-lg whitespace-pre-wrap leading-relaxed h-44 overflow-y-auto">
              {skill.instructions}
            </pre>
          </div>

          {/* Column 2: Authorized MCP Tools */}
          <div className="p-3.5 bg-canvas rounded-xl border border-hairline flex flex-col justify-between space-y-2 shadow-2xs">
            <div className="text-[11px] font-mono font-semibold uppercase tracking-caption text-muted flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Terminal size={12} className="text-primary" />
                <span>Authorized MCP Tools</span>
              </span>
              <Badge variant="neutral" size="xs">
                {skill.assignedTools.length} Tools
              </Badge>
            </div>

            <div className="p-2.5 bg-canvas-soft border border-hairline/60 rounded-lg h-44 overflow-y-auto space-y-1.5">
              {skill.assignedTools.map((tool) => (
                <div
                  key={tool}
                  className="p-2 rounded-md bg-surface-card border border-hairline flex items-center justify-between gap-2 text-ink font-mono text-[11px]"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Terminal size={12} className="text-primary shrink-0" />
                    <span className="truncate font-medium">{tool}</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-semantic-success/10 text-semantic-success border border-semantic-success/20 font-semibold shrink-0">
                    AUTHORIZED
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Symmetrical Footer */}
      <ModalFooter className="flex items-center justify-between">
        <div className="text-xs font-mono text-muted flex items-center gap-1.5">
          <span>Status:</span>
          <span className={isEnabled ? 'text-semantic-success font-semibold' : 'text-muted'}>
            {isEnabled ? '● Active' : '○ Inactive'}
          </span>
        </div>
        <Button variant="primary" size="sm" leftIcon={<Check size={13} />} onClick={onClose}>
          Done
        </Button>
      </ModalFooter>
    </Modal>
  )
}
