import { useState, useEffect, useCallback } from 'react'
import {
  Target,
  Plus,
  Flame,
  Search,
  RefreshCw,
  Calendar,
  Smartphone,
  BookOpen,
} from 'lucide-react'
import { goalsApi, type Goal } from '@/shared/api/goalsApi'
import {
  PageHeader,
  Button,
  EmptyState,
  ConfirmDeleteModal,
  IconBox,
} from '@/shared'
import { GoalCard } from '../components/GoalCard'
import { CreateGoalModal } from '../components/CreateGoalModal'
import { GoalDetailsModal } from '../components/GoalDetailsModal'

const CATEGORY_TABS = [
  { id: 'all', label: 'All Goals' },
  { id: 'productivity', label: 'Productivity' },
  { id: 'learning', label: 'Learning' },
  { id: 'health', label: 'Health' },
  { id: 'completed', label: 'Completed' },
]

export default function GoalsView() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedGoalForDetails, setSelectedGoalForDetails] =
    useState<Goal | null>(null)
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null)

  const loadGoals = useCallback(async () => {
    setIsLoading(true)
    try {
      const fetched = await goalsApi.fetchGoals()
      setGoals(fetched)
    } catch {
      // safe fallback
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    goalsApi
      .fetchGoals()
      .then((data) => {
        if (isMounted) {
          setGoals(data)
          setIsLoading(false)
        }
      })
      .catch(() => {
        if (isMounted) setIsLoading(false)
      })
    return () => {
      isMounted = false
    }
  }, [])

  const handleToggleStatus = async (goal: Goal) => {
    const newStatus = goal.status === 'active' ? 'paused' : 'active'
    try {
      await goalsApi.updateGoal(goal.id, { status: newStatus })
      await loadGoals()
    } catch {
      // safe
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingGoalId) return
    try {
      await goalsApi.deleteGoal(deletingGoalId)
      setDeletingGoalId(null)
      await loadGoals()
    } catch {
      // safe
    }
  }

  const handleEvaluateGoal = async (goal: Goal) => {
    try {
      await goalsApi.triggerGoalEvaluation(goal.id)
      await loadGoals()
    } catch {
      // safe
    }
  }

  // Filtered Goals
  const filteredGoals = goals.filter((g) => {
    const matchesSearch =
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory =
      selectedCategory === 'all' ||
      (selectedCategory === 'completed'
        ? g.status === 'completed'
        : g.category === selectedCategory)
    return matchesSearch && matchesCategory
  })

  // Analytics Overview
  const activeGoalsCount = goals.filter((g) => g.status === 'active').length
  const avgCompliance =
    goals.length > 0
      ? Math.round(
          goals.reduce((acc, g) => acc + (g.current_progress_pct || 0), 0) /
            goals.length,
        )
      : 0
  const maxStreak =
    goals.length > 0
      ? Math.max(...goals.map((g) => g.streak_days || 0), 0)
      : 0

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top Banner Header (Material 3 PageHeader) */}
      <PageHeader
        eyebrow="Goal-Driven Autonomous Agent Control & Lifecycle"
        title="Goals & Habits"
        description="Formulate high-level objectives (SMART criteria). ContextForge continuously perceives context across Android, Google Calendar, and Notion to execute, verify, and adaptively refine your goals."
        actions={
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={loadGoals}
              className="p-2 rounded-xl bg-surface-card hover:bg-surface-strong border border-hairline text-muted hover:text-ink transition-colors cursor-pointer shadow-2xs"
              title="Refresh Goals"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            </button>

            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus size={14} />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              Formulate Goal (AI)
            </Button>
          </div>
        }
      />

      {/* Analytics Overview Cards (Material 3 Surface Elevation) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-surface-card border border-hairline rounded-2xl shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-caption text-muted font-semibold">
              Active Goals
            </span>
            <IconBox size="sm" variant="primary" icon={<Target size={13} />} />
          </div>
          <div className="text-2xl font-bold text-ink font-mono tracking-tight">
            {activeGoalsCount}
            <span className="text-xs text-muted font-normal ml-1 font-sans">
              / {goals.length} total
            </span>
          </div>
        </div>

        <div className="p-4 bg-surface-card border border-hairline rounded-2xl shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-caption text-muted font-semibold">
              Avg Compliance
            </span>
            <IconBox size="sm" variant="success" icon={<Target size={13} />} />
          </div>
          <div className="text-2xl font-bold text-semantic-success font-mono tracking-tight">
            {avgCompliance}%
          </div>
        </div>

        <div className="p-4 bg-surface-card border border-hairline rounded-2xl shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-caption text-muted font-semibold">
              Max Active Streak
            </span>
            <IconBox size="sm" variant="neutral" icon={<Flame size={13} className="text-amber-500" />} />
          </div>
          <div className="text-2xl font-bold text-ink font-mono tracking-tight flex items-center gap-1.5">
            <span>{maxStreak}</span>
            <span className="text-xs text-muted font-normal font-sans">Days</span>
          </div>
        </div>

        <div className="p-4 bg-surface-card border border-hairline rounded-2xl shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-caption text-muted font-semibold">
              Connected Telemetry
            </span>
            <span className="text-[10px] font-mono text-semantic-success font-bold">LIVE</span>
          </div>
          <div className="flex items-center gap-1.5 pt-1">
            <span
              title="Android Bridge Telemetry"
              className="p-1.5 rounded-lg bg-surface-strong border border-hairline text-semantic-success"
            >
              <Smartphone size={13} />
            </span>
            <span
              title="Google Calendar Schedule"
              className="p-1.5 rounded-lg bg-surface-strong border border-hairline text-primary"
            >
              <Calendar size={13} />
            </span>
            <span
              title="Notion Workspace Journal"
              className="p-1.5 rounded-lg bg-surface-strong border border-hairline text-amber-500"
            >
              <BookOpen size={13} />
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        {/* Category Pill Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {CATEGORY_TABS.map((tab) => {
            const isActive = selectedCategory === tab.id
            const count =
              tab.id === 'all'
                ? goals.length
                : tab.id === 'completed'
                  ? goals.filter((g) => g.status === 'completed').length
                  : goals.filter((g) => g.category === tab.id).length

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-primary text-on-primary border-primary shadow-xs font-semibold'
                    : 'bg-surface-card text-muted hover:text-ink hover:bg-surface-strong border-hairline'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isActive
                      ? 'bg-on-primary/20 text-on-primary'
                      : 'bg-surface-strong text-muted'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Search Field */}
        <div className="relative w-full sm:w-64">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search goals..."
            className="w-full pl-8 pr-3.5 py-1.5 bg-surface-card border border-hairline rounded-xl text-xs text-ink placeholder:text-muted focus:outline-hidden focus:border-primary transition-colors shadow-2xs font-sans"
          />
        </div>
      </div>

      {/* Goals Grid or Empty State */}
      {isLoading ? (
        <div className="p-16 text-center text-xs font-mono text-muted flex items-center justify-center gap-2 bg-surface-card border border-hairline rounded-2xl">
          <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
          <span>Synchronizing goal telemetry & MCP status...</span>
        </div>
      ) : filteredGoals.length === 0 ? (
        <EmptyState
          icon={<Target size={32} />}
          title={
            searchQuery
              ? 'No matching goals found'
              : 'No goals formulated yet'
          }
          description={
            searchQuery
              ? 'Try adjusting your search query or switching to another category tab.'
              : 'Give a high-level goal like "I want to improve deep work focus", and let the AI formulate atomic tasks, calendar schedules, and automated verification.'
          }
          action={{
            label: 'Formulate First Goal (AI)',
            icon: <Plus size={14} />,
            onClick: () => setIsCreateModalOpen(true),
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onOpenDetails={(g) => setSelectedGoalForDetails(g)}
              onEvaluate={handleEvaluateGoal}
              onDelete={(id) => setDeletingGoalId(id)}
              onToggleStatus={handleToggleStatus}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <CreateGoalModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onGoalCreated={loadGoals}
      />

      {/* Details Modal */}
      {selectedGoalForDetails && (
        <GoalDetailsModal
          isOpen={Boolean(selectedGoalForDetails)}
          goal={selectedGoalForDetails}
          onClose={() => setSelectedGoalForDetails(null)}
          onGoalUpdated={loadGoals}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(deletingGoalId)}
        onClose={() => setDeletingGoalId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Goal"
        itemName={goals.find((g) => g.id === deletingGoalId)?.title}
        description="Are you sure you want to delete this goal? All associated sub-tasks, telemetry records, and reflection history will be permanently deleted."
      />
    </div>
  )
}
