import React from 'react'

interface ActivityFilterBarProps {
  selectedFilter: string
  onSelectFilter: (filter: string) => void
}

const FILTER_OPTIONS = [
  { id: 'all', label: 'All Events' },
  { id: 'task_dispatched', label: 'Task Dispatched' },
  { id: 'tool_invoked', label: 'Tool Invoked' },
  { id: 'ast_verified', label: 'AST Verified' },
  { id: 'human_approved', label: 'Human Approved' },
  { id: 'pr_created', label: 'PR Created' },
]

export const ActivityFilterBar: React.FC<ActivityFilterBarProps> = ({
  selectedFilter,
  onSelectFilter,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs font-mono bg-canvas-soft border border-hairline p-3 rounded-xl">
      <span className="text-muted text-[11px] uppercase tracking-caption mr-2">Filter Action:</span>
      {FILTER_OPTIONS.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onSelectFilter(opt.id)}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            selectedFilter === opt.id
              ? 'bg-ink text-canvas font-semibold shadow-2xs'
              : 'bg-surface-card text-body border border-hairline hover:text-ink'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
