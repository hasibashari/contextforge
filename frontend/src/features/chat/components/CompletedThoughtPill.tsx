import React, { useState } from 'react'
import { Sparkles, ChevronDown, ChevronUp, Terminal, Globe, ArrowRight, Layers } from 'lucide-react'
import type { ReasoningStep } from '@/shared/types/workspace'

interface CompletedThoughtPillProps {
  steps?: ReasoningStep[]
  durationMs?: number
}

export const CompletedThoughtPill: React.FC<CompletedThoughtPillProps> = ({
  steps = [],
  durationMs,
}) => {
  const [isOpen, setIsOpen] = useState(false)

  if ((!steps || steps.length === 0) && !durationMs) {
    return null
  }

  const durationSec = durationMs ? (durationMs / 1000).toFixed(1) : undefined
  const stepsCount = steps.length

  const getStepIcon = (stage: string, toolName?: string) => {
    if (toolName?.includes('search') || stage.includes('search') || stage.includes('reading')) {
      return <Globe size={11} className="text-[#3b82f6] shrink-0" />
    }
    if (toolName?.includes('obsidian') || toolName?.includes('notion')) {
      return <Layers size={11} className="text-[#7c3aed] shrink-0" />
    }
    if (stage.includes('tool') || toolName) {
      return <Terminal size={11} className="text-primary shrink-0" />
    }
    if (stage.includes('handoff') || stage.includes('agent')) {
      return <ArrowRight size={11} className="text-semantic-success shrink-0" />
    }
    return <Sparkles size={11} className="text-primary shrink-0" />
  }

  return (
    <div className="w-fit max-w-xl mb-1.5 font-mono text-[11px]">
      {/* Pure Claude Style Summary Pill */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-canvas-soft hover:bg-surface-strong/60 border border-hairline hover:border-hairline-strong text-muted hover:text-ink transition-colors cursor-pointer shadow-2xs select-none"
        title="Click to view reasoning breakdown"
      >
        <Sparkles size={12} className="text-primary shrink-0" />
        <span className="font-medium text-ink">
          {durationSec ? `Thought for ${durationSec}s` : 'Thinking process'}
        </span>
        {stepsCount > 0 && (
          <span className="text-muted">
            · {stepsCount} {stepsCount === 1 ? 'step' : 'steps'}
          </span>
        )}
        {isOpen ? (
          <ChevronUp size={12} className="text-muted ml-0.5" />
        ) : (
          <ChevronDown size={12} className="text-muted ml-0.5" />
        )}
      </button>

      {/* Pure Claude Style Clean Indented Timeline */}
      {isOpen && steps.length > 0 && (
        <div className="mt-2 ml-3 pl-3 border-l border-hairline-strong space-y-1.5 font-mono text-[11px] py-0.5 animate-in fade-in duration-150">
          {steps.map((step, idx) => (
            <div
              key={step.id || idx}
              className="flex items-start gap-2 text-muted py-0.5"
            >
              <div className="mt-0.5">{getStepIcon(step.stage, step.toolName)}</div>
              <div className="flex-1 leading-snug">
                <span className="text-ink font-medium">{step.label}</span>
                {step.toolName && (
                  <span className="ml-1.5 text-[10px] px-1 py-0.2 rounded bg-canvas border border-hairline text-muted">
                    {step.toolName}
                  </span>
                )}
              </div>
              {step.durationMs !== undefined && step.durationMs > 0 && (
                <span className="text-[10px] text-muted shrink-0">
                  {(step.durationMs / 1000).toFixed(1)}s
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
