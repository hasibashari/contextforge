import React, { useState, useRef, useEffect } from 'react'
import {
  Send,
  Sparkles,
  Mic,
  MicOff,
  Plus,
  Paperclip,
  FileText,
  X,
  Zap,
  Bot,
} from 'lucide-react'
import type { Skill, Agent } from '@/shared/types/workspace'
import { Badge } from '@/shared'
import { SlashCommandPopover } from './SlashCommandPopover'
import { AgentMentionPopover } from './AgentMentionPopover'

interface AttachedFileItem {
  id: string
  name: string
  size: number
  file: File
  textPreview?: string
}

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
  const [attachedFiles, setAttachedFiles] = useState<AttachedFileItem[]>([])
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const plusMenuRef = useRef<HTMLDivElement>(null)
  const plusButtonRef = useRef<HTMLButtonElement>(null)
  const plusButtonMultilineRef = useRef<HTMLButtonElement>(null)

  const showSlashMenu = inputPrompt.startsWith('/') && !inputPrompt.includes(' ')
  const showMentionMenu = inputPrompt.startsWith('@') && !inputPrompt.includes(' ')
  const shouldShowMultiline = isMultiline || inputPrompt.includes('\n') || attachedFiles.length > 0

  // Close Plus Menu on outside click (excluding the toggle buttons)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      const isInsideMenu = plusMenuRef.current?.contains(target)
      const isInsideButton =
        plusButtonRef.current?.contains(target) ||
        plusButtonMultilineRef.current?.contains(target)

      if (!isInsideMenu && !isInsideButton) {
        setIsPlusMenuOpen(false)
      }
    }
    if (isPlusMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isPlusMenuOpen])

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const selectedList = Array.from(e.target.files)

    const newItems: AttachedFileItem[] = []
    for (const f of selectedList) {
      let preview: string | undefined
      const isText =
        f.type.startsWith('text/') ||
        f.name.endsWith('.md') ||
        f.name.endsWith('.txt') ||
        f.name.endsWith('.json') ||
        f.name.endsWith('.ts') ||
        f.name.endsWith('.tsx') ||
        f.name.endsWith('.js') ||
        f.name.endsWith('.jsx') ||
        f.name.endsWith('.py') ||
        f.name.endsWith('.sql') ||
        f.name.endsWith('.csv') ||
        f.name.endsWith('.html') ||
        f.name.endsWith('.css')

      if (isText) {
        try {
          preview = await f.text()
        } catch {
          // unreadable
        }
      }

      newItems.push({
        id: `${f.name}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: f.name,
        size: f.size,
        file: f,
        textPreview: preview,
      })
    }

    setAttachedFiles((prev) => [...prev, ...newItems])
    setIsMultiline(true)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemoveAttachedFile = (id: string) => {
    setAttachedFiles((prev) => prev.filter((item) => item.id !== id))
  }

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault()
    if ((!inputPrompt.trim() && attachedFiles.length === 0) || isGeneratingResponse) return

    let message = inputPrompt.trim()

    if (attachedFiles.length > 0) {
      const fileContexts = attachedFiles
        .map((f) => {
          if (f.textPreview) {
            return `### Attached Document: ${f.name}\n\`\`\`\n${f.textPreview.slice(0, 10000)}\n\`\`\``
          }
          return `[Attached File: ${f.name} (${formatFileSize(f.size)})]`
        })
        .join('\n\n')

      message = message
        ? `${message}\n\n---\n**Attached Context Documents:**\n${fileContexts}`
        : `Please analyze the attached document(s):\n\n${fileContexts}`
    }

    setInputPrompt('')
    setAttachedFiles([])
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
      if (shouldShowMultiline) {
        textareaRef.current.style.height = `${Math.min(
          textareaRef.current.scrollHeight,
          200,
        )}px`
      }
    }
  }, [inputPrompt, shouldShowMultiline])

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
      if (val === '' && attachedFiles.length === 0) {
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
      {/* Hidden File Picker Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        multiple
        accept=".md,.txt,.pdf,.json,.ts,.tsx,.py,.js,.jsx,.html,.css,.csv,.sql"
        className="hidden"
      />

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

      {/* Unified Plus Menu Dropdown (Renders below input bar) */}
      {isPlusMenuOpen && (
        <div
          ref={plusMenuRef}
          className="absolute top-full left-0 mt-2 w-72 sm:w-80 bg-surface-card border border-hairline rounded-2xl p-1.5 shadow-2xl space-y-1 text-xs z-30 animate-in fade-in slide-in-from-top-2 duration-150"
        >
          <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-caption text-muted font-semibold border-b border-hairline/60 pb-1 mb-1">
            Add to Conversation
          </div>

          {/* 1. Upload Documents */}
          <button
            type="button"
            onClick={() => {
              setIsPlusMenuOpen(false)
              fileInputRef.current?.click()
            }}
            className="w-full p-2 rounded-xl hover:bg-canvas-soft text-left flex items-start gap-2.5 text-ink transition-colors cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-primary group-hover:text-on-primary transition-colors">
              <Paperclip size={14} />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-ink flex items-center gap-1.5">
                <span>Attach Documents / Code</span>
              </div>
              <div className="text-[11px] text-muted truncate">
                Upload .md, .txt, .pdf, .ts, .py, or .json
              </div>
            </div>
          </button>

          {/* 2. Reasoning Skills */}
          <button
            type="button"
            onClick={() => {
              setIsPlusMenuOpen(false)
              setInputPrompt('/')
              textareaRef.current?.focus()
            }}
            className="w-full p-2 rounded-xl hover:bg-canvas-soft text-left flex items-start gap-2.5 text-ink transition-colors cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-lg bg-timeline-edit/10 text-timeline-edit flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-timeline-edit group-hover:text-on-primary transition-colors">
              <Zap size={14} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-ink flex items-center justify-between">
                <span>Browse Skills & SOPs</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-strong text-muted border border-hairline font-bold">
                  /
                </span>
              </div>
              <div className="text-[11px] text-muted truncate">
                Obsidian synthesis, web research & playbooks
              </div>
            </div>
          </button>

          {/* 3. Agent Personas */}
          <button
            type="button"
            onClick={() => {
              setIsPlusMenuOpen(false)
              setInputPrompt('@')
              textareaRef.current?.focus()
            }}
            className="w-full p-2 rounded-xl hover:bg-canvas-soft text-left flex items-start gap-2.5 text-ink transition-colors cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Bot size={14} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-ink flex items-center justify-between">
                <span>Route to Agent Persona</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-strong text-muted border border-hairline font-bold">
                  @
                </span>
              </div>
              <div className="text-[11px] text-muted truncate">
                Specialized models & persona dispatch
              </div>
            </div>
          </button>
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
        className={`w-full bg-surface-card hover:bg-surface-card focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 border border-hairline rounded-2xl sm:rounded-3xl shadow-md transition-all duration-200 flex flex-col justify-between ${
          shouldShowMultiline
            ? 'pt-2.5 pb-2 px-3 sm:px-3.5 gap-2'
            : 'min-h-11 px-3.5 py-1.5 sm:py-2 justify-center'
        }`}
      >
        {/* Attached Document Chips (Visible when files are attached) */}
        {attachedFiles.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-0.5 pb-1">
            {attachedFiles.map((item) => (
              <span
                key={item.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-strong/60 border border-hairline text-ink font-mono text-[11px] shadow-2xs animate-in fade-in zoom-in-95"
              >
                <FileText size={12} className="text-primary shrink-0" />
                <span className="max-w-32.5 truncate font-medium">{item.name}</span>
                <span className="text-[10px] text-muted">({formatFileSize(item.size)})</span>
                <button
                  type="button"
                  onClick={() => handleRemoveAttachedFile(item.id)}
                  className="ml-0.5 p-0.5 rounded-md hover:bg-surface-card text-muted hover:text-semantic-error transition-colors cursor-pointer"
                  title="Remove attachment"
                >
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Main Content Row */}
        <div
          className={`w-full flex ${
            shouldShowMultiline ? 'flex-col' : 'items-center gap-1.5'
          }`}
        >
          {/* Single Unified Plus Button (1-line mode) */}
          {!shouldShowMultiline && (
            <div className="flex items-center shrink-0">
              <button
                ref={plusButtonRef}
                type="button"
                onClick={() => setIsPlusMenuOpen((prev) => !prev)}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  isPlusMenuOpen
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-muted hover:text-ink hover:bg-canvas-soft'
                }`}
                title="Add to conversation (Files, Skills, Agents)"
              >
                <Plus size={16} className={`transition-transform duration-150 ${isPlusMenuOpen ? 'rotate-45' : ''}`} />
              </button>
            </div>
          )}

          {/* Unified Textarea (NEVER unmounted -> Cursor/Focus is never lost!) */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputPrompt}
            onChange={handleTextareaInput}
            onKeyDown={handleKeyDown}
            placeholder={
              attachedFiles.length > 0
                ? 'Add instructions for attached document(s)...'
                : 'Ask anything...'
            }
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
                disabled={(!inputPrompt.trim() && attachedFiles.length === 0) || isGeneratingResponse}
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
          <div className="flex items-center justify-between animate-in fade-in duration-200 pt-1">
            {/* Left Action Button (Single Unified Plus) */}
            <div className="flex items-center">
              <button
                ref={plusButtonMultilineRef}
                type="button"
                onClick={() => setIsPlusMenuOpen((prev) => !prev)}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  isPlusMenuOpen
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-muted hover:text-ink hover:bg-canvas-soft'
                }`}
                title="Add to conversation (Files, Skills, Agents)"
              >
                <Plus size={16} className={`transition-transform duration-150 ${isPlusMenuOpen ? 'rotate-45' : ''}`} />
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
                disabled={(!inputPrompt.trim() && attachedFiles.length === 0) || isGeneratingResponse}
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
