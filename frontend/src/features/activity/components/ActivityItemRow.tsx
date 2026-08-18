import React from 'react'
import {
  Activity,
  Sparkles,
  Terminal,
  ShieldCheck,
  CheckCircle2,
  GitPullRequest,
  BookOpen,
  Calendar,
  Globe,
} from 'lucide-react'
import type { ActivityLogEntry } from '@/shared/types/workspace'

interface ActivityItemRowProps {
  activity: ActivityLogEntry
}

export const ActivityItemRow: React.FC<ActivityItemRowProps> = ({ activity }) => {
  const getActionIcon = (actionType: ActivityLogEntry['actionType']) => {
    switch (actionType) {
      case 'obsidian_note_created':
        return <BookOpen size={14} className="text-primary" />
      case 'reminder_created':
        return <Calendar size={14} className="text-semantic-success" />
      case 'web_searched':
        return <Globe size={14} className="text-[#3b6ea5]" />
      case 'task_dispatched':
        return <Sparkles size={14} className="text-primary" />
      case 'tool_invoked':
        return <Terminal size={14} className="text-timeline-grep" />
      case 'ast_verified':
        return <ShieldCheck size={14} className="text-semantic-success" />
      case 'human_approved':
        return <CheckCircle2 size={14} className="text-semantic-success" />
      case 'pr_created':
        return <GitPullRequest size={14} className="text-primary" />
      default:
        return <Activity size={14} className="text-muted" />
    }
  }

  return (
    <div className="p-4 sm:p-5 flex items-start justify-between gap-4 hover:bg-canvas-soft/50 transition-colors">
      <div className="flex items-start gap-3.5 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-canvas-soft border border-hairline flex items-center justify-center shrink-0 mt-0.5">
          {getActionIcon(activity.actionType)}
        </div>

        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-xs text-ink">{activity.summary}</span>
            {activity.taskId && (
              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface-strong text-primary">
                {activity.taskId}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-muted">
            <span>by <strong className="text-body font-mono">{activity.agentName}</strong></span>
            <span>•</span>
            <span className="font-mono">{activity.timestamp}</span>
          </div>
        </div>
      </div>

      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-surface-strong text-muted shrink-0">
        {activity.actionType.replace(/_/g, ' ')}
      </span>
    </div>
  )
}
