import React, { useState, useRef, useEffect } from 'react'
import {
  Send,
  Sparkles,
  BookOpen,
  Calendar,
  Globe,
  RefreshCw,
  Zap,
  Cpu,
  Mic,
  MicOff,
  Sun,
  Image as ImageIcon,
  Terminal,
  ExternalLink,
  FileText,
} from 'lucide-react'
import { useWorkspace } from '@/shared/mock'
import { MarkdownRenderer } from '@/shared/components'
import type { ChatMessage, Artifact } from '@/shared/types/workspace'

export default function DashboardChatCanvas() {
  const {
    activeSession,
    isGeneratingResponse,
    sendChatMessage,
    triggerMorningBriefing,
    agents,
    skills,
    setAsideOpen,
    setActiveArtifact,
    artifacts,
    showToast,
  } = useWorkspace()

  const [inputPrompt, setInputPrompt] = useState('')
  const [isVoiceListening, setIsVoiceListening] = useState(false)
  const [voiceTranscriptText, setVoiceTranscriptText] = useState('')
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

  // Voice Simulation Handler
  const handleToggleVoice = () => {
    if (isVoiceListening) {
      setIsVoiceListening(false)
      setVoiceTranscriptText('')
      return
    }

    setIsVoiceListening(true)
    setVoiceTranscriptText('Listening to audio stream...')

    // Simulated Real-Time Speech-to-Text streaming
    setTimeout(() => {
      setVoiceTranscriptText('"Hey ContextForge, schedule a review meeting tomorrow at 3 PM and note the details in Obsidian"')
    }, 1200)

    setTimeout(() => {
      setInputPrompt('Schedule a review meeting with Sarah tomorrow at 3 PM and note the discussion points in Obsidian.')
      setIsVoiceListening(false)
      setVoiceTranscriptText('')
      if (textareaRef.current) {
        textareaRef.current.focus()
      }
    }, 2800)
  }

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
      category: 'Side Agent (Write)',
      prompt: 'Draft a Sprint 35 plan for our new architecture, then save it to the `/Work/Sprints` folder in Obsidian.',
      desc: 'Dispatches Obsidian Vault Worker to write structured markdown note.',
    },
    {
      label: 'Create Auth Middleware & Test',
      icon: Terminal,
      category: 'Side Agent (CLI)',
      prompt: 'Buatkan file middleware auth.ts dengan TypeScript dan jalankan verifikasi.',
      desc: 'Dispatches CLI & Code Sandbox Runner to write code and run test suite.',
    },
    {
      label: 'Research 2026 AI Trends',
      icon: Globe,
      category: 'Main Agent (Read-Only)',
      prompt: 'Cari informasi terbaru tentang tren arsitektur dual-agent dan Model Context Protocol di tahun 2026.',
      desc: 'Main Agent executes live web search with grounded citations.',
    },
    {
      label: 'Analyze Microservices vs Monolith',
      icon: Sparkles,
      category: 'Main Agent (Reasoning)',
      prompt: 'Analisis kelebihan dan kekurangan arsitektur Microservices vs Modular Monolith untuk ContextForge.',
      desc: 'Direct architectural reasoning without side-effects or mutations.',
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
                  <strong>Main Agent</strong> handles conversation, analysis, and web search in read-only mode. When file edits, Obsidian writes, or CLI executions are needed, isolated <strong>Side Agents</strong> are safely dispatched.
                </p>
                <div className="pt-2 flex justify-center">
                  <button
                    type="button"
                    onClick={triggerMorningBriefing}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-mono font-semibold transition-all shadow-2xs cursor-pointer"
                  >
                    <Sun size={14} className="text-primary animate-pulse" />
                    <span>Trigger Proactive Morning Briefing</span>
                  </button>
                </div>
              </div>

              {/* Quick Prompts Grid */}
              <div className="pt-2 text-left space-y-2.5 max-w-xl mx-auto">
                <div className="text-[11px] font-mono uppercase tracking-caption text-muted text-center">
                  Try quick workflows or type <code className="text-primary bg-canvas-soft px-1 rounded">/</code> for skills:
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
            const attachedArtifact = msg.artifactId
              ? artifacts.find((a) => a.id === msg.artifactId)
              : undefined

            return (
              <div key={msg.id} className="w-full space-y-3 pt-1">
                {/* Assistant Rich Markdown Content (Rendered as HTML / GFM) */}
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
                      onOpen={() => {
                        setActiveArtifact(attachedArtifact)
                        setAsideOpen(true)
                        showToast('Opened in Workspace Aside', 'info')
                      }}
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

                {/* Micro-status intent badge (When no side agent) */}
                {msg.intent && !msg.sideAgent && (
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
                    {msg.intent.service === 'briefing' && (
                      <Sun size={12} className="text-primary" />
                    )}
                    {msg.intent.service === 'imagen' && (
                      <ImageIcon size={12} className="text-[#ff5e00]" />
                    )}
                    {msg.intent.service === 'github' && (
                      <Terminal size={12} className="text-ink" />
                    )}
                    <span>{msg.intent.summaryText}</span>
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
          {/* Animated Voice Waveform Simulator Banner */}
          {isVoiceListening && (
            <div className="bg-surface-card border border-primary/40 rounded-2xl p-3.5 shadow-lg flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-semantic-error/15 text-semantic-error flex items-center justify-center animate-pulse shrink-0">
                  <Mic size={16} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                    <span>Voice Input Streaming</span>
                    <span className="inline-block w-2 h-2 rounded-full bg-semantic-error animate-ping" />
                  </div>
                  <p className="text-[11px] font-mono text-primary truncate">
                    {voiceTranscriptText}
                  </p>
                </div>
              </div>

              {/* Animated Waveform Bars */}
              <div className="flex items-center gap-1 shrink-0 px-2">
                <span className="w-1 h-3 bg-primary rounded-full animate-pulse" />
                <span className="w-1 h-6 bg-primary rounded-full animate-pulse" />
                <span className="w-1 h-4 bg-primary rounded-full animate-pulse" />
                <span className="w-1 h-7 bg-primary rounded-full animate-pulse" />
                <span className="w-1 h-3 bg-primary rounded-full animate-pulse" />
              </div>
            </div>
          )}

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
                    <span className="text-muted truncate">{skill.name}</span>
                  </div>
                  <span className="text-[10px] text-muted">{skill.category}</span>
                </button>
              ))}
            </div>
          )}

          {/* Mention Agent/Connector Popover */}
          {showMentionMenu && (
            <div className="bg-surface-card border border-hairline rounded-xl p-2 shadow-xl space-y-1 text-xs font-mono max-h-48 overflow-y-auto">
              <div className="text-[10px] uppercase text-muted px-2 py-1 flex items-center gap-1">
                <Cpu size={11} className="text-primary" />
                <span>Route to Specialized Agent or Connector:</span>
              </div>
              {agents.map((ag) => (
                <button
                  key={ag.id}
                  type="button"
                  onClick={() => handleSelectAgentOrConnector(ag.id.replace('agent-', ''))}
                  className="w-full px-2.5 py-1.5 rounded-lg hover:bg-canvas-soft text-left flex items-center justify-between text-ink transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-primary">@{ag.id.replace('agent-', '')}</span>
                    <span className="text-muted truncate">{ag.name}</span>
                  </div>
                  <span className="text-[10px] text-muted">{ag.role}</span>
                </button>
              ))}
            </div>
          )}

          {/* Main Input Field */}
          <form
            onSubmit={handleSend}
            className="bg-surface-card border border-hairline-strong focus-within:border-primary rounded-2xl p-2.5 sm:p-3 shadow-md transition-all space-y-2"
          >
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputPrompt}
              onChange={handleTextareaInput}
              onKeyDown={handleKeyDown}
              placeholder="Ask, delegate a task, schedule meetings, or type / for skills, @ for agents..."
              className="w-full bg-transparent border-0 resize-none text-xs sm:text-sm text-ink placeholder:text-muted focus:outline-none px-2 py-1 max-h-40 leading-relaxed"
            />

            <div className="flex items-center justify-between pt-2 px-2 border-t border-hairline/60 text-[11px] text-muted font-mono">
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline">
                  ⚡ Auto-Routing MCP Active (Obsidian, Calendar, Web, GitHub, Imagen)
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Voice Mic Simulator Button */}
                <button
                  type="button"
                  onClick={handleToggleVoice}
                  className={`inline-flex items-center justify-center w-7 h-7 rounded-lg transition-all cursor-pointer ${
                    isVoiceListening
                      ? 'bg-semantic-error text-canvas shadow-xs animate-pulse'
                      : 'bg-canvas-soft hover:bg-surface-strong text-muted hover:text-ink border border-hairline'
                  }`}
                  title={isVoiceListening ? 'Stop Listening' : 'Voice Input (Simulate Speech-to-Text)'}
                >
                  {isVoiceListening ? <MicOff size={13} /> : <Mic size={13} />}
                </button>

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

function CompactArtifactPill({
  artifact,
  onOpen,
}: {
  artifact: Artifact
  onOpen: () => void
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-card hover:bg-canvas-soft border border-hairline hover:border-primary/40 text-xs font-mono text-ink transition-colors cursor-pointer group shadow-2xs"
    >
      <FileText size={13} className="text-primary shrink-0" />
      <span className="font-semibold truncate max-w-xs">{artifact.title}</span>
      <span className="text-muted">·</span>
      <span className="text-[11px] text-primary flex items-center gap-0.5 group-hover:underline">
        <span>Open Aside</span>
        <ExternalLink size={11} />
      </span>
    </button>
  )
}
