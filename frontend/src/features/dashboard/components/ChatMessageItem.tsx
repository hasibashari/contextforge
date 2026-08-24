import React from 'react'
import { Globe, Zap, BookOpen, ExternalLink, FileText } from 'lucide-react'
import { MarkdownRenderer } from '@/shared/components'
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

  // Deduplicate sources & citations
  const uniqueSources = msg.sourceDomains
    ? Array.from(new Set(msg.sourceDomains.filter(Boolean)))
    : []

  const isWebUrl = (src: string) => {
    return (
      src.startsWith('http://') ||
      src.startsWith('https://') ||
      src.includes('.com') ||
      src.includes('.org') ||
      src.includes('.dev') ||
      src.includes('.io') ||
      src.includes('.net') ||
      src.includes('.ai') ||
      src.includes('github')
    )
  }

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

      {/* Sleek Compact Artifact Button Pill */}
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

      {/* Footnote Sources Tray */}
      {uniqueSources.length > 0 && (
        <div className="pt-1.5 flex items-center gap-2 flex-wrap text-[11px] font-mono">
          <span className="text-muted text-[10px] uppercase tracking-caption font-semibold flex items-center gap-1">
            <BookOpen size={11} className="text-muted" />
            <span>Sources:</span>
          </span>

          <div className="flex items-center gap-1.5 flex-wrap">
            {uniqueSources.map((src, i) => {
              const isWeb = isWebUrl(src)
              const href = isWeb
                ? src.startsWith('http')
                  ? src
                  : `https://${src}`
                : undefined

              if (href) {
                return (
                  <a
                    key={i}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-canvas-soft hover:bg-surface-strong border border-hairline hover:border-hairline-strong text-muted hover:text-ink text-[10px] transition-colors cursor-pointer"
                    title={`Open external source: ${src}`}
                  >
                    <Globe size={10} className="text-[#3b82f6] shrink-0" />
                    <span>{src}</span>
                    <ExternalLink size={9} className="opacity-50" />
                  </a>
                )
              }

              return (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-canvas-soft border border-hairline text-muted text-[10px]"
                >
                  {src.toLowerCase().includes('.md') || src.toLowerCase().includes('doc') ? (
                    <FileText size={10} className="text-primary shrink-0" />
                  ) : (
                    <BookOpen size={10} className="text-primary shrink-0" />
                  )}
                  <span>{src}</span>
                </span>
              )
            })}
          </div>
        </div>
      )}

      <div className="text-[10px] font-mono text-muted pt-0.5">
        {msg.timestamp}
      </div>
    </div>
  )
}
