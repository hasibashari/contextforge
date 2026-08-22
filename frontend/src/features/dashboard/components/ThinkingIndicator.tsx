import React from 'react'
import { Sparkles } from 'lucide-react'

export const ThinkingIndicator: React.FC = () => {
  return (
    <div className="w-fit py-1.5 my-1 text-xs select-none animate-in fade-in duration-150">
      <div className="inline-flex items-center gap-2 text-muted font-mono text-[11px]">
        {/* Animated Rotating & Breathing Claude-Style Sparkles Logo */}
        <div className="relative flex items-center justify-center w-4 h-4 text-primary shrink-0">
          <Sparkles
            size={14}
            className="text-primary animate-thinking-logo shrink-0"
          />
        </div>

        {/* Clean Monospace Thinking Text */}
        <span className="font-medium text-ink">
          Thinking...
        </span>
      </div>
    </div>
  )
}
