import { useState } from 'react'
import { motion } from 'motion/react'
import { X, Sparkles, Terminal, Layers, Globe, ShieldCheck, ArrowRight } from 'lucide-react'

interface NewTaskModalProps {
  isOpen: boolean
  onClose: () => void
  onTaskCreated?: (taskTitle: string) => void
}

export default function NewTaskModal({
  isOpen,
  onClose,
  onTaskCreated,
}: NewTaskModalProps) {
  const [goal, setGoal] = useState('')
  const [sources, setSources] = useState({
    github: true,
    notion: true,
    openapi: false,
    mcp: true,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!goal.trim()) return

    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      if (onTaskCreated) onTaskCreated(goal)
      setGoal('')
      onClose()
    }, 1000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        className="bg-surface-card border border-hairline rounded-xl max-w-xl w-full p-6 space-y-5 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-ink">Dispatch New Agent Task</h2>
              <p className="text-xs text-muted">
                Agent will ingest context, test in a sandbox, and format an action plan.
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Goal Input */}
          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-caption font-mono mb-1.5">
              Task Objective / Prompt:
            </label>
            <textarea
              required
              rows={3}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. Ingest Notion security RFC #204, update authMiddleware.ts, and verify all test suites pass..."
              className="w-full p-3 bg-canvas-soft border border-hairline rounded-lg text-xs text-ink placeholder:text-muted focus:outline-none focus:border-primary focus:bg-surface-card transition-colors resize-none"
            />
          </div>

          {/* Context Ingestion Toggles */}
          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-caption font-mono mb-2">
              Context Sources to Ingest:
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-hairline bg-canvas-soft cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={sources.github}
                  onChange={(e) => setSources({ ...sources, github: e.target.checked })}
                  className="rounded text-primary focus:ring-0"
                />
                <div className="flex items-center gap-1.5 truncate">
                  <Terminal size={14} className="text-ink shrink-0" />
                  <span className="truncate">GitHub Codebase</span>
                </div>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-hairline bg-canvas-soft cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={sources.notion}
                  onChange={(e) => setSources({ ...sources, notion: e.target.checked })}
                  className="rounded text-primary focus:ring-0"
                />
                <div className="flex items-center gap-1.5 truncate">
                  <Layers size={14} className="text-timeline-thinking shrink-0" />
                  <span className="truncate">Notion & RFCs</span>
                </div>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-hairline bg-canvas-soft cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={sources.openapi}
                  onChange={(e) => setSources({ ...sources, openapi: e.target.checked })}
                  className="rounded text-primary focus:ring-0"
                />
                <div className="flex items-center gap-1.5 truncate">
                  <Globe size={14} className="text-timeline-read shrink-0" />
                  <span className="truncate">Live Web & OpenAPI</span>
                </div>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-hairline bg-canvas-soft cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={sources.mcp}
                  onChange={(e) => setSources({ ...sources, mcp: e.target.checked })}
                  className="rounded text-primary focus:ring-0"
                />
                <div className="flex items-center gap-1.5 truncate">
                  <ShieldCheck size={14} className="text-timeline-grep shrink-0" />
                  <span className="truncate">MCP Tools (Air-Gapped)</span>
                </div>
              </label>
            </div>
          </div>

          {/* HITL Notice */}
          <div className="p-3 rounded-lg bg-surface-strong border border-hairline text-[11px] text-body flex items-center gap-2">
            <ShieldCheck size={16} className="text-semantic-success shrink-0" />
            <span>
              Safe Mode: Agent runs in an isolated sandbox. Changes will be formatted into an Action Plan for your review.
            </span>
          </div>

          {/* Modal Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-body hover:text-ink rounded-md hover:bg-canvas-soft cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !goal.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary hover:bg-primary-active disabled:opacity-50 text-on-primary text-xs font-medium transition-colors shadow-xs cursor-pointer"
            >
              {isSubmitting ? (
                <span>Dispatching Agent...</span>
              ) : (
                <>
                  <span>Dispatch Agent Task</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
