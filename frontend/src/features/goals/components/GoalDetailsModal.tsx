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
  Activity,
  ListTodo,
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
  SegmentedTabs,
} from '@/shared'
import { GoalVerificationModal } from './GoalVerificationModal'

interface GoalDetailsModalProps {
  isOpen: boolean
  goal: Goal | null
  onClose: () => void
  onGoalUpdated: () => void
}

export const GoalDetailsModal: React.FC<GoalDetailsModalProps> = ({
  isOpen,
  goal,
  onClose,
  onGoalUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'evaluations' | 'evidence'>('tasks')
  const [tasks, setTasks] = useState<GoalTask[]>(() => (goal ? goalsApi.getCachedTasks(goal.id) || [] : []))
  const [evaluations, setEvaluations] = useState<GoalEvaluation[]>(() =>
    goal ? goalsApi.getCachedEvaluations(goal.id) || [] : [],
  )
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (!goal) return false
    const hasTasks = Boolean(goalsApi.getCachedTasks(goal.id))
    const hasEvals = Boolean(goalsApi.getCachedEvaluations(goal.id))
    return !hasTasks && !hasEvals
  })
  const [isDecomposing, setIsDecomposing] = useState(false)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [verifyingTask, setVerifyingTask] = useState<GoalTask | null>(null)

  // New task form state
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskMcp, setNewTaskMcp] = useState('google-calendar')

  useEffect(() => {
    if (!isOpen || !goal) return
    let isMounted = true

    Promise.all([
      goalsApi.fetchGoalTasks(goal.id, false),
      goalsApi.fetchGoalEvaluations(goal.id, false),
    ])
      .then(([fetchedTasks, fetchedEvals]) => {
        if (isMounted) {
          setTasks(fetchedTasks)
          setEvaluations(fetchedEvals)
          setIsLoading(false)
        }
      })
      .catch(() => {
        if (isMounted) setIsLoading(false)
      })
    return () => {
      isMounted = false
    }
  }, [isOpen, goal])

  const loadGoalData = useCallback(async (force = true) => {
    if (!goal) return
    if (force) setIsLoading(true)
    try {
      const [fetchedTasks, fetchedEvals] = await Promise.all([
        goalsApi.fetchGoalTasks(goal.id, force),
        goalsApi.fetchGoalEvaluations(goal.id, force),
      ])
      setTasks(fetchedTasks)
      setEvaluations(fetchedEvals)
    } catch {
      // safe fallback
    } finally {
      setIsLoading(false)
    }
  }, [goal])

  if (!isOpen || !goal) return null

  const handleDecomposeWithAi = async () => {
    setIsDecomposing(true)
    try {
      await goalsApi.decomposeGoal(goal.id)
      await loadGoalData(true)
      onGoalUpdated()
    } finally {
      setIsDecomposing(false)
    }
  }

  const handleRunEvaluation = async () => {
    setIsEvaluating(true)
    try {
      await goalsApi.triggerGoalEvaluation(goal.id)
      await loadGoalData(true)
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
      await loadGoalData(true)
      onGoalUpdated()
    } catch {
      // safe
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      await goalsApi.deleteGoalTask(goal.id, taskId)
      await loadGoalData(true)
      onGoalUpdated()
    } catch {
      // safe
    }
  }

  const getStatusBadge = (status: GoalTask['status']) => {
    switch (status) {
      case 'verified_completed':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-semantic-success bg-semantic-success-soft px-2 py-0.5 rounded-full border border-semantic-success/20 font-semibold">
            <CheckCircle2 size={11} />
            <span>Verified Done</span>
          </span>
        )
      case 'incomplete':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-semantic-error bg-semantic-error-soft px-2 py-0.5 rounded-full border border-semantic-error/20 font-semibold">
            <AlertCircle size={11} />
            <span>Incomplete</span>
          </span>
        )
      case 'unverified':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 font-semibold">
            <HelpCircle size={11} />
            <span>Unverified</span>
          </span>
        )
    }
  }

  const tabItems = [
    {
      id: 'tasks',
      label: 'Action Tasks',
      count: tasks.length,
      icon: <ListTodo size={13} />,
    },
    {
      id: 'evaluations',
      label: 'Reflection & Notion',
      count: evaluations.length,
      icon: <BookOpen size={13} />,
    },
    {
      id: 'evidence',
      label: 'Telemetry & Scope',
      icon: <Smartphone size={13} />,
    },
  ]

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="3xl">
        {/* Header */}
        <ModalHeader
          title={goal.title}
          subtitle={
            <div className="space-y-1 min-w-0 pt-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-primary font-semibold uppercase tracking-wider text-[10px] font-mono bg-primary-soft px-2 py-0.5 rounded-md border border-primary-subtle">
                  {goal.category}
                </span>
                <span className="text-muted text-[11px] font-mono">Closed-Loop Strategy</span>
              </div>
              {goal.description && (
                <p className="text-xs text-muted leading-relaxed font-sans line-clamp-2 mt-0.5">
                  {goal.description}
                </p>
              )}
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

        {/* Stats & Quick Action Bar (M3 Tonal Surface) */}
        <div className="p-3.5 bg-surface-card border border-hairline rounded-2xl flex items-center justify-between gap-3 text-xs flex-wrap shadow-2xs">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Activity size={13} className="text-primary" />
              <span className="text-muted text-[11px]">Compliance:</span>
              <span className="font-mono text-ink font-bold">
                {goal.current_progress_pct || 0}%
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-600 font-semibold font-mono text-[11px] bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              <Flame size={12} className="text-amber-500 animate-pulse" />
              <span>{goal.streak_days || 0}d Streak</span>
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

        {/* M3 Segmented Tabs */}
        <div className="pt-1">
          <SegmentedTabs
            value={activeTab}
            onChange={(val) => setActiveTab(val as 'tasks' | 'evaluations' | 'evidence')}
            tabs={tabItems}
          />
        </div>

        {/* Tab Content */}
        <div className="py-2 space-y-4 max-h-[52vh] overflow-y-auto pr-1">
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
                  {isAddingTask ? 'Close Form' : 'Add Sub-Task'}
                </Button>
              </div>

              {/* Inline Add Task Form (M3 Card Form) */}
              {isAddingTask && (
                <form
                  onSubmit={handleCreateTask}
                  className="p-4 bg-surface-card border border-primary/40 rounded-2xl space-y-3 animate-in fade-in shadow-2xs"
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
                <div className="p-8 text-center bg-surface-card border border-hairline rounded-3xl space-y-2.5">
                  <Target size={30} className="text-muted mx-auto opacity-50" />
                  <p className="text-xs font-semibold text-ink">
                    No sub-tasks registered yet.
                  </p>
                  <p className="text-xs text-muted max-w-sm mx-auto">
                    Use AI Decomposition to automatically break this goal into scheduled action items across Calendar, Notion, and Android.
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
                <div className="space-y-2.5">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-4 bg-surface-card border border-hairline rounded-2xl flex items-start justify-between gap-3 hover:border-hairline-strong transition-all shadow-2xs"
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-semibold text-ink">
                            {task.title}
                          </h4>
                          {getStatusBadge(task.status)}
                          {task.requires_user_approval && (
                            <span className="text-[10px] font-mono text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 font-semibold">
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
                          <span className="text-ink font-medium bg-surface-strong px-2 py-0.5 rounded-md border border-hairline">
                            Target MCP: {task.mcp_target || 'General'}
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
                          className="px-3 py-1.5 rounded-xl bg-surface-strong border border-hairline hover:border-primary/30 text-xs font-medium text-ink hover:text-primary transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                        >
                          <ShieldCheck size={13} className="text-primary" />
                          <span>Verify Evidence</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-1.5 rounded-xl text-muted hover:text-semantic-error hover:bg-semantic-error-soft transition-colors cursor-pointer"
                          title="Delete task"
                          aria-label="Delete task"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Evaluations (Reflection Feed) */}
          {activeTab === 'evaluations' && (
            <div className="space-y-3">
              {evaluations.length === 0 ? (
                <div className="p-8 text-center bg-surface-card border border-hairline rounded-3xl space-y-2.5">
                  <BookOpen size={30} className="text-muted mx-auto opacity-50" />
                  <p className="text-xs font-semibold text-ink">
                    No daily reflection reports yet.
                  </p>
                  <p className="text-xs text-muted max-w-sm mx-auto">
                    Evaluations run automatically every night at 21:00 or you can trigger one manually to generate a Notion reflection journal.
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
                      className="p-4.5 bg-surface-card border border-hairline rounded-2xl space-y-3 shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 bg-semantic-success-soft border border-semantic-success/20 text-semantic-success text-xs font-mono font-bold rounded-full">
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
                            className="px-3 py-1 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20 hover:bg-amber-500/20 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer font-sans"
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
                        <div className="p-3.5 bg-surface-strong/60 rounded-xl border border-hairline text-xs space-y-1.5">
                          <span className="font-semibold text-ink flex items-center gap-1.5">
                            <span>💡</span>
                            <span>Productivity Insights & Behavioral Patterns:</span>
                          </span>
                          {ev.insights.map((ins, idx) => (
                            <p key={idx} className="text-muted leading-relaxed pl-4">
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

          {/* TAB 3: Evidence & Telemetry */}
          {activeTab === 'evidence' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-4.5 bg-surface-card border border-hairline rounded-2xl space-y-2.5 shadow-2xs">
                  <span className="text-xs font-semibold text-ink flex items-center gap-2">
                    <IconBox size="sm" variant="success" icon={<Smartphone size={13} />} />
                    <span>Android Bridge Telemetry</span>
                  </span>
                  <p className="text-xs text-muted">
                    Max Screen Time Target: <strong className="text-ink">{String(goal.target_metrics?.max_daily_screentime_mins ?? 90)} mins</strong>.
                  </p>
                  <p className="text-[11px] text-muted leading-relaxed">
                    Status: Actively monitors work apps vs distraction ratios via real-time WebSocket Bridge.
                  </p>
                </div>

                <div className="p-4.5 bg-surface-card border border-hairline rounded-2xl space-y-2.5 shadow-2xs">
                  <span className="text-xs font-semibold text-ink flex items-center gap-2">
                    <IconBox size="sm" variant="primary" icon={<Calendar size={13} />} />
                    <span>Google Calendar Sync</span>
                  </span>
                  <p className="text-xs text-muted">
                    Daily Focus Target: <strong className="text-ink">{String(goal.target_metrics?.daily_focus_mins ?? 120)} mins</strong>.
                  </p>
                  <p className="text-[11px] text-muted leading-relaxed">
                    Status: Deep work blocks automatically scheduled in user's calendar free slots.
                  </p>
                </div>
              </div>

              <div className="p-4.5 bg-surface-card border border-hairline rounded-2xl space-y-2.5 shadow-2xs">
                <span className="text-xs font-semibold text-ink flex items-center gap-2">
                  <IconBox size="sm" variant="neutral" icon={<BookOpen size={13} className="text-amber-500" />} />
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
          <div className="text-[10px] font-mono text-muted flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-semantic-success animate-pulse" />
            <span>Telemetry: {isLoading ? 'Syncing...' : '100% Operational'}</span>
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
            void loadGoalData(true)
            onGoalUpdated()
          }}
        />
      )}
    </>
  )
}
