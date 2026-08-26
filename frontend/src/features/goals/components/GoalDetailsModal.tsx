import React, { useState, useEffect, useCallback } from 'react'
import {
  Target,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Calendar,
  Smartphone,
  BookOpen,
  Plus,
  Trash2,
  ExternalLink,
  Flame,
  ShieldCheck,
  RotateCw,
  Clock,
} from 'lucide-react'
import {
  goalsApi,
  type Goal,
  type GoalTask,
  type GoalEvaluation,
} from '@/shared/api/goalsApi'
import {
  Modal,
  ModalHeader,
  ModalFooter,
  Button,
  Badge,
  Input,
  Select,
  IconBox,
} from '@/shared'
import { GoalVerificationModal } from './GoalVerificationModal'

interface GoalDetailsModalProps {
  isOpen: boolean
  goal: Goal | null
  onClose: () => void
  onGoalUpdated: () => void
}

const DETAIL_TABS = [
  { id: 'tasks', label: 'Action Tasks' },
  { id: 'evaluations', label: 'Reflection & Notion' },
  { id: 'evidence', label: 'Telemetry & Scope' },
] as const

export const GoalDetailsModal: React.FC<GoalDetailsModalProps> = ({
  isOpen,
  goal,
  onClose,
  onGoalUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'evaluations' | 'evidence'>('tasks')
  const [tasks, setTasks] = useState<GoalTask[]>([])
  const [evaluations, setEvaluations] = useState<GoalEvaluation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDecomposing, setIsDecomposing] = useState(false)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [verifyingTask, setVerifyingTask] = useState<GoalTask | null>(null)

  // New task form state
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskMcp, setNewTaskMcp] = useState('google-calendar')

  const loadGoalData = useCallback(async () => {
    if (!goal) return
    setIsLoading(true)
    try {
      const [fetchedTasks, fetchedEvals] = await Promise.all([
        goalsApi.fetchGoalTasks(goal.id),
        goalsApi.fetchGoalEvaluations(goal.id),
      ])
      setTasks(fetchedTasks)
      setEvaluations(fetchedEvals)
    } catch {
      // safe fallback
    } finally {
      setIsLoading(false)
    }
  }, [goal])

  useEffect(() => {
    if (!isOpen || !goal) return
    let isMounted = true
    Promise.all([
      goalsApi.fetchGoalTasks(goal.id),
      goalsApi.fetchGoalEvaluations(goal.id),
    ])
      .then(([fetchedTasks, fetchedEvals]) => {
        if (isMounted) {
          setTasks(fetchedTasks)
          setEvaluations(fetchedEvals)
        }
      })
      .catch(() => {
        // safe
      })
    return () => {
      isMounted = false
    }
  }, [isOpen, goal])

  if (!isOpen || !goal) return null

  const handleDecomposeWithAi = async () => {
    setIsDecomposing(true)
    try {
      await goalsApi.decomposeGoal(goal.id)
      await loadGoalData()
      onGoalUpdated()
    } finally {
      setIsDecomposing(false)
    }
  }

  const handleRunEvaluation = async () => {
    setIsEvaluating(true)
    try {
      await goalsApi.triggerGoalEvaluation(goal.id)
      await loadGoalData()
      onGoalUpdated()
    } finally {
      setIsEvaluating(false)
    }
  }

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return

    try {
      await goalsApi.createGoalTask(goal.id, {
        title: newTaskTitle.trim(),
        mcp_target: newTaskMcp,
      })
      setNewTaskTitle('')
      setIsAddingTask(false)
      await loadGoalData()
      onGoalUpdated()
    } catch {
      // safe
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      await goalsApi.deleteGoalTask(goal.id, taskId)
      await loadGoalData()
      onGoalUpdated()
    } catch {
      // safe
    }
  }

  const getStatusBadge = (status: GoalTask['status']) => {
    switch (status) {
      case 'verified_completed':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono text-semantic-success bg-semantic-success/10 px-2 py-0.5 rounded-full border border-semantic-success/20 font-semibold">
            <CheckCircle2 size={11} />
            <span>Verified Done</span>
          </span>
        )
      case 'incomplete':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono text-semantic-error bg-semantic-error/10 px-2 py-0.5 rounded-full border border-semantic-error/20 font-semibold">
            <AlertCircle size={11} />
            <span>Incomplete</span>
          </span>
        )
      case 'unverified':
      default:
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 font-semibold">
            <HelpCircle size={11} />
            <span>Unverified</span>
          </span>
        )
    }
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="3xl">
        {/* Header */}
        <ModalHeader
          title={goal.title}
          subtitle={
            <div className="flex items-center gap-2 flex-wrap text-muted">
              <span className="text-primary font-semibold uppercase">{goal.category}</span>
              <span>•</span>
              <span className="truncate">{goal.description || 'Closed-Loop Strategy'}</span>
            </div>
          }
          icon={<IconBox size="md" variant="primary" icon={<Target size={18} />} />}
          badge={
            <Badge variant={goal.status === 'active' ? 'success' : 'neutral'} size="sm">
              {goal.status.toUpperCase()}
            </Badge>
          }
          onClose={onClose}
        />

        {/* Stats & Quick Action Bar */}
        <div className="p-3 bg-surface-strong/60 border border-hairline rounded-2xl flex items-center justify-between gap-3 text-xs flex-wrap shadow-2xs">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-muted text-[11px]">Compliance:</span>
              <span className="font-mono text-ink font-bold">
                {goal.current_progress_pct || 0}%
              </span>
            </div>
            <div className="flex items-center gap-1 text-amber-500 font-semibold font-mono text-[11px]">
              <Flame size={12} className="animate-pulse" />
              <span>{goal.streak_days || 0} Days Streak</span>
            </div>
            <div className="flex items-center gap-1 text-muted font-mono text-[11px]">
              <Clock size={11} className="text-primary" />
              <span>Cron: {goal.cron_evaluation || '21:00 Daily'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="xs"
              isLoading={isDecomposing}
              leftIcon={<Sparkles size={12} className="text-primary" />}
              onClick={handleDecomposeWithAi}
            >
              {isDecomposing ? 'Decomposing...' : 'AI Decomposition'}
            </Button>

            <Button
              type="button"
              variant="primary"
              size="xs"
              isLoading={isEvaluating}
              leftIcon={<RotateCw size={12} />}
              onClick={handleRunEvaluation}
            >
              {isEvaluating ? 'Evaluating...' : 'Run Reflection (AI)'}
            </Button>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex items-center gap-1 bg-surface-strong/50 p-1 rounded-xl border border-hairline">
          {DETAIL_TABS.map((tab) => {
            const isActive = activeTab === tab.id
            const count =
              tab.id === 'tasks'
                ? tasks.length
                : tab.id === 'evaluations'
                  ? evaluations.length
                  : undefined

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-surface-card text-ink font-semibold shadow-2xs border border-hairline'
                    : 'text-muted hover:text-ink'
                }`}
              >
                <span>{tab.label}</span>
                {count !== undefined && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                      isActive
                        ? 'bg-primary/15 text-primary font-bold'
                        : 'bg-surface-card text-muted'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        <div className="py-2 space-y-4 max-h-[50vh] overflow-y-auto pr-1">
          {/* TAB 1: Tasks */}
          {activeTab === 'tasks' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted">
                  Sub-tasks grounded in MCP tools with Tri-State Verification Gate
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  leftIcon={<Plus size={12} />}
                  onClick={() => setIsAddingTask(!isAddingTask)}
                >
                  {isAddingTask ? 'Close Form' : 'Add Task'}
                </Button>
              </div>

              {/* Inline Add Task Form */}
              {isAddingTask && (
                <form
                  onSubmit={handleCreateTask}
                  className="p-3.5 bg-surface-card border border-primary/30 rounded-2xl space-y-3 animate-in fade-in shadow-2xs"
                >
                  <Input
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Enter new task title..."
                    required
                  />
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <Select
                      value={newTaskMcp}
                      onChange={(e) => setNewTaskMcp(e.target.value)}
                      className="w-auto text-xs"
                    >
                      <option value="google-calendar">Google Calendar (Time Blocking)</option>
                      <option value="notion">Notion Workspace (Task Item)</option>
                      <option value="android-bridge">Android Bridge (Digital Wellbeing)</option>
                    </Select>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={() => setIsAddingTask(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" variant="primary" size="xs">
                        Save Task
                      </Button>
                    </div>
                  </div>
                </form>
              )}

              {/* Tasks List */}
              {tasks.length === 0 ? (
                <div className="p-8 text-center bg-surface-card border border-hairline rounded-2xl space-y-2">
                  <Target size={28} className="text-muted mx-auto opacity-50" />
                  <p className="text-xs font-semibold text-ink">
                    No sub-tasks registered yet.
                  </p>
                  <p className="text-xs text-muted max-w-sm mx-auto">
                    Use AI Decomposition to automatically break this goal into scheduled action items.
                  </p>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    leftIcon={<Sparkles size={13} />}
                    onClick={handleDecomposeWithAi}
                    isLoading={isDecomposing}
                  >
                    Trigger AI Task Decomposition
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3.5 bg-surface-card border border-hairline rounded-2xl flex items-start justify-between gap-3 hover:border-hairline-strong transition-colors shadow-2xs"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-semibold text-ink">
                            {task.title}
                          </h4>
                          {getStatusBadge(task.status)}
                          {task.requires_user_approval && (
                            <span className="text-[10px] font-mono text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 font-semibold">
                              Requires Approval
                            </span>
                          )}
                        </div>

                        {task.description && (
                          <p className="text-[11px] text-muted leading-relaxed">
                            {task.description}
                          </p>
                        )}

                        <div className="flex items-center gap-3 text-[10px] font-mono text-muted pt-0.5">
                          <span className="text-ink font-medium">
                            Target: {task.mcp_target || 'General'}
                          </span>
                          {task.verification_notes && (
                            <span className="text-muted truncate max-w-md">
                              • {task.verification_notes}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setVerifyingTask(task)}
                          className="px-2.5 py-1 rounded-lg bg-surface-strong border border-hairline hover:border-primary-subtle text-xs font-medium text-ink hover:text-primary transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
                        >
                          <ShieldCheck size={12} className="text-primary" />
                          <span>Verify</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-1 rounded-lg text-muted hover:text-semantic-error hover:bg-semantic-error/15 transition-colors cursor-pointer"
                          title="Delete task"
                          aria-label="Delete task"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Evaluations */}
          {activeTab === 'evaluations' && (
            <div className="space-y-3">
              {evaluations.length === 0 ? (
                <div className="p-8 text-center bg-surface-card border border-hairline rounded-2xl space-y-2">
                  <BookOpen size={28} className="text-muted mx-auto opacity-50" />
                  <p className="text-xs font-semibold text-ink">
                    No daily reflection reports yet.
                  </p>
                  <p className="text-xs text-muted max-w-sm mx-auto">
                    Evaluations run automatically every night at 21:00 or you can trigger one manually.
                  </p>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    leftIcon={<RotateCw size={13} />}
                    onClick={handleRunEvaluation}
                    isLoading={isEvaluating}
                  >
                    Run First Daily Reflection
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {evaluations.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-4 bg-surface-card border border-hairline rounded-2xl space-y-2.5 shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-semantic-success/10 border border-semantic-success/20 text-semantic-success text-xs font-mono font-bold rounded-lg">
                            Score: {ev.score_pct}%
                          </span>
                          <span className="text-xs font-mono text-muted">
                            Date: {ev.evaluation_date}
                          </span>
                        </div>

                        {ev.notion_page_url && (
                          <a
                            href={ev.notion_page_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <BookOpen size={12} />
                            <span>Open Notion Journal</span>
                            <ExternalLink size={11} />
                          </a>
                        )}
                      </div>

                      <p className="text-xs text-ink leading-relaxed font-sans">
                        {ev.summary}
                      </p>

                      {ev.insights && ev.insights.length > 0 && (
                        <div className="p-3 bg-surface-strong/60 rounded-xl border border-hairline text-xs space-y-1">
                          <span className="font-semibold text-ink">
                            💡 Productivity Insights & Patterns:
                          </span>
                          {ev.insights.map((ins, idx) => (
                            <p key={idx} className="text-muted leading-tight">
                              • {ins}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Evidence & Metrics */}
          {activeTab === 'evidence' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 bg-surface-card border border-hairline rounded-2xl space-y-2 shadow-2xs">
                  <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
                    <Smartphone size={15} className="text-semantic-success" />
                    <span>Android Bridge Telemetry</span>
                  </span>
                  <p className="text-xs text-muted">
                    Max Screen Time Target: <strong className="text-ink">{goal.target_metrics?.max_daily_screentime_mins || 90} mins</strong>.
                  </p>
                  <p className="text-[11px] text-muted leading-relaxed">
                    Status: Actively monitors work apps vs distraction ratios via real-time WebSocket Bridge.
                  </p>
                </div>

                <div className="p-4 bg-surface-card border border-hairline rounded-2xl space-y-2 shadow-2xs">
                  <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
                    <Calendar size={15} className="text-primary" />
                    <span>Google Calendar Sync</span>
                  </span>
                  <p className="text-xs text-muted">
                    Daily Focus Target: <strong className="text-ink">{goal.target_metrics?.daily_focus_mins || 120} mins</strong>.
                  </p>
                  <p className="text-[11px] text-muted leading-relaxed">
                    Status: Deep work blocks automatically scheduled in user's calendar free slots.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-surface-card border border-hairline rounded-2xl space-y-2 shadow-2xs">
                <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
                  <BookOpen size={15} className="text-amber-500" />
                  <span>Notion Workspace Sync Target</span>
                </span>
                <p className="text-xs text-muted">
                  Parent Journal Page: <strong className="text-ink">{goal.notion_parent_page_id || 'Root Workspace (Auto-Detected)'}</strong>
                </p>
                <p className="text-[11px] text-muted leading-relaxed">
                  Every evening, reflection summaries, compliance scores, and completed tasks are synced directly to Notion as rich structured blocks.
                </p>
              </div>
            </div>
          )}
        </div>

        <ModalFooter>
          <div className="text-[10px] font-mono text-muted">
            Status: {isLoading ? 'Syncing...' : '100% Operational'}
          </div>
          <Button type="button" variant="primary" size="sm" onClick={onClose}>
            Done
          </Button>
        </ModalFooter>
      </Modal>

      {/* Verification Modal */}
      {verifyingTask && (
        <GoalVerificationModal
          isOpen={Boolean(verifyingTask)}
          task={verifyingTask}
          onClose={() => setVerifyingTask(null)}
          onTaskUpdated={() => {
            void loadGoalData()
            onGoalUpdated()
          }}
        />
      )}
    </>
  )
}
