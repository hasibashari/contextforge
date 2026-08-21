import { useState } from 'react'
import {
  Play,
  Clock,
  Zap,
  Bot,
  Cpu,
  MoreVertical,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldAlert,
  FileText,
} from 'lucide-react'
import type { AutomationWorkflow } from '@/shared/types/workspace'

interface AutomationCardProps {
  workflow: AutomationWorkflow
  isRunning: boolean
  onRunNow: (id: string) => void
  onToggleActive: (id: string) => void
  onEdit: (workflow: AutomationWorkflow) => void
  onDelete: (id: string) => void
}

export function AutomationCard({
  workflow,
  isRunning,
  onRunNow,
  onToggleActive,
  onEdit,
  onDelete,
}: AutomationCardProps) {
  const [showMenu, setShowMenu] = useState(false)

  const isObsidian =
    workflow.mcpServerId?.includes('obsidian') ||
    workflow.mcpTools.some((t) => t.includes('obsidian')) ||
    workflow.name.toLowerCase().includes('obsidian')

  const formatLastRun = (timestamp?: string) => {
    if (!timestamp) return 'Never executed'
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' (' + date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ')'
  }

  return (
    <div
      className={`relative rounded-xl border transition-all duration-200 bg-surface-card p-5 flex flex-col justify-between gap-4 ${
        isRunning
          ? 'border-primary/60 shadow-md ring-1 ring-primary/20 bg-primary/5'
          : workflow.isActive
          ? 'border-hairline hover:border-hairline-strong hover:shadow-xs'
          : 'border-hairline/60 opacity-75 bg-canvas-soft'
      }`}
    >
      {/* Top Header: Trigger Badge, Title, Menu & Toggle */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Trigger Badge */}
            {workflow.triggerType === 'schedule' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-medium bg-primary/10 text-primary border border-primary/20">
                <Clock size={12} />
                <span>{workflow.scheduleLabel || workflow.scheduleCron}</span>
              </span>
            ) : workflow.triggerType === 'event' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <Zap size={12} />
                <span>{workflow.scheduleLabel || 'Event Watcher'}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-medium bg-surface-strong text-muted border border-hairline">
                <Play size={12} />
                <span>Manual Trigger</span>
              </span>
            )}

            {/* Obsidian Protocol Tag */}
            {isObsidian && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                <FileText size={11} />
                <span>Obsidian MCP</span>
              </span>
            )}

            {/* Guardrail Badge */}
            {workflow.guardrailStrictHITL && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-semantic-warning/10 text-semantic-warning border border-semantic-warning/20">
                <ShieldAlert size={11} />
                <span>Strict HITL</span>
              </span>
            )}
          </div>

          {/* Active Switch & Menu */}
          <div className="flex items-center gap-2">
            {/* Active Toggle Pill */}
            <button
              type="button"
              onClick={() => onToggleActive(workflow.id)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                workflow.isActive ? 'bg-primary' : 'bg-surface-strong'
              }`}
              title={workflow.isActive ? 'Pause automation' : 'Activate automation'}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  workflow.isActive ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>

            {/* Context Menu Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMenu((prev) => !prev)}
                className="p-1 rounded-md text-muted hover:text-ink hover:bg-surface-strong transition-colors"
              >
                <MoreVertical size={15} />
              </button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 mt-1 w-36 rounded-lg bg-surface-card border border-hairline shadow-md py-1 z-30 space-y-0.5">
                    <button
                      onClick={() => {
                        setShowMenu(false)
                        onEdit(workflow)
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-body hover:text-ink hover:bg-surface-strong text-left"
                    >
                      <Edit2 size={13} />
                      <span>Edit Rules</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false)
                        onDelete(workflow.id)
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-semantic-error hover:bg-semantic-error/10 text-left"
                    >
                      <Trash2 size={13} />
                      <span>Delete</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Title & Description */}
        <div>
          <h3 className="text-sm font-semibold text-ink tracking-tight flex items-center gap-2">
            {workflow.name}
          </h3>
          <p className="text-xs text-muted mt-1 line-clamp-2 leading-relaxed">
            {workflow.description}
          </p>
        </div>

        {/* Agent & MCP Tools Assignment */}
        <div className="space-y-1.5 pt-2 border-t border-hairline-soft">
          <div className="flex items-center gap-2 text-xs text-body">
            <Bot size={13} className="text-muted shrink-0" />
            <span className="truncate font-medium">
              {workflow.agentName || workflow.agentId}
            </span>
          </div>

          {workflow.mcpTools && workflow.mcpTools.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <Cpu size={13} className="text-muted shrink-0" />
              {workflow.mcpTools.map((tool) => (
                <span
                  key={tool}
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-strong text-muted border border-hairline"
                >
                  {tool}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Footer: Last Run Status & Run Now CTA */}
      <div className="pt-3 border-t border-hairline flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-xs text-muted">
          {isRunning ? (
            <div className="flex items-center gap-1.5 text-primary font-medium">
              <Loader2 size={13} className="animate-spin" />
              <span>Executing steps...</span>
            </div>
          ) : workflow.lastRunStatus === 'success' ? (
            <div className="flex items-center gap-1 text-semantic-success text-[11px]">
              <CheckCircle2 size={12} />
              <span>Ran {formatLastRun(workflow.lastRunAt)}</span>
            </div>
          ) : workflow.lastRunStatus === 'failed' ? (
            <div className="flex items-center gap-1 text-semantic-error text-[11px]">
              <AlertCircle size={12} />
              <span>Failed {formatLastRun(workflow.lastRunAt)}</span>
            </div>
          ) : (
            <span className="text-[11px]">Ready ({workflow.totalRuns || 0} runs)</span>
          )}
        </div>

        {/* Action Button: Run Now */}
        <button
          type="button"
          disabled={isRunning || !workflow.isActive}
          onClick={() => onRunNow(workflow.id)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-2xs transition-all cursor-pointer ${
            isRunning
              ? 'bg-primary/20 text-primary cursor-wait'
              : !workflow.isActive
              ? 'bg-surface-strong text-muted cursor-not-allowed'
              : 'bg-primary hover:bg-primary-active text-on-primary'
          }`}
        >
          {isRunning ? (
            <>
              <Loader2 size={13} className="animate-spin" />
              <span>Running...</span>
            </>
          ) : (
            <>
              <Play size={12} className="fill-current" />
              <span>Run Now</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
