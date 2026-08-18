import React, { useState, useRef, useEffect } from 'react'
import {
  Send,
  Sparkles,
  BookOpen,
  Calendar,
  Globe,
  RefreshCw,
  ChevronRight,
  Layers,
  Zap,
  Cpu,
} from 'lucide-react'
import { useWorkspace } from '../../../shared/mock'
import type { ActionCardData, ChatMessage } from '../../../shared/types/workspace'

export default function DashboardChatCanvas() {
  const {
    activeSession,
    isGeneratingResponse,
    sendChatMessage,
    executeCardAction,
    agents,
    skills,
  } = useWorkspace()

  const [inputPrompt, setInputPrompt] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const showSlashMenu = inputPrompt.startsWith('/') && !inputPrompt.includes(' ')
  const showMentionMenu = inputPrompt.startsWith('@') && !inputPrompt.includes(' ')

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [activeSession?.messages, isGeneratingResponse])

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!inputPrompt.trim() || isGeneratingResponse) return

    const message = inputPrompt.trim()
    setInputPrompt('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    await sendChatMessage(message)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputPrompt(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`
  }

  const handleSelectSkill = (skillCommand: string) => {
    setInputPrompt(`/${skillCommand} `)
    textareaRef.current?.focus()
  }

  const handleSelectAgentOrConnector = (target: string) => {
    setInputPrompt(`@${target} `)
    textareaRef.current?.focus()
  }

  const quickPrompts = [
    {
      label: 'Draft Sprint Plan to Obsidian',
      icon: BookOpen,
      category: 'Obsidian MCP',
      prompt: 'Draft a Sprint 34 plan for our new architecture, then save it to the `/Work/Sprints` folder in Obsidian.',
      desc: 'Automatically writes structured Markdown notes via Obsidian MCP.',
    },
    {
      label: 'Run TDD Vitest Sandbox',
      icon: Zap,
      category: 'TDD Skill',
      prompt: '/tdd-flow Run test coverage on auth token rotation and propose clean AST diffs.',
      desc: 'Invokes red-green-refactor testing playbook.',
    },
    {
      label: 'Schedule Reminder Tomorrow 09:00',
      icon: Calendar,
      category: 'Calendar MCP',
      prompt: 'Remind me to review RFC #204 token compliance tomorrow at 9 AM.',
      desc: 'Set an automated reminder alarm in your calendar.',
    },
    {
      label: 'Audit Security & RFC Compliance',
      icon: Layers,
      category: 'Security Skill',
      prompt: '/cve-threat-model Audit codebase against Notion Security RFC #204 and prepare a PR.',
      desc: 'Static AST scan and dependency CVE vulnerability lookup.',
    },
  ]

  const isInitialState = !activeSession?.messages || activeSession.messages.length === 0

  return (
    <div className="flex-1 h-full min-h-0 flex flex-col bg-canvas text-ink overflow-hidden relative">
      {/* Main Chat Scroll Area */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-4xl mx-auto w-full space-y-6 pb-8">
          {/* Welcome State when Session is Empty */}
          {isInitialState && (
            <div className="max-w-2xl mx-auto py-8 sm:py-12 space-y-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary mx-auto flex items-center justify-center shadow-xs">
                <Sparkles size={24} />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">
                  ContextForge Conversational Workspace
                </h2>
                <p className="text-xs sm:text-sm text-body max-w-lg mx-auto leading-relaxed">
                  Provide natural instructions — agents automatically select the right MCP tools (Obsidian, Calendar, Web, GitHub) and reasoning skills to deliver tangible outcomes.
                </p>
              </div>

              {/* Quick Prompts Grid */}
              <div className="pt-2 text-left space-y-2.5 max-w-xl mx-auto">
                <div className="text-[11px] font-mono uppercase tracking-caption text-muted text-center">
                  Try quick autonomous workflows or type <code className="text-primary bg-canvas-soft px-1 rounded">/</code> for skills:
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {quickPrompts.map((qp, idx) => {
                    const Icon = qp.icon
                    return (
                      <button
                        key={idx}
                        onClick={() => setInputPrompt(qp.prompt)}
                        className="p-3 rounded-xl bg-canvas-soft hover:bg-surface-strong border border-hairline transition-all text-left group cursor-pointer shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-ink group-hover:text-primary transition-colors">
                            <Icon size={14} className="text-primary shrink-0" />
                            <span>{qp.label}</span>
                          </div>
                          <span className="text-[10px] font-mono text-muted">{qp.category}</span>
                        </div>
                        <p className="text-[11px] text-body line-clamp-1">{qp.desc}</p>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Message Feed */}
          {activeSession?.messages.map((msg: ChatMessage) => {
            const isUser = msg.role === 'user'

            if (isUser) {
              return (
                <div key={msg.id} className="flex justify-end w-full">
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
            return (
              <div key={msg.id} className="w-full space-y-3 pt-1">
                {/* Assistant Markdown Content */}
                <div className="text-xs sm:text-sm text-ink leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </div>

                {/* Micro-status intent badge */}
                {msg.intent && (
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted bg-canvas-soft px-2.5 py-1 rounded-lg border border-hairline w-fit">
                    {msg.intent.service === 'obsidian' && (
                      <BookOpen size={12} className="text-primary" />
                    )}
                    {msg.intent.service === 'web' && (
                      <Globe size={12} className="text-[#3b6ea5]" />
                    )}
                    {msg.intent.service === 'calendar' && (
                      <Calendar size={12} className="text-semantic-success" />
                    )}
                    <span>{msg.intent.summaryText}</span>
                  </div>
                )}

                {/* Outcome Action Card (If Present) */}
                {msg.actionCard && (
                  <div className="w-full pt-1">
                    <OutcomeActionCard card={msg.actionCard} onAction={executeCardAction} />
                  </div>
                )}

                <div className="text-[10px] font-mono text-muted">
                  {msg.timestamp}
                </div>
              </div>
            )
          })}

          {/* Generating Indicator */}
          {isGeneratingResponse && (
            <div className="flex items-center gap-2.5 py-2 text-xs text-muted">
              <RefreshCw size={14} className="animate-spin text-primary shrink-0" />
              <span className="font-mono">Processing instruction & executing tools...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Bottom Floating Prompt Area (Pinned at Bottom) */}
      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 bg-linear-to-t from-canvas via-canvas/95 to-transparent shrink-0 sticky bottom-0 z-10 w-full backdrop-blur-xs">
        <div className="max-w-4xl mx-auto w-full space-y-2">
          {/* Slash Commands Popover */}
          {showSlashMenu && (
            <div className="bg-surface-card border border-hairline rounded-xl p-2 shadow-xl space-y-1 text-xs font-mono max-h-48 overflow-y-auto">
              <div className="text-[10px] uppercase text-muted px-2 py-1 flex items-center gap-1">
                <Zap size={11} className="text-primary" />
                <span>Available Reasoning Skills (Type to filter):</span>
              </div>
              {skills.map((skill) => (
                <button
                  key={skill.id}
                  type="button"
                  onClick={() => handleSelectSkill(skill.id.replace('skill-', ''))}
                  className="w-full px-2.5 py-1.5 rounded-lg hover:bg-canvas-soft text-left flex items-center justify-between text-ink transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-primary">/{skill.id.replace('skill-', '')}</span>
                    <span className="text-muted text-[11px] truncate max-w-xs">{skill.name}</span>
                  </div>
                  <span className="text-[10px] text-muted capitalize">{skill.category.replace('_', ' ')}</span>
                </button>
              ))}
            </div>
          )}

          {/* Mention Popover */}
          {showMentionMenu && (
            <div className="bg-surface-card border border-hairline rounded-xl p-2 shadow-xl space-y-1 text-xs font-mono max-h-48 overflow-y-auto">
              <div className="text-[10px] uppercase text-muted px-2 py-1 flex items-center gap-1">
                <Cpu size={11} className="text-primary" />
                <span>Mention Agent or Connector:</span>
              </div>
              {agents.map((ag) => (
                <button
                  key={ag.id}
                  type="button"
                  onClick={() => handleSelectAgentOrConnector(ag.name.replace(/\s+/g, ''))}
                  className="w-full px-2.5 py-1.5 rounded-lg hover:bg-canvas-soft text-left flex items-center justify-between text-ink transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-primary">@{ag.name.replace(/\s+/g, '')}</span>
                    <span className="text-muted text-[11px]">{ag.role}</span>
                  </div>
                  <span className="text-[10px] text-semantic-success">● {ag.status}</span>
                </button>
              ))}
            </div>
          )}

          {/* Prompt Input Form */}
          <form
            onSubmit={handleSend}
            className="relative bg-surface-card border border-hairline focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 rounded-2xl shadow-xs transition-all p-2.5 sm:p-3"
          >
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputPrompt}
              onChange={handleTextareaInput}
              onKeyDown={handleKeyDown}
              placeholder="Enter instruction or type '/' for skills, '@' for agents (e.g., '/tdd-flow Run test coverage', 'Save notes to Obsidian...')"
              className="w-full bg-transparent border-none resize-none text-xs sm:text-sm text-ink placeholder:text-muted focus:outline-none px-2 pt-1 max-h-40 leading-relaxed font-sans"
            />

            <div className="flex items-center justify-between pt-2 px-2 border-t border-hairline/60 text-[11px] text-muted font-mono">
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline">
                  ⚡ Auto-Routing MCP Active (Obsidian, Calendar, Web, GitHub)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] hidden md:inline">Shift + Enter for new line</span>
                <button
                  type="submit"
                  disabled={!inputPrompt.trim() || isGeneratingResponse}
                  className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-primary hover:bg-primary-active text-on-primary disabled:opacity-40 transition-colors shadow-xs cursor-pointer shrink-0"
                  title="Send Message"
                >
                  <Send size={13} />
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function OutcomeActionCard({
  card,
  onAction,
}: {
  card: ActionCardData
  onAction: (actionKey: string, card: ActionCardData) => void
}) {
  const getIcon = () => {
    switch (card.type) {
      case 'obsidian_note':
        return <BookOpen size={16} className="text-primary shrink-0" />
      case 'calendar_reminder':
        return <Calendar size={16} className="text-semantic-success shrink-0" />
      case 'web_search_summary':
        return <Globe size={16} className="text-[#3b6ea5] shrink-0" />
      default:
        return <Sparkles size={16} className="text-primary shrink-0" />
    }
  }

  return (
    <div className="bg-surface-card border border-hairline-strong rounded-xl p-4 sm:p-5 shadow-2xs space-y-3.5 transition-all hover:border-hairline">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {getIcon()}
          <h4 className="text-xs sm:text-sm font-semibold text-ink leading-snug">
            {card.title}
          </h4>
        </div>
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold shrink-0 ${
            card.badgeColor || 'bg-primary/10 text-primary'
          }`}
        >
          {card.badgeText}
        </span>
      </div>

      <p className="text-xs text-body leading-relaxed">{card.description}</p>

      {card.metaDetails && (
        <div className="p-2.5 rounded-lg bg-canvas-soft border border-hairline grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
          {Object.entries(card.metaDetails).map(([key, val]) => (
            <div key={key} className="flex items-center justify-between gap-2">
              <span className="text-muted">{key}:</span>
              <span className="font-medium text-ink truncate">{val}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
        {card.actions.map((act) => (
          <button
            key={act.actionKey}
            onClick={() => onAction(act.actionKey, card)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer shadow-2xs ${
              act.primary
                ? 'bg-primary hover:bg-primary-active text-on-primary font-semibold'
                : 'bg-canvas-soft hover:bg-canvas border border-hairline text-ink'
            }`}
          >
            <span>{act.label}</span>
            <ChevronRight size={13} />
          </button>
        ))}
      </div>
    </div>
  )
}
