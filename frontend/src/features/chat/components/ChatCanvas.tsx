import { useRef, useEffect } from 'react'
import { useWorkspace } from '@/shared'
import { ChatInputBar } from './ChatInputBar'
import { ChatMessageItem } from './ChatMessageItem'
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

export default function ChatCanvas() {
  const {
    activeSession,
    isGeneratingResponse,
    liveReasoningState,
    sendChatMessage,
    agents,
    skills,
    setAsideOpen,
    setActiveArtifact,
    artifacts,
    showToast,
  } = useWorkspace()

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [activeSession?.messages, isGeneratingResponse, liveReasoningState?.steps?.length])

  const handleOpenArtifact = (art: Artifact) => {
    setActiveArtifact(art)
    setAsideOpen(true)
    showToast('Opened in Workspace Aside', 'info')
  }

  const isInitialState =
    !activeSession?.messages || activeSession.messages.length === 0

  const dynamicGreeting = getGreetingForSession(activeSession?.id)

  const PROMPT_SUGGESTIONS = [
    { label: '📝 Buat Daily Note Obsidian', prompt: 'Buatkan atomic daily note di Obsidian untuk hari ini dengan frontmatter dan backlinks.' },
    { label: '📱 Cek Screen Time Android', prompt: 'Ambil data Screen Time dan aplikasi aktif hari ini melalui Android MCP Bridge.' },
    { label: '📑 Sinkronkan Task Notion', prompt: 'Cari dan tampilkan daftar task prioritas dari workspace Notion saya.' },
    { label: '📅 Jadwal Google Calendar', prompt: 'Periksa jadwal rapat dan agenda penting saya di Google Calendar hari ini.' },
  ]

  // Empty State: Centered View (Headline + Capsule Input + Suggestion Chips)
  if (isInitialState) {
    return (
      <div className="flex-1 h-full min-h-0 flex flex-col items-center justify-center bg-canvas text-ink px-4 sm:px-6 relative overflow-hidden">
        <div className="w-full max-w-188 mx-auto flex flex-col items-center text-center space-y-6 -mt-16 sm:-mt-24">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink font-sans">
              {dynamicGreeting}
            </h1>
            <p className="text-xs sm:text-sm text-muted font-sans max-w-md mx-auto">
              Autonomous AI agent workspace with direct Model Context Protocol (MCP) tool integration.
            </p>
          </div>

          <ChatInputBar
            isCentered={true}
            onSendMessage={sendChatMessage}
            isGeneratingResponse={isGeneratingResponse}
            skills={skills}
            agents={agents}
          />

          {/* Quick Prompt Suggestion Chips */}
          <div className="flex items-center justify-center gap-2 flex-wrap max-w-lg pt-1">
            {PROMPT_SUGGESTIONS.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => sendChatMessage(item.prompt)}
                className="px-3 py-1.5 rounded-xl bg-surface-card hover:bg-canvas-soft border border-hairline hover:border-primary/40 text-ink text-xs font-sans font-medium transition-all duration-150 cursor-pointer shadow-2xs hover:shadow-xs"
              >
                {item.label}
              </button>
            ))}
          </div>
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
          {activeSession?.messages.map((msg: ChatMessage, idx: number) => {
            const isLast = idx === (activeSession.messages.length - 1)
            const isMessageStreaming = isGeneratingResponse && isLast && msg.role === 'assistant'

            return (
              <ChatMessageItem
                key={msg.id}
                msg={msg}
                artifacts={artifacts}
                isStreaming={isMessageStreaming}
                onOpenArtifact={handleOpenArtifact}
              />
            )
          })}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Bottom Floating Prompt Area (Pinned at Bottom) */}
      <div className="px-4 sm:px-6 lg:px-8 py-4 bg-linear-to-t from-canvas via-canvas/95 to-transparent shrink-0 sticky bottom-0 z-10 w-full backdrop-blur-xs">
        <ChatInputBar
          isCentered={false}
          onSendMessage={sendChatMessage}
          isGeneratingResponse={isGeneratingResponse}
          skills={skills}
          agents={agents}
        />
      </div>
    </div>
  )
}
