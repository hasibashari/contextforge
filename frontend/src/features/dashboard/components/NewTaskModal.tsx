import React, { useState } from 'react'
import { motion } from 'motion/react'
import { X, Sparkles, ShieldCheck, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useWorkspace } from '../../../shared/mock'

interface NewTaskModalProps {
  isOpen: boolean
  onClose: () => void
  onTaskCreated?: (taskId: string) => void
}

export default function NewTaskModal({
  isOpen,
  onClose,
  onTaskCreated,
}: NewTaskModalProps) {
  const navigate = useNavigate()
  const { agents, knowledgeSources, createTask } = useWorkspace()

  const [title, setTitle] = useState('')
  const [goal, setGoal] = useState('')
  const [selectedAgentId, setSelectedAgentId] = useState(agents[0]?.id || 'agent-sec-docs')
  const [selectedSources, setSelectedSources] = useState<string[]>([
    'source-github-core',
    'source-notion-sops',
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const toggleSource = (sourceId: string) => {
    setSelectedSources((prev) =>
      prev.includes(sourceId) ? prev.filter((id) => id !== sourceId) : [...prev, sourceId]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!goal.trim()) return

    setIsSubmitting(true)

    setTimeout(() => {
      const newTask = createTask({
        title: title.trim() || goal.slice(0, 55),
        objective: goal.trim(),
        agentId: selectedAgentId,
        selectedSources,
      })

      setIsSubmitting(false)
      setTitle('')
      setGoal('')
      onClose()

      if (onTaskCreated) {
        onTaskCreated(newTask.id)
      } else {
        navigate(`/tasks/${newTask.id}`)
      }
    }, 600)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        className="bg-surface-card border border-hairline rounded-2xl max-w-xl w-full p-6 sm:p-7 space-y-5 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-ink">
                Dispatch New Agent Task
              </h2>
              <p className="text-xs text-muted">
                Agent will formulate a plan, ingest context, run AST tests, and format a reviewable action plan.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-canvas-soft text-muted hover:text-ink cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Title / Short label */}
          <div>
            <label className="block font-semibold text-ink uppercase tracking-caption font-mono mb-1">
              Task Title (Optional):
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Migrate OAuth2 session tokens"
              className="w-full p-2.5 bg-canvas-soft border border-hairline rounded-lg text-ink placeholder:text-muted focus:outline-none focus:border-primary focus:bg-surface-card transition-colors"
            />
          </div>

          {/* Goal Input */}
          <div>
            <label className="block font-semibold text-ink uppercase tracking-caption font-mono mb-1">
              Objective & Instructions:
            </label>
            <textarea
              required
              rows={3}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. Ingest Notion security RFC #204, update authMiddleware.ts, and verify all test suites pass with zero regressions..."
              className="w-full p-3 bg-canvas-soft border border-hairline rounded-lg text-ink placeholder:text-muted focus:outline-none focus:border-primary focus:bg-surface-card transition-colors resize-none leading-relaxed"
            />
          </div>

          {/* Agent Selection */}
          <div>
            <label className="block font-semibold text-ink uppercase tracking-caption font-mono mb-1">
              Select Specialized Agent:
            </label>
            <select
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              className="w-full p-2.5 bg-canvas-soft border border-hairline rounded-lg text-ink font-mono focus:outline-none focus:border-primary"
            >
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} — {a.role}
                </option>
              ))}
            </select>
          </div>

          {/* Context Ingestion Toggles */}
          <div>
            <label className="block font-semibold text-ink uppercase tracking-caption font-mono mb-1.5">
              Knowledge Grounding Sources:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {knowledgeSources.map((src) => {
                const isSelected = selectedSources.includes(src.id)

                return (
                  <button
                    type="button"
                    key={src.id}
                    onClick={() => toggleSource(src.id)}
                    className={`p-2.5 rounded-lg border text-left flex items-center gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-primary bg-primary/5 text-ink font-medium'
                        : 'border-hairline bg-canvas-soft text-muted hover:text-ink'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="rounded text-primary pointer-events-none"
                    />
                    <span className="truncate text-xs font-mono">{src.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Guardrail Note */}
          <div className="p-2.5 bg-canvas-soft rounded-lg border border-hairline flex items-center gap-2 text-muted">
            <ShieldCheck size={14} className="text-semantic-success shrink-0" />
            <span className="text-[11px]">
              Sandboxed execution mode active. Code will not be committed without your sign-off.
            </span>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-hairline flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-body hover:text-ink cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !goal.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-active text-on-primary text-xs font-semibold transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <span>{isSubmitting ? 'Synthesizing DAG...' : 'Dispatch Agent Task'}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
