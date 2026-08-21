import React, { useState, useRef, useEffect } from 'react'
import {
  Send,
  Sparkles,
  Mic,
  MicOff,
  Plus,
} from 'lucide-react'
import type { Skill, Agent } from '@/shared/types/workspace'
import { Badge } from '@/shared/components'
import { SlashCommandPopover } from './SlashCommandPopover'
import { AgentMentionPopover } from './AgentMentionPopover'

interface ChatInputBarProps {
  isCentered?: boolean
  onSendMessage: (msg: string) => void
  isGeneratingResponse: boolean
  skills: Skill[]
  agents: Agent[]
}

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
  isCentered = false,
  onSendMessage,
  isGeneratingResponse,
  skills,
  agents,
}) => {
  const [inputPrompt, setInputPrompt] = useState('')
  const [isMultiline, setIsMultiline] = useState(false)
  const [isVoiceListening, setIsVoiceListening] = useState(false)
  const [voiceTranscriptText, setVoiceTranscriptText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const showSlashMenu = inputPrompt.startsWith('/') && !inputPrompt.includes(' ')
  const showMentionMenu = inputPrompt.startsWith('@') && !inputPrompt.includes(' ')
  const shouldShowMultiline = isMultiline || inputPrompt.includes('\n')

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
      setIsMultiline(true)
      setIsVoiceListening(false)
      setVoiceTranscriptText('')
      if (textareaRef.current) {
        textareaRef.current.focus()
      }
    }, 2800)
  }

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!inputPrompt.trim() || isGeneratingResponse) return

    const message = inputPrompt.trim()
    setInputPrompt('')
    setIsMultiline(false)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    onSendMessage(message)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Automatically adjust textarea height whenever prompt or mode changes
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      if (isMultiline || inputPrompt.includes('\n')) {
        textareaRef.current.style.height = `${Math.min(
          textareaRef.current.scrollHeight,
          200,
        )}px`
      }
    }
  }, [inputPrompt, isMultiline])

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setInputPrompt(val)

    const hasNewline = val.includes('\n')
    const isOverflow = e.target.scrollHeight >= 38

    if (!isMultiline) {
      // Switch to 2-row mode when text touches the right elements or user presses Shift+Enter
      if (hasNewline || isOverflow) {
        setIsMultiline(true)
      }
    } else {
      // In 2-row mode: STAY in 2-row mode until text is completely deleted down to empty
      if (val === '') {
        setIsMultiline(false)
      }
    }
  }

  const handleSelectSkill = (skillCommand: string) => {
    setInputPrompt(`/${skillCommand} `)
    textareaRef.current?.focus()
  }

  const handleSelectAgentOrConnector = (target: string) => {
    setInputPrompt(`@${target} `)
    textareaRef.current?.focus()
  }

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
        <SlashCommandPopover
          skills={skills}
          onSelectSkill={handleSelectSkill}
        />
      )}

      {/* Mention Agent/Connector Popover */}
      {showMentionMenu && (
        <AgentMentionPopover
          agents={agents}
          onSelectAgent={handleSelectAgentOrConnector}
        />
      )}

      {/* Single Unified Adaptive Form */}
      <form
        onSubmit={handleSend}
        className={`w-full bg-surface-card hover:bg-surface-card/90 focus-within:border-primary/60 border border-hairline-strong rounded-2xl sm:rounded-3xl shadow-md transition-all duration-200 flex flex-col justify-between ${
          shouldShowMultiline
            ? 'pt-2.5 pb-2 px-3 sm:px-3.5 gap-1'
            : 'min-h-11 px-3.5 py-1.5 sm:py-2 justify-center'
        }`}
      >
        {/* Main Content Row */}
        <div
          className={`w-full flex ${
            shouldShowMultiline ? 'flex-col' : 'items-center gap-2'
          }`}
        >
          {/* Inline Left Plus button (Only in 1-line mode) */}
          {!shouldShowMultiline && (
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
          )}

          {/* Unified Textarea (NEVER unmounted -> Cursor/Focus is never lost!) */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputPrompt}
            onChange={handleTextareaInput}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            className={`bg-transparent border-0 resize-none text-xs sm:text-sm text-ink placeholder:text-muted focus:outline-none leading-relaxed transition-all duration-200 ${
              shouldShowMultiline
                ? 'w-full max-h-48 p-0 overflow-y-auto'
                : 'flex-1 py-1 max-h-32'
            }`}
          />

          {/* Inline Right Action Buttons (Only in 1-line mode) */}
          {!shouldShowMultiline && (
            <div className="flex items-center gap-1 shrink-0">
              {/* Think / Reasoning Badge Button */}
              <Badge
                variant="mono"
                size="xs"
                icon={<Sparkles size={11} className="text-primary" />}
                className="hidden sm:inline-flex py-1 px-2 rounded-full cursor-default"
              >
                Think
              </Badge>

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
          )}
        </div>

        {/* Bottom Toolbar (Only in 2-line mode) */}
        {shouldShowMultiline && (
          <div className="flex items-center justify-between animate-in fade-in duration-200">
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
              <Badge
                variant="mono"
                size="xs"
                icon={<Sparkles size={11} className="text-primary" />}
                className="py-1 px-2 rounded-full cursor-default"
              >
                Think
              </Badge>

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
        )}
      </form>
    </div>
  )
}
