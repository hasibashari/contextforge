import React from 'react'
import { Link } from 'react-router-dom'
import {
  Brain,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  AlertCircle,
} from 'lucide-react'
import type { Task } from '../../../shared/types/workspace'

interface TaskCardProps {
  task: Task
  agentName?: string
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, agentName }) => {
  const getStatusBadge = () => {
    switch (task.status) {
      case 'waiting_approval':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
            <Sparkles size={11} />
            Waiting Review
          </span>
        )
      case 'running_tools':
      case 'planning':
      case 'analyzing':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-timeline-grep/20 text-body-strong border border-timeline-grep/30 animate-pulse">
            <Clock size={11} className="text-primary animate-spin" />
            Executing
          </span>
        )
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-semantic-success/15 text-semantic-success border border-semantic-success/20">
            <CheckCircle2 size={11} />
            Completed
          </span>
        )
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-semantic-error/15 text-semantic-error border border-semantic-error/20">
            <AlertCircle size={11} />
            Failed
          </span>
        )
      default:
        return (
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface-strong text-muted">
            {task.status}
          </span>
        )
    }
  }

  return (
    <div className="bg-surface-card border border-hairline hover:border-hairline-strong rounded-xl p-5 transition-all shadow-2xs hover:shadow-xs flex flex-col justify-between space-y-4">
      {/* Header Row */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-xs text-primary">{task.id}</span>
            {getStatusBadge()}
          </div>
          <span className="text-xs text-muted font-mono">{task.createdAt}</span>
        </div>

        <h3 className="text-sm sm:text-base font-semibold text-ink leading-snug mb-1.5 line-clamp-1">
          {task.title}
        </h3>

        <p className="text-xs text-body line-clamp-2 leading-relaxed">
          {task.objective}
        </p>
      </div>

      {/* Meta Bar */}
      <div className="space-y-3 pt-3 border-t border-hairline">
        <div className="flex items-center justify-between text-xs text-muted">
          <div className="flex items-center gap-1.5">
            <Brain size={13} className="text-primary" />
            <span className="truncate">{agentName || task.agentId}</span>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px]">
            {task.deliverable?.diffs && (
              <span>
                {task.deliverable.diffs.length} files changed
              </span>
            )}
            {task.tokensUsed && (
              <span>${task.tokensUsed.estimatedCostUsd.toFixed(3)}</span>
            )}
          </div>
        </div>

        {/* Action Link */}
        <Link
          to={`/tasks/${task.id}`}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-canvas-soft hover:bg-canvas text-xs font-semibold text-ink border border-hairline hover:border-hairline-strong transition-colors cursor-pointer"
        >
          <span>Open Execution Timeline</span>
          <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  )
}
