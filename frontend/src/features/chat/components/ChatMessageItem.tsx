import React from 'react'
import { Zap } from 'lucide-react'
import { MarkdownRenderer, AgentIconBox } from '@/shared'
import { ThinkingIndicator } from './ThinkingIndicator'
import type { ChatMessage } from '@/shared/types/workspace'

interface ChatMessageItemProps {
  msg: ChatMessage
  isStreaming?: boolean
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  msg,
  isStreaming = false,
}) => {
  const isUser = msg.role === 'user'

  if (isUser) {
    return (
      <div className="flex justify-end w-full animate-in fade-in duration-150">
        <div className="max-w-[85%] sm:max-w-[75%] space-y-1 text-right">
          <div className="inline-block p-3.5 sm:p-4 rounded-2xl rounded-tr-xs bg-surface-card border border-hairline text-ink text-xs sm:text-sm leading-relaxed shadow-2xs font-normal text-left">
            <div className="whitespace-pre-wrap font-sans">{msg.content}</div>
          </div>
          <div className="text-[10px] font-mono text-muted pr-1">
            {msg.timestamp}
          </div>
        </div>
      </div>
    )
  }

  const isPlaceholderGenerating =
    isStreaming && (!msg.content || msg.content.trim() === '')

  return (
    <div className="w-full space-y-2.5 pt-1 animate-in fade-in duration-200">
      {/* Active Persona Header Badge */}
      {(msg.agentName || msg.agentId) && (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-canvas-soft border border-hairline text-[11px] font-mono text-ink">
          <AgentIconBox agentId={msg.agentId} size="sm" className="w-3.5 h-3.5 rounded-xs" />
          <span className="font-medium text-primary">
            {msg.agentName || `@${msg.agentId?.replace('agent-', '')}`}
          </span>
        </div>
      )}

      {/* Live Thinking Indicator */}
      {isPlaceholderGenerating && <ThinkingIndicator />}

      {/* Assistant Rich Markdown Content */}
      {msg.content && (
        <div className="relative leading-relaxed text-ink font-sans transition-opacity duration-300 ease-out animate-in fade-in">
          <MarkdownRenderer content={msg.content} />
        </div>
      )}

      {/* Structured Intent Badge */}
      {msg.intent && (
        <div className="pt-0.5 flex items-center gap-1.5 text-[11px] font-mono text-muted">
          <Zap size={11} className="text-primary" />
          <span>Action:</span>
          <span className="px-2 py-0.5 rounded-md bg-primary-soft border border-primary-subtle text-primary font-mono text-[10px] font-medium">
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
