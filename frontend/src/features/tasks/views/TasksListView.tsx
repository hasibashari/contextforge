import React, { useState, useMemo } from 'react'
import { Plus, Search, Sparkles } from 'lucide-react'
import { useWorkspace } from '../../../shared/mock'
import { TaskCard } from '../components/TaskCard'
import type { TaskStatus } from '../../../shared/types/workspace'

interface TasksListViewProps {
  onNewTaskClick?: () => void
}

export default function TasksListView({ onNewTaskClick }: TasksListViewProps) {
  const { tasks, agents } = useWorkspace()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all')

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.objective.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.id.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'running_tools'
          ? task.status === 'running_tools' || task.status === 'planning' || task.status === 'analyzing'
          : task.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [tasks, searchQuery, statusFilter])

  const pendingCount = tasks.filter((t) => t.status === 'waiting_approval').length
  const runningCount = tasks.filter(
    (t) => t.status === 'running_tools' || t.status === 'planning' || t.status === 'analyzing'
  ).length

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-card border border-hairline p-5 sm:p-6 rounded-xl shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-caption text-primary mb-1">
            <Sparkles size={13} />
            <span>Autonomous Tasks & Workflows</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">
            Agent Tasks Registry
          </h1>
          <p className="text-xs sm:text-sm text-body mt-1">
            Track multi-stage agent workflows, review code deliverables, and trigger deterministic simulations.
          </p>
        </div>

        {onNewTaskClick && (
          <button
            onClick={onNewTaskClick}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary hover:bg-primary-active text-on-primary text-xs font-semibold transition-colors shadow-xs cursor-pointer shrink-0"
          >
            <Plus size={15} />
            <span>+ Dispatch New Task</span>
          </button>
        )}
      </div>

      {/* Search & Status Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-canvas-soft border border-hairline p-3 rounded-xl">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks by title, ID, or prompt keyword..."
            className="w-full pl-9 pr-4 py-2 bg-surface-card border border-hairline rounded-lg text-xs text-ink placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-ink text-canvas font-semibold'
                : 'bg-surface-card text-body border border-hairline hover:text-ink'
            }`}
          >
            All ({tasks.length})
          </button>

          <button
            onClick={() => setStatusFilter('waiting_approval')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'waiting_approval'
                ? 'bg-primary text-on-primary font-semibold'
                : 'bg-surface-card text-body border border-hairline hover:text-ink'
            }`}
          >
            <span>Waiting Review</span>
            <span className="px-1.5 py-0.2 rounded bg-black/20 text-[10px]">{pendingCount}</span>
          </button>

          <button
            onClick={() => setStatusFilter('running_tools')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'running_tools'
                ? 'bg-ink text-canvas font-semibold'
                : 'bg-surface-card text-body border border-hairline hover:text-ink'
            }`}
          >
            <span>In Flight</span>
            <span className="px-1.5 py-0.2 rounded bg-surface-strong text-body text-[10px]">{runningCount}</span>
          </button>

          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'completed'
                ? 'bg-semantic-success text-canvas font-semibold'
                : 'bg-surface-card text-body border border-hairline hover:text-ink'
            }`}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Tasks Grid */}
      {filteredTasks.length === 0 ? (
        <div className="p-12 text-center bg-surface-card border border-hairline rounded-xl space-y-3">
          <Sparkles size={24} className="text-muted mx-auto" />
          <h2 className="text-sm font-semibold text-ink">No tasks match your criteria</h2>
          <p className="text-xs text-muted">
            Try adjusting your search query or dispatch a new agent task.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTasks.map((task) => {
            const agent = agents.find((a) => a.id === task.agentId)
            return <TaskCard key={task.id} task={task} agentName={agent?.name} />
          })}
        </div>
      )}
    </div>
  )
}
