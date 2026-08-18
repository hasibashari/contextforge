import React from 'react'
import {
  X,
  Sparkles,
  Terminal,
  FileText,
  CheckCircle2,
  Plus,
  PowerOff,
  Check,
} from 'lucide-react'
import type { Skill } from '../../../shared/types/workspace'

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs">
      <div className="bg-surface-card border border-hairline rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto overscroll-contain animate-in fade-in zoom-in-95 duration-150">
        {/* Header with Top-Right Actions */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-base shadow-2xs shrink-0">
              <Sparkles size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-ink leading-tight">
                  {skill.name}
                </h2>
                <CheckCircle2
                  size={16}
                  className="text-primary shrink-0 fill-primary/10"
                />
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-muted mt-1">
                <span className="capitalize">{skill.category.replace('_', ' ')}</span>
                <span>·</span>
                <span
                  className={`font-semibold flex items-center gap-1 ${
                    isEnabled ? 'text-semantic-success' : 'text-muted'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isEnabled ? 'bg-semantic-success' : 'bg-muted'
                    }`}
                  />
                  {isEnabled ? 'Active SOP Playbook' : 'Disabled'}
                </span>
                {skill.isCustom && (
                  <>
                    <span>·</span>
                    <span className="text-primary font-semibold">Custom</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Top-Right Action Controls (Enable / Disable + Close) */}
          <div className="flex items-center gap-2 shrink-0">
            {isEnabled ? (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono text-semantic-success font-semibold px-2 py-1 rounded-lg bg-semantic-success/10 border border-semantic-success/20 hidden sm:flex items-center gap-1">
                  <CheckCircle2 size={12} />
                  <span>Enabled</span>
                </span>
                <button
                  type="button"
                  onClick={onToggle}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-semantic-error hover:bg-semantic-error/10 border border-semantic-error/30 transition-colors cursor-pointer"
                  title="Disable reasoning skill"
                >
                  <PowerOff size={13} />
                  <span>Disable</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onToggle}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-primary hover:bg-primary/90 text-canvas text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                title="Enable reasoning skill"
              >
                <Plus size={14} />
                <span>Enable Skill</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-canvas-soft text-muted hover:text-ink cursor-pointer transition-colors"
              title="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Description */}
        <div className="p-3.5 bg-canvas-soft rounded-xl border border-hairline text-xs text-body leading-relaxed">
          {skill.description}
        </div>

        {/* Reasoning Pipeline / SOP Summary */}
        <div className="p-3.5 bg-canvas rounded-xl border border-hairline space-y-1 text-xs font-mono">
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
            <span>AI Reasoning Rules & Playbook Instructions:</span>
          </div>
          <pre className="p-4 bg-ink text-canvas font-mono text-xs rounded-xl whitespace-pre-wrap leading-relaxed border border-hairline max-h-48 overflow-y-auto">
            {skill.instructions}
          </pre>
        </div>

        {/* Permitted Sandboxed Tools */}
        <div className="space-y-1.5">
          <div className="text-xs font-mono uppercase tracking-caption text-muted flex items-center gap-1.5">
            <Terminal size={13} className="text-primary" />
            <span>Invoked MCP / System Tools ({skill.assignedTools.length}):</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
            {skill.assignedTools.map((tool) => (
              <div
                key={tool}
                className="p-2.5 rounded-xl bg-canvas border border-hairline flex items-center gap-2 text-ink"
              >
                <Terminal size={13} className="text-primary shrink-0" />
                <span className="truncate">{tool}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-hairline flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-primary hover:bg-primary/90 text-xs font-semibold text-canvas rounded-xl shadow-xs cursor-pointer transition-colors flex items-center gap-1.5"
          >
            <Check size={14} />
            <span>Done</span>
          </button>
        </div>
      </div>
    </div>
  )
}
