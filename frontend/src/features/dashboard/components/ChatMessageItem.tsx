import React from 'react'
import { Globe, Zap, BookOpen, ExternalLink, FileText, ExternalLink as LaunchIcon } from 'lucide-react'
import { MarkdownRenderer } from '@/shared/components'
import { CompactArtifactPill } from './CompactArtifactPill'
import { ThinkingIndicator } from './ThinkingIndicator'
import type { ChatMessage, Artifact, ActionCardData } from '@/shared/types/workspace'

interface ChatMessageItemProps {
  msg: ChatMessage
  artifacts: Artifact[]
  isStreaming?: boolean
  onOpenArtifact: (artifact: Artifact) => void
  onExecuteAction?: (actionKey: string, card: ActionCardData) => void
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  msg,
  artifacts,
  isStreaming = false,
  onOpenArtifact,
  onExecuteAction,
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

  const handleActionClick = (actionKey: string, card: ActionCardData) => {
    // If it is an Obsidian Launch action
    if (actionKey === 'open_obsidian' || actionKey === 'open_note') {
      const uri =
        card.obsidianUri ||
        (card.locationPath
          ? `obsidian://open?vault=${encodeURIComponent('Obsidian Vault')}&file=${encodeURIComponent(card.locationPath)}`
          : undefined)
      if (uri) {
        window.open(uri, '_self')
        return
      }
    }

    onExecuteAction?.(actionKey, card)
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

      {/* Interactive Action Card (Obsidian Vault / Notion Sync) */}
      {msg.actionCard && (
        <div className="p-3.5 rounded-xl bg-canvas-soft border border-hairline space-y-2.5 max-w-lg shadow-2xs">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                  {msg.actionCard.badge || msg.actionCard.badgeText || 'Obsidian Vault'}
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
                const actionKey = act.actionKey || act.key || ''
                const isPrimary = act.primary
                const isObsidianAction =
                  actionKey.includes('obsidian') ||
                  act.label.toLowerCase().includes('obsidian')

                return (
                  <button
                    key={idx}
                    onClick={() => handleActionClick(actionKey, msg.actionCard!)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      isPrimary || isObsidianAction
                        ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-2xs'
                        : 'bg-surface hover:bg-surface-elevated border border-hairline text-ink'
                    }`}
                  >
                    {isObsidianAction && <LaunchIcon size={12} />}
                    <span>{act.label}</span>
                  </button>
                )
              })}
            </div>
          )}
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
