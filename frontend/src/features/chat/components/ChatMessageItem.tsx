import React from 'react'
import { Zap } from 'lucide-react'
import { MarkdownRenderer } from '@/shared'
import { CompactArtifactPill } from './CompactArtifactPill'
import { ThinkingIndicator } from './ThinkingIndicator'
import type { ChatMessage, Artifact } from '@/shared/types/workspace'

interface ChatMessageItemProps {
  msg: ChatMessage
  artifacts: Artifact[]
  isStreaming?: boolean
  onOpenArtifact: (artifact: Artifact) => void
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  msg,
  artifacts,
  isStreaming = false,
  onOpenArtifact,
}) => {
  const isUser = msg.role === 'user'

  if (isUser) {
    return (
      <div className="flex justify-end w-full animate-in fade-in duration-150">
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

  const isPlaceholderGenerating =
    isStreaming && (!msg.content || msg.content.trim() === '')

  return (
    <div className="w-full space-y-2.5 pt-1 animate-in fade-in duration-200">
      {/* Live Thinking Indicator */}
      {isPlaceholderGenerating && <ThinkingIndicator />}

      {/* Assistant Rich Markdown Content */}
      {msg.content && (
        <div className="relative leading-relaxed text-ink transition-opacity duration-300 ease-out animate-in fade-in">
          <MarkdownRenderer content={msg.content} />
        </div>
      )}

      {/* Attached Obsidian Note / Action Artifact */}
      {attachedArtifact && (
        <div className="pt-1 animate-in fade-in slide-in-from-bottom-1 duration-200">
          <CompactArtifactPill
            artifact={attachedArtifact}
            onOpen={() => onOpenArtifact(attachedArtifact)}
          />
        </div>
      )}

      {/* Structured Intent Badge */}
      {msg.intent && (
        <div className="pt-0.5 flex items-center gap-1.5 text-[11px] font-mono text-muted">
          <Zap size={11} className="text-primary" />
          <span>Action:</span>
          <span className="px-1.5 py-0.2 rounded bg-canvas-soft border border-hairline text-ink font-semibold">
            {msg.intent.toolName || msg.intent.service}
          </span>
        </div>
      )}

      <div className="text-[10px] font-mono text-muted pt-0.5">
        {msg.timestamp}
      </div>
    </div>
  )
}
