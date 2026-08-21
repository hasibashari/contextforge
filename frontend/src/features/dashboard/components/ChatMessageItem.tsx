import React from 'react'
import { Globe, Zap } from 'lucide-react'
import { MarkdownRenderer } from '@/shared/components'
import { CompactArtifactPill } from './CompactArtifactPill'
import type { ChatMessage, Artifact, ActionCardData } from '@/shared/types/workspace'

interface ChatMessageItemProps {
  msg: ChatMessage
  artifacts: Artifact[]
  onOpenArtifact: (artifact: Artifact) => void
  onExecuteAction?: (actionKey: string, card: ActionCardData) => void
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  msg,
  artifacts,
  onOpenArtifact,
  onExecuteAction,
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

      {/* Interactive Action Card (Obsidian / Notion / Artifact sync) */}
      {msg.actionCard && (
        <div className="p-3.5 rounded-xl bg-canvas-soft border border-hairline space-y-2.5 max-w-lg shadow-2xs">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                  {msg.actionCard.badge || msg.actionCard.badgeText || 'Action Ready'}
                </span>
                <span className="text-ink font-semibold text-xs">{msg.actionCard.title}</span>
              </div>
              {(msg.actionCard.subtitle || msg.actionCard.locationPath) && (
                <div className="text-[11px] font-mono text-muted mt-0.5">
                  {msg.actionCard.subtitle || msg.actionCard.locationPath}
                </div>
              )}
            </div>
          </div>

          <p className="text-xs text-muted leading-relaxed">
            {msg.actionCard.description}
          </p>

          {msg.actionCard.actions && msg.actionCard.actions.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap pt-1">
              {msg.actionCard.actions.map((act, idx) => {
                const actionKey = act.actionKey || act.key || '';
                const isPrimary = act.primary;
                return (
                  <button
                    key={idx}
                    onClick={() => onExecuteAction?.(actionKey, msg.actionCard!)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      isPrimary
                        ? 'bg-primary text-primary-contrast hover:bg-primary-hover shadow-2xs'
                        : 'bg-surface hover:bg-surface-elevated border border-hairline text-ink'
                    }`}
                  >
                    <span>{act.label}</span>
                  </button>
                );
              })}
            </div>
          )}
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
