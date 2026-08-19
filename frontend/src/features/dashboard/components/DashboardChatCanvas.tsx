import React, { useState, useRef, useEffect } from 'react'
import {
  Send,
  Sparkles,
  Globe,
  RefreshCw,
  Zap,
  Cpu,
  Mic,
  MicOff,
  ExternalLink,
  FileText,
  Plus,
} from 'lucide-react'
import { useWorkspace } from '@/shared/mock'
import { MarkdownRenderer } from '@/shared/components'
import type { ChatMessage, Artifact } from '@/shared/types/workspace'

const DYNAMIC_GREETINGS = [
  "What's on the agenda today?",
  'What should we focus on today?',
  'What are we building next?',
  'Where should we begin our investigation?',
  'Ready to design, code, or delegate a task?',
  'How can ContextForge accelerate your workflow?',
]

function getGreetingForSession(sessionId?: string): string {
  if (!sessionId) return DYNAMIC_GREETINGS[0]
  let hash = 0
  for (let i = 0; i < sessionId.length; i++) {
    hash = (hash << 5) - hash + sessionId.charCodeAt(i)
    hash |= 0
  }
  const index = Math.abs(hash) % DYNAMIC_GREETINGS.length
  return DYNAMIC_GREETINGS[index]
}

export default function DashboardChatCanvas() {
  const {
    activeSession,
    isGeneratingResponse,
    sendChatMessage,
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
      setVoiceTranscriptText(
        '"Hey ContextForge, schedule a review meeting tomorrow at 3 PM and note the details in Obsidian"',
      )
    }, 1200)

    setTimeout(() => {
      setInputPrompt(
        'Schedule a review meeting with Sarah tomorrow at 3 PM and note the discussion points in Obsidian.',
      )
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
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`
  }

  const handleSelectSkill = (skillCommand: string) => {
    setInputPrompt(`/${skillCommand} `)
    textareaRef.current?.focus()
  }

  const handleSelectAgentOrConnector = (target: string) => {
    setInputPrompt(`@${target} `)
    textareaRef.current?.focus()
  }

  const isInitialState =
    !activeSession?.messages || activeSession.messages.length === 0

  // Dynamically select a greeting based on current active session
  const dynamicGreeting = getGreetingForSession(activeSession?.id)

  const renderInputForm = (isCentered: boolean) => {
    const isMultiline =
      inputPrompt.includes('\n') || inputPrompt.length > 80

    return (
      <div
        className={`w-full max-w-188 mx-auto relative space-y-1.5 ${
          isCentered ? 'px-2 sm:px-4' : 'px-0'
        }`}
      >
        {/* Small Disclaimer Text (Only shown during active conversation) */}
        {!isCentered && (
          <p className="text-[11px] text-muted/65 text-center select-none font-sans tracking-tight">
            ContextForge can make mistakes. Check important info.
          </p>
        )}

        {/* Animated Voice Waveform Simulator Banner */}
        {isVoiceListening && (
          <div className="bg-surface-card border border-primary/40 rounded-2xl p-3 shadow-lg flex items-center justify-between gap-3 mb-2 animate-in fade-in zoom-in-95">
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
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-surface-card border border-hairline rounded-xl p-2 shadow-xl space-y-1 text-xs font-mono max-h-48 overflow-y-auto z-20">
            <div className="text-[10px] uppercase text-muted px-2 py-1 flex items-center gap-1">
              <Zap size={11} className="text-primary" />
              <span>Available Reasoning Skills:</span>
            </div>
            {skills.map((skill) => (
              <button
                key={skill.id}
                type="button"
                onClick={() => handleSelectSkill(skill.id.replace('skill-', ''))}
                className="w-full px-2.5 py-1.5 rounded-lg hover:bg-canvas-soft text-left flex items-center justify-between text-ink transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-primary">
                    /{skill.id.replace('skill-', '')}
                  </span>
                  <span className="text-muted truncate">{skill.name}</span>
                </div>
                <span className="text-[10px] text-muted">{skill.category}</span>
              </button>
            ))}
          </div>
        )}

        {/* Mention Agent/Connector Popover */}
        {showMentionMenu && (
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-surface-card border border-hairline rounded-xl p-2 shadow-xl space-y-1 text-xs font-mono max-h-48 overflow-y-auto z-20">
            <div className="text-[10px] uppercase text-muted px-2 py-1 flex items-center gap-1">
              <Cpu size={11} className="text-primary" />
              <span>Route to Specialized Agent:</span>
            </div>
            {agents.map((ag) => (
              <button
                key={ag.id}
                type="button"
                onClick={() =>
                  handleSelectAgentOrConnector(ag.id.replace('agent-', ''))
                }
                className="w-full px-2.5 py-1.5 rounded-lg hover:bg-canvas-soft text-left flex items-center justify-between text-ink transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-primary">
                    @{ag.id.replace('agent-', '')}
                  </span>
                  <span className="text-muted truncate">{ag.name}</span>
                </div>
                <span className="text-[10px] text-muted">{ag.role}</span>
              </button>
            ))}
          </div>
        )}

        {/* Adaptive Morphing Form with Fixed Constant Corner Radius */}
        {!isMultiline ? (
          /* 1-Row Centered Form (Fixed Corner Radius rounded-2xl sm:rounded-3xl) */
          <form
            onSubmit={handleSend}
            className="w-full min-h-11 bg-surface-card hover:bg-surface-card/90 focus-within:border-primary/60 border border-hairline-strong rounded-2xl sm:rounded-3xl px-3.5 py-1.5 sm:py-2 shadow-md transition-all duration-200 flex items-center gap-2"
          >
            {/* Left Plus Action Button */}
            <button
              type="button"
              onClick={() => {
                setInputPrompt((prev) => (prev ? prev : '/'))
                textareaRef.current?.focus()
              }}
              className="w-7 h-7 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-canvas-soft transition-colors cursor-pointer shrink-0"
              title="Add skill or connector (/ or @)"
            >
              <Plus size={16} />
            </button>

            {/* Textarea Input (Centered in single row) */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputPrompt}
              onChange={handleTextareaInput}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything..."
              className="flex-1 bg-transparent border-0 resize-none text-xs sm:text-sm text-ink placeholder:text-muted focus:outline-none py-1 max-h-32 leading-relaxed"
            />

            {/* Right Action Icons Group */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Think / Reasoning Badge Button */}
              <div
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-canvas-soft text-[11px] font-mono text-muted border border-hairline select-none"
                title="Reasoning Engine Active"
              >
                <Sparkles size={11} className="text-primary" />
                <span>Think</span>
              </div>

              {/* Voice Mic Simulator Button */}
              <button
                type="button"
                onClick={handleToggleVoice}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  isVoiceListening
                    ? 'bg-semantic-error text-white shadow-xs animate-pulse'
                    : 'text-muted hover:text-ink hover:bg-canvas-soft'
                }`}
                title={
                  isVoiceListening
                    ? 'Stop Listening'
                    : 'Voice Input (Simulate Speech-to-Text)'
                }
              >
                {isVoiceListening ? <MicOff size={14} /> : <Mic size={14} />}
              </button>

              {/* Send / Action Button */}
              <button
                type="submit"
                disabled={!inputPrompt.trim() || isGeneratingResponse}
                className="w-7 h-7 rounded-full bg-primary hover:bg-primary-active text-on-primary disabled:opacity-30 transition-all flex items-center justify-center shadow-xs cursor-pointer shrink-0"
                title="Send Message"
              >
                <Send size={13} />
              </button>
            </div>
          </form>
        ) : (
          /* 2-Row Expanded Card Toolbar Form (Identical Fixed Corner Radius rounded-2xl sm:rounded-3xl) */
          <form
            onSubmit={handleSend}
            className="w-full bg-surface-card hover:bg-surface-card/90 focus-within:border-primary/60 border border-hairline-strong rounded-2xl sm:rounded-3xl p-3 sm:p-3.5 shadow-md transition-all duration-200 flex flex-col justify-between gap-2.5"
          >
            {/* Top: Full-Width Textarea (Grows upwards without divider line) */}
            <textarea
              ref={textareaRef}
              rows={2}
              value={inputPrompt}
              onChange={handleTextareaInput}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything..."
              className="w-full bg-transparent border-0 resize-none text-xs sm:text-sm text-ink placeholder:text-muted focus:outline-none min-h-12 max-h-48 leading-relaxed overflow-y-auto"
            />

            {/* Bottom: Stationary Action Toolbar (Clean without divider line) */}
            <div className="flex items-center justify-between pt-0.5">
              {/* Left Action Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setInputPrompt((prev) => (prev ? prev : '/'))
                    textareaRef.current?.focus()
                  }}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-canvas-soft transition-colors cursor-pointer shrink-0"
                  title="Add skill or connector (/ or @)"
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Right Action Icons Group */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Think / Reasoning Badge Button */}
                <div
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-canvas-soft text-[11px] font-mono text-muted border border-hairline select-none"
                  title="Reasoning Engine Active"
                >
                  <Sparkles size={11} className="text-primary" />
                  <span>Think</span>
                </div>

                {/* Voice Mic Simulator Button */}
                <button
                  type="button"
                  onClick={handleToggleVoice}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    isVoiceListening
                      ? 'bg-semantic-error text-white shadow-xs animate-pulse'
                      : 'text-muted hover:text-ink hover:bg-canvas-soft'
                  }`}
                  title={
                    isVoiceListening
                      ? 'Stop Listening'
                      : 'Voice Input (Simulate Speech-to-Text)'
                  }
                >
                  {isVoiceListening ? <MicOff size={14} /> : <Mic size={14} />}
                </button>

                {/* Send / Action Button */}
                <button
                  type="submit"
                  disabled={!inputPrompt.trim() || isGeneratingResponse}
                  className="w-7 h-7 rounded-full bg-primary hover:bg-primary-active text-on-primary disabled:opacity-30 transition-all flex items-center justify-center shadow-xs cursor-pointer shrink-0"
                  title="Send Message"
                >
                  <Send size={13} />
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    )
  }

  // Empty State: Centered View (Headline + Capsule Input with natural optical center)
  if (isInitialState) {
    return (
      <div className="flex-1 h-full min-h-0 flex flex-col items-center justify-center bg-canvas text-ink px-4 sm:px-6 relative overflow-hidden">
        <div className="w-full max-w-188 mx-auto flex flex-col items-center text-center space-y-5 sm:space-y-6 -mt-20 sm:-mt-28">
          {/* Dynamic Greeting Headline */}
          <h1 className="text-xl sm:text-2xl font-normal tracking-tight text-ink">
            {dynamicGreeting}
          </h1>

          {/* Centered Capsule Input Form */}
          {renderInputForm(true)}
        </div>
      </div>
    )
  }

  // Active Chat State: Feed in scroll area, Input pinned at bottom
  return (
    <div className="flex-1 h-full min-h-0 flex flex-col bg-canvas text-ink overflow-hidden relative">
      {/* Main Chat Scroll Area */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="w-full max-w-188 mx-auto space-y-6 pb-8">
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
      <div className="px-4 sm:px-6 lg:px-8 py-4 bg-linear-to-t from-canvas via-canvas/95 to-transparent shrink-0 sticky bottom-0 z-10 w-full backdrop-blur-xs">
        {renderInputForm(false)}
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
