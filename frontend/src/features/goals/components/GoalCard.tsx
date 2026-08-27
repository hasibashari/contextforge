import React, { useState } from 'react'
import {
  Target,
  Flame,
  Calendar,
  Smartphone,
  BookOpen,
  Sparkles,
  ChevronRight,
  Play,
  Pause,
  Trash2,
  Clock,
  MoreVertical,
  Activity,
} from 'lucide-react'
import type { Goal } from '@/shared/api/goalsApi'
import { Badge, IconBox } from '@/shared'

interface GoalCardProps {
  goal: Goal
  onOpenDetails: (goal: Goal) => void
  onEvaluate: (goal: Goal) => void
  onDelete: (goalId: string) => void
  onToggleStatus: (goal: Goal) => void
}

const CATEGORY_CONFIG: Record<
  string,
  { label: string; badgeVariant: 'success' | 'primary' | 'warning' | 'error' | 'neutral'; iconColor: string }
> = {
  productivity: {
    label: 'Productivity',
    badgeVariant: 'success',
    iconColor: 'text-semantic-success',
  },
  learning: {
    label: 'Learning & Skills',
    badgeVariant: 'primary',
    iconColor: 'text-primary',
  },
  health: {
    label: 'Health & Wellbeing',
    badgeVariant: 'warning',
    iconColor: 'text-amber-500',
  },
  finance: {
    label: 'Finance',
    badgeVariant: 'warning',
    iconColor: 'text-amber-600',
  },
  custom: {
    label: 'Custom Goal',
    badgeVariant: 'neutral',
    iconColor: 'text-muted',
  },
}

export const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  onOpenDetails,
  onEvaluate,
  onDelete,
  onToggleStatus,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isEvaluating, setIsEvaluating] = useState(false)

  const catConfig = CATEGORY_CONFIG[goal.category] || CATEGORY_CONFIG.productivity
  const progressPct = Math.min(Math.max(goal.current_progress_pct || 0, 0), 100)

  const handleRunEvaluation = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEvaluating(true)
    try {
      await onEvaluate(goal)
    } finally {
      setIsEvaluating(false)
    }
  }

  return (
    <div
      onClick={() => onOpenDetails(goal)}
      className="group relative bg-surface-card hover:bg-surface-card border border-hairline hover:border-primary/40 rounded-2xl p-5 transition-all duration-200 shadow-2xs hover:shadow-md flex flex-col justify-between cursor-pointer select-none active:scale-[0.99]"
    >
      {/* Top Header Row */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={catConfig.badgeVariant} size="sm">
              {catConfig.label}
            </Badge>

            {goal.status === 'active' ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-semantic-success bg-semantic-success-soft px-2.5 py-0.5 rounded-full border border-semantic-success/20 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-semantic-success animate-pulse" />
                Active Loop
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-muted bg-surface-strong px-2.5 py-0.5 rounded-full border border-hairline font-medium">
                <Pause size={10} />
                Paused
              </span>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setIsMenuOpen(!isMenuOpen)
              }}
              className="p-1.5 rounded-xl text-muted hover:text-ink hover:bg-surface-strong transition-colors cursor-pointer"
              title="Goal Options"
              aria-label="Goal options"
            >
              <MoreVertical size={15} />
            </button>

            {isMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsMenuOpen(false)
                  }}
                />
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-8 w-44 bg-surface-card border border-hairline rounded-2xl shadow-xl py-1.5 z-50 text-xs font-sans space-y-0.5 animate-in fade-in zoom-in-95 duration-100"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false)
                      onToggleStatus(goal)
                    }}
                    className="w-full px-3.5 py-2 text-left hover:bg-surface-strong flex items-center gap-2.5 text-ink cursor-pointer transition-colors"
                  >
                    {goal.status === 'active' ? (
                      <>
                        <Pause size={14} className="text-muted" />
                        <span>Pause Goal Cycle</span>
                      </>
                    ) : (
                      <>
                        <Play size={14} className="text-primary" />
                        <span>Resume Goal Cycle</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false)
                      onDelete(goal.id)
                    }}
                    className="w-full px-3.5 py-2 text-left hover:bg-semantic-error-soft flex items-center gap-2.5 text-semantic-error cursor-pointer transition-colors font-medium"
                  >
                    <Trash2 size={14} />
                    <span>Delete Goal</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-1.5 mb-4">
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 shrink-0">
              <IconBox size="sm" variant="primary" icon={<Target size={14} />} />
            </div>
            <h3 className="text-sm sm:text-base font-semibold text-ink group-hover:text-primary transition-colors leading-snug line-clamp-1">
              {goal.title}
            </h3>
          </div>

          {goal.description && (
            <p className="text-xs text-muted line-clamp-2 leading-relaxed font-sans pl-8">
              {goal.description}
            </p>
          )}
        </div>
      </div>

      {/* Progress, Metrics & Footer */}
      <div className="space-y-4 pt-3.5 border-t border-hairline">
        {/* Progress Bar & Streak */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-[11px] text-muted font-medium">
              <Activity size={12} className="text-primary" />
              <span>Compliance Rate:</span>
              <strong className="font-mono text-ink font-semibold">{progressPct}%</strong>
            </div>

            <div className="flex items-center gap-1 text-amber-600 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 font-mono text-[11px] font-semibold">
              <Flame size={12} className="text-amber-500 animate-pulse" />
              <span>{goal.streak_days || 0}d Streak</span>
            </div>
          </div>

          <div className="w-full h-2 bg-surface-strong rounded-full overflow-hidden p-0.5 border border-hairline-soft">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Connected MCP Assist Chips & Schedule */}
        <div className="flex items-center justify-between text-xs text-muted">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono uppercase tracking-caption text-muted">MCPs:</span>
            <div className="flex items-center gap-1">
              <span
                title="Android Bridge Telemetry"
                className="p-1 rounded-lg bg-surface-strong border border-hairline text-semantic-success hover:bg-canvas transition-colors"
              >
                <Smartphone size={12} />
              </span>
              <span
                title="Google Calendar Schedule"
                className="p-1 rounded-lg bg-surface-strong border border-hairline text-primary hover:bg-canvas transition-colors"
              >
                <Calendar size={12} />
              </span>
              <span
                title="Notion Journal & Database"
                className="p-1 rounded-lg bg-surface-strong border border-hairline text-amber-500 hover:bg-canvas transition-colors"
              >
                <BookOpen size={12} />
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted bg-surface-strong/60 px-2 py-0.5 rounded-lg border border-hairline">
            <Clock size={11} className="text-primary" />
            <span>21:00 Daily Eval</span>
          </div>
        </div>

        {/* M3 Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleRunEvaluation}
            disabled={isEvaluating}
            className="flex-1 px-3.5 py-2.5 rounded-2xl bg-surface-strong hover:bg-primary-soft text-ink hover:text-primary border border-hairline hover:border-primary-subtle text-xs font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-2xs active:scale-[0.98]"
          >
            <Sparkles size={13} className={`text-primary ${isEvaluating ? 'animate-spin' : ''}`} />
            <span>{isEvaluating ? 'Evaluating...' : 'Run Reflection (AI)'}</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenDetails(goal)}
            className="p-2.5 rounded-2xl bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-active transition-all shadow-xs flex items-center justify-center cursor-pointer active:scale-95"
            title="Inspect Sub-Tasks & Telemetry"
            aria-label="Inspect goal tasks and evidence"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
