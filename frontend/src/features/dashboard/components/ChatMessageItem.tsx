import React from 'react'
import { Globe, Zap } from 'lucide-react'
import { MarkdownRenderer } from '@/shared/components'
import { CompactArtifactPill } from './CompactArtifactPill'
import type { ChatMessage, Artifact } from '@/shared/types/workspace'

interface ChatMessageItemProps {
  msg: ChatMessage
  artifacts: Artifact[]
  onOpenArtifact: (artifact: Artifact) => void
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  msg,
  artifacts,
  onOpenArtifact,
}) => {
  const isUser = msg.role === 'user'

  if (isUser) {
    return (
      <div className="flex justify-end w-full">
        <div className="max-w-[85%] sm:max-w-[75%] space-y-1 text-right">
          <div className="inline-block p-3.5 sm:p-4 rounded-2xl rounded-tr-xs bg-canvas-soft border border-hairline text-ink text-xs sm:text-sm leading-relaxed shadow-2xs font-normal text-left">
            <div className="whitespace-pre-wrap">{msg.content}</div>
          </div>
          <div className="text-[10px] font-mono text-muted pr-1">
            {msg.timestamp}
          </div>
        </div>
      </div>
    )
  }

  // Assistant Response
  const attachedArtifact = msg.artifactId
    ? artifacts.find((a) => a.id === msg.artifactId)
    : undefined

  return (
    <div className="w-full space-y-3 pt-1">
      {/* Assistant Rich Markdown Content */}
      <MarkdownRenderer content={msg.content} />

      {/* Gemini-Style Source Chips (Web Grounding Citations) */}
      {msg.sourceDomains && msg.sourceDomains.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px] font-mono">
          <span className="text-muted flex items-center gap-1">
            <Globe size={11} className="text-[#3b6ea5]" />
            <span>Sources:</span>
          </span>
          {msg.sourceDomains.map((src, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded-md bg-canvas-soft border border-hairline text-ink font-medium text-[10px]"
            >
              {src}
            </span>
          ))}
        </div>
      )}

      {/* Claude-Style Sleek Compact Artifact Button Pill */}
      {attachedArtifact && (
        <div className="pt-0.5">
          <CompactArtifactPill
            artifact={attachedArtifact}
            onOpen={() => onOpenArtifact(attachedArtifact)}
          />
        </div>
      )}

      {/* Minimal Side Agent Execution Status Pill */}
      {msg.sideAgent && (
        <div className="flex items-center gap-2 text-[11px] font-mono text-muted bg-canvas-soft px-2.5 py-1 rounded-lg border border-hairline w-fit">
          <Zap size={12} className="text-primary shrink-0" />
          <span className="text-ink font-semibold">{msg.sideAgent.agentName}</span>
          <span className="text-muted">·</span>
          <span className="text-muted truncate max-w-xs">{msg.sideAgent.targetResource}</span>
          <span className="text-semantic-success font-semibold">({msg.sideAgent.executionTimeMs}ms)</span>
        </div>
      )}

      {/* Clean Source Citations Pill (When web search / grounded) */}
      {msg.sourceDomains && msg.sourceDomains.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[11px] font-mono text-muted flex items-center gap-1 mr-1">
            <Globe size={12} className="text-[#3b6ea5]" />
            <span>Citations ({msg.sourceDomains.length}):</span>
          </span>
          {msg.sourceDomains.map((domain, idx) => (
            <span
              key={idx}
              className="text-[10px] font-mono bg-canvas-soft border border-hairline px-2 py-0.5 rounded-md text-muted hover:text-ink transition-colors"
            >
              {domain}
            </span>
          ))}
        </div>
      )}

      <div className="text-[10px] font-mono text-muted">
        {msg.timestamp}
      </div>
    </div>
  )
}
