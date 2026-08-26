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
} from 'lucide-react'
import type { Goal } from '@/shared/api/goalsApi'
import { Badge } from '@/shared'

interface GoalCardProps {
  goal: Goal
  onOpenDetails: (goal: Goal) => void
  onEvaluate: (goal: Goal) => void
  onDelete: (goalId: string) => void
  onToggleStatus: (goal: Goal) => void
}

const CATEGORY_CONFIG: Record<
  string,
  { label: string; badgeVariant: 'success' | 'primary' | 'warning' | 'error' | 'neutral' }
> = {
  productivity: {
    label: 'Productivity',
    badgeVariant: 'success',
  },
  learning: {
    label: 'Learning & Skill',
    badgeVariant: 'primary',
  },
  health: {
    label: 'Health & Wellbeing',
    badgeVariant: 'warning',
  },
  finance: {
    label: 'Finance',
    badgeVariant: 'warning',
  },
  custom: {
    label: 'Custom Goal',
    badgeVariant: 'neutral',
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
      className="group relative bg-surface-card hover:bg-surface-card border border-hairline hover:border-primary/40 rounded-2xl p-5 transition-all duration-200 shadow-2xs hover:shadow-md flex flex-col justify-between cursor-pointer select-none"
    >
      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={catConfig.badgeVariant} size="sm">
              {catConfig.label}
            </Badge>

            {goal.status === 'active' ? (
              <span className="flex items-center gap-1 text-[11px] font-mono text-semantic-success bg-semantic-success/10 px-2 py-0.5 rounded-full border border-semantic-success/20">
                <span className="w-1.5 h-1.5 rounded-full bg-semantic-success animate-pulse" />
                Active Loop
              </span>
            ) : (
              <span className="text-[11px] font-mono text-muted bg-surface-strong px-2 py-0.5 rounded-full border border-hairline">
                {goal.status.toUpperCase()}
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
              className="p-1 rounded-lg text-muted hover:text-ink hover:bg-surface-strong transition-colors cursor-pointer"
              title="Goal Options"
              aria-label="Goal options"
            >
              <MoreVertical size={14} />
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
                  className="absolute right-0 top-7 w-40 bg-surface-card border border-hairline rounded-xl shadow-xl py-1 z-50 text-xs font-sans space-y-0.5 animate-in fade-in zoom-in-95 duration-100"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false)
                      onToggleStatus(goal)
                    }}
                    className="w-full px-3 py-1.5 text-left hover:bg-surface-strong flex items-center gap-2 text-ink cursor-pointer transition-colors"
                  >
                    {goal.status === 'active' ? (
                      <>
                        <Pause size={13} className="text-muted" />
                        <span>Pause Goal</span>
                      </>
                    ) : (
                      <>
                        <Play size={13} className="text-primary" />
                        <span>Resume Goal</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false)
                      onDelete(goal.id)
                    }}
                    className="w-full px-3 py-1.5 text-left hover:bg-semantic-error/15 flex items-center gap-2 text-semantic-error cursor-pointer transition-colors"
                  >
                    <Trash2 size={13} />
                    <span>Delete Goal</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Title & Description */}
        <h3 className="text-sm sm:text-base font-semibold text-ink group-hover:text-primary transition-colors flex items-center gap-2 mb-1.5">
          <Target size={16} className="text-primary shrink-0" />
          <span className="line-clamp-1">{goal.title}</span>
        </h3>

        {goal.description && (
          <p className="text-xs text-muted line-clamp-2 leading-relaxed mb-4 font-sans">
            {goal.description}
          </p>
        )}
      </div>

      {/* Progress & Metrics */}
      <div className="space-y-3.5 pt-3 border-t border-hairline">
        {/* Progress Bar & Streak */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-muted flex items-center gap-1.5 text-[11px]">
              <span className="font-mono text-ink font-semibold">{progressPct}%</span>
              Compliance Rate
            </span>

            <div className="flex items-center gap-1 text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 font-mono text-[11px] font-semibold">
              <Flame size={12} className="animate-pulse" />
              <span>{goal.streak_days || 0}d Streak</span>
            </div>
          </div>

          <div className="w-full h-1.5 bg-surface-strong rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500 rounded-full"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Connected MCP Icons & Schedule */}
        <div className="flex items-center justify-between text-xs text-muted">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono uppercase tracking-caption text-muted">MCPs:</span>
            <div className="flex items-center gap-1">
              <span
                title="Android Bridge Telemetry"
                className="p-1 rounded-md bg-canvas-soft border border-hairline text-semantic-success"
              >
                <Smartphone size={12} />
              </span>
              <span
                title="Google Calendar Schedule"
                className="p-1 rounded-md bg-canvas-soft border border-hairline text-primary"
              >
                <Calendar size={12} />
              </span>
              <span
                title="Notion Journal & Database"
                className="p-1 rounded-md bg-canvas-soft border border-hairline text-amber-500"
              >
                <BookOpen size={12} />
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-mono text-muted">
            <Clock size={11} className="text-primary" />
            <span>21:00 Daily Eval</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleRunEvaluation}
            disabled={isEvaluating}
            className="flex-1 px-3 py-2 rounded-xl bg-surface-strong hover:bg-primary-soft text-ink hover:text-primary border border-hairline hover:border-primary-subtle text-xs font-semibold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-2xs"
          >
            <Sparkles size={13} className={`text-primary ${isEvaluating ? 'animate-spin' : ''}`} />
            <span>{isEvaluating ? 'Evaluating...' : 'Run Reflection (AI)'}</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenDetails(goal)}
            className="p-2 rounded-xl bg-primary text-on-primary hover:bg-primary-active transition-all shadow-xs flex items-center justify-center cursor-pointer"
            title="Inspect Tasks & Evidence"
            aria-label="Inspect goal tasks and evidence"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
