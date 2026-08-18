import React from 'react'
import { Brain, Search, ShieldCheck, FileCheck, CheckCircle2, Loader2, ArrowRight } from 'lucide-react'
import type { StepStage } from '../../../shared/types/workspace'

interface TaskTimelineStepperProps {
  currentStage: StepStage
  onSelectStage?: (stage: StepStage) => void
  onAdvanceStage?: () => void
  isSimulating?: boolean
}

const STAGES: {
  id: StepStage
  number: number
  title: string
  subtitle: string
  icon: typeof Brain
  color: string
}[] = [
  {
    id: 'planning',
    number: 1,
    title: 'Planning',
    subtitle: 'Task Decomposition',
    icon: Brain,
    color: 'text-primary',
  },
  {
    id: 'context_retrieval',
    number: 2,
    title: 'Context & Tools',
    subtitle: 'GitHub, Notion & MCP',
    icon: Search,
    color: 'text-timeline-grep',
  },
  {
    id: 'validation',
    number: 3,
    title: 'AST & Sandbox',
    subtitle: 'Regression & CVE Tests',
    icon: ShieldCheck,
    color: 'text-timeline-read',
  },
  {
    id: 'deliverable',
    number: 4,
    title: 'Deliverable',
    subtitle: 'PR & Human Sign-off',
    icon: FileCheck,
    color: 'text-semantic-success',
  },
]

export const TaskTimelineStepper: React.FC<TaskTimelineStepperProps> = ({
  currentStage,
  onSelectStage,
  onAdvanceStage,
  isSimulating,
}) => {
  const currentStageIndex = STAGES.findIndex((s) => s.id === currentStage)

  return (
    <div className="bg-surface-card border border-hairline rounded-xl p-4 sm:p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xs font-mono uppercase tracking-caption text-muted">
            Execution Lifecycle Stream
          </h2>
          <p className="text-xs font-medium text-ink">
            Deterministic 4-Phase Autonomous Agent Loop
          </p>
        </div>

        {onAdvanceStage && (
          <button
            onClick={onAdvanceStage}
            disabled={isSimulating}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-canvas-soft border border-hairline hover:border-hairline-strong text-ink text-xs font-mono transition-colors disabled:opacity-50 cursor-pointer"
          >
            <span>Next Stage</span>
            <ArrowRight size={12} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STAGES.map((stage, idx) => {
          const Icon = stage.icon
          const isCurrent = stage.id === currentStage
          const isPassed = idx < currentStageIndex

          return (
            <button
              key={stage.id}
              onClick={() => onSelectStage && onSelectStage(stage.id)}
              className={`p-3 rounded-lg border text-left transition-all cursor-pointer relative overflow-hidden ${
                isCurrent
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/20 shadow-xs'
                  : isPassed
                  ? 'border-hairline bg-canvas-soft hover:bg-surface-card'
                  : 'border-hairline/60 bg-canvas/40 opacity-70 hover:opacity-100'
              }`}
            >
              {isCurrent && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary animate-pulse" />
              )}

              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono font-bold text-muted">
                  0{stage.number}
                </span>
                {isPassed ? (
                  <CheckCircle2 size={15} className="text-semantic-success" />
                ) : isCurrent ? (
                  <Loader2 size={15} className="text-primary animate-spin" />
                ) : (
                  <Icon size={15} className="text-muted" />
                )}
              </div>

              <div className="text-xs font-semibold text-ink truncate mb-0.5">
                {stage.title}
              </div>
              <div className="text-[10px] text-muted truncate">
                {stage.subtitle}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
