import React, { useState } from 'react'
import {
  Target,
  Sparkles,
  Calendar,
  Smartphone,
  BookOpen,
  Check,
  Zap,
} from 'lucide-react'
import { goalsApi, type CreateGoalPayload } from '@/shared/api/goalsApi'
import {
  Modal,
  ModalHeader,
  ModalFooter,
  Button,
  FormField,
  Input,
  Textarea,
  IconBox,
} from '@/shared'

interface CreateGoalModalProps {
  isOpen: boolean
  onClose: () => void
  onGoalCreated: () => void
}

const CATEGORY_OPTIONS = [
  { id: 'productivity', label: 'Productivity' },
  { id: 'learning', label: 'Learning' },
  { id: 'health', label: 'Health' },
  { id: 'custom', label: 'Custom' },
] as const

const MCP_OPTIONS = [
  {
    id: 'android-bridge',
    label: 'Android Bridge',
    icon: Smartphone,
    color: 'text-semantic-success',
  },
  {
    id: 'google-calendar',
    label: 'Google Calendar',
    icon: Calendar,
    color: 'text-primary',
  },
  {
    id: 'notion',
    label: 'Notion Workspace',
    icon: BookOpen,
    color: 'text-amber-500',
  },
]

export const CreateGoalModal: React.FC<CreateGoalModalProps> = ({
  isOpen,
  onClose,
  onGoalCreated,
}) => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<
    'productivity' | 'learning' | 'health' | 'finance' | 'custom'
  >('productivity')
  const [maxScreentimeMins, setMaxScreentimeMins] = useState(90)
  const [dailyFocusMins, setDailyFocusMins] = useState(120)
  const [cronEvaluation, setCronEvaluation] = useState('0 21 * * *')
  const [selectedMcps, setSelectedMcps] = useState<string[]>([
    'android-bridge',
    'google-calendar',
    'notion',
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAiDecomposing, setIsAiDecomposing] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const toggleMcp = (mcp: string) => {
    if (selectedMcps.includes(mcp)) {
      setSelectedMcps(selectedMcps.filter((m) => m !== mcp))
    } else {
      setSelectedMcps([...selectedMcps, mcp])
    }
  }

  const handleAiAutoFill = () => {
    if (!title.trim()) {
      setTitle('Deep Work & Cognitive Focus Optimization')
    }
    setDescription(
      'Schedule daily deep work blocks in Google Calendar, limit smartphone screen time below 90 minutes via Android Bridge, and automate nightly reflective syncs to Notion Workspace.',
    )
    setCategory('productivity')
    setMaxScreentimeMins(90)
    setDailyFocusMins(120)
    setCronEvaluation('0 21 * * *')
    setSelectedMcps(['android-bridge', 'google-calendar', 'notion'])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setErrorMsg('Goal title is required.')
      return
    }

    setIsSubmitting(true)
    setErrorMsg(null)

    try {
      const payload: CreateGoalPayload = {
        title: title.trim(),
        description: description.trim(),
        category,
        cronEvaluation,
        linkedMcpServers: selectedMcps,
        targetMetrics: {
          max_daily_screentime_mins: maxScreentimeMins,
          daily_focus_mins: dailyFocusMins,
        },
      }

      const newGoal = await goalsApi.createGoal(payload)

      // Trigger initial AI decomposition if requested
      if (isAiDecomposing && newGoal.id) {
        try {
          await goalsApi.decomposeGoal(newGoal.id)
        } catch {
          // Non-blocking
        }
      }

      onGoalCreated()
      onClose()
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Failed to initialize goal.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalHeader
        title="Formulate New Long-Term Goal"
        subtitle="Goal-Oriented Autonomous Agent & Closed-Loop Task Lifecycle"
        icon={<IconBox size="md" variant="primary" icon={<Target size={18} />} />}
        onClose={onClose}
      />

      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {errorMsg && (
          <div className="p-3.5 bg-semantic-error-soft border border-semantic-error/20 rounded-2xl text-xs text-semantic-error font-medium">
            {errorMsg}
          </div>
        )}

        {/* Material 3 Assistant Suggestion Banner */}
        <div className="p-4 bg-primary-soft border border-primary-subtle rounded-2xl flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5 text-xs text-ink font-medium">
            <Sparkles size={16} className="text-primary shrink-0 animate-pulse" />
            <span>Need inspiration for formulating a SMART goal?</span>
          </div>
          <button
            type="button"
            onClick={handleAiAutoFill}
            className="px-3 py-1.5 bg-primary text-on-primary text-xs font-semibold rounded-xl hover:bg-primary-hover active:bg-primary-active transition-all shadow-xs shrink-0 flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Zap size={13} />
            <span>Auto-Fill Template</span>
          </button>
        </div>

        {/* Title */}
        <FormField label="Goal Title" required>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Deep Work Focus & High Productivity"
            required
          />
        </FormField>

        {/* Description */}
        <FormField label="Description & Success Criteria">
          <Textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Specify measurable targets, timeline boundaries, and success conditions..."
          />
        </FormField>

        {/* Category Filter Chips */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-mono uppercase tracking-caption text-muted font-semibold">
            Category
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {CATEGORY_OPTIONS.map((cat) => (
              <button
                type="button"
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all text-center cursor-pointer active:scale-95 ${
                  category === cat.id
                    ? 'bg-primary text-on-primary border-primary shadow-xs font-semibold'
                    : 'bg-surface-card text-muted hover:text-ink hover:bg-surface-strong border-hairline'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Target Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-surface-card border border-hairline rounded-2xl shadow-2xs">
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-caption text-muted mb-1.5 font-semibold">
              Max Daily Screen Time (Mins)
            </label>
            <Input
              type="number"
              value={maxScreentimeMins}
              onChange={(e) => setMaxScreentimeMins(Number(e.target.value))}
              className="font-mono text-xs"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-caption text-muted mb-1.5 font-semibold">
              Daily Focus Target (Mins)
            </label>
            <Input
              type="number"
              value={dailyFocusMins}
              onChange={(e) => setDailyFocusMins(Number(e.target.value))}
              className="font-mono text-xs"
            />
          </div>
        </div>

        {/* Connected MCP Ecosystem */}
        <div className="space-y-2">
          <label className="block text-[11px] font-mono uppercase tracking-caption text-muted font-semibold">
            Connected MCP Ecosystem
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {MCP_OPTIONS.map((mcp) => {
              const isSelected = selectedMcps.includes(mcp.id)
              const Icon = mcp.icon
              return (
                <button
                  type="button"
                  key={mcp.id}
                  onClick={() => toggleMcp(mcp.id)}
                  className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 text-center transition-all cursor-pointer active:scale-95 ${
                    isSelected
                      ? 'bg-surface-card border-primary text-ink shadow-xs font-medium'
                      : 'bg-surface-card/60 border-hairline opacity-60 text-muted hover:opacity-100 hover:text-ink'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Icon size={16} className={mcp.color} />
                    {isSelected && <Check size={13} className="text-primary" />}
                  </div>
                  <span className="text-[11px] truncate max-w-full font-sans">
                    {mcp.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* AI Task Decomposition checkbox */}
        <label className="flex items-center gap-2.5 cursor-pointer pt-1 select-none">
          <input
            type="checkbox"
            checked={isAiDecomposing}
            onChange={(e) => setIsAiDecomposing(e.target.checked)}
            className="rounded-md text-primary focus:ring-0 w-4 h-4 border-hairline bg-surface-card cursor-pointer"
          />
          <span className="text-xs text-ink flex items-center gap-1.5 font-medium">
            <Sparkles size={14} className="text-primary" />
            <span>Automatically decompose initial sub-tasks using AI Planner</span>
          </span>
        </label>

        <ModalFooter>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
            leftIcon={<Target size={14} />}
          >
            {isSubmitting ? 'Creating Goal...' : 'Create & Initialize Goal'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
