import { useRef, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'
import { useWorkspace } from '@/shared/mock'
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
    executeCardAction,
    showToast,
  } = useWorkspace()

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [activeSession?.messages, isGeneratingResponse])

  const handleOpenArtifact = (art: Artifact) => {
    setActiveArtifact(art)
    setAsideOpen(true)
    showToast('Opened in Workspace Aside', 'info')
  }

  const isInitialState =
    !activeSession?.messages || activeSession.messages.length === 0

  const dynamicGreeting = getGreetingForSession(activeSession?.id)

  // Empty State: Centered View (Headline + Capsule Input)
  if (isInitialState) {
    return (
      <div className="flex-1 h-full min-h-0 flex flex-col items-center justify-center bg-canvas text-ink px-4 sm:px-6 relative overflow-hidden">
        <div className="w-full max-w-188 mx-auto flex flex-col items-center text-center space-y-5 sm:space-y-6 -mt-20 sm:-mt-28">
          <h1 className="text-xl sm:text-2xl font-normal tracking-tight text-ink">
            {dynamicGreeting}
          </h1>

          <ChatInputBar
            isCentered={true}
            onSendMessage={sendChatMessage}
            isGeneratingResponse={isGeneratingResponse}
            skills={skills}
            agents={agents}
          />
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
          {activeSession?.messages.map((msg: ChatMessage) => (
            <ChatMessageItem
              key={msg.id}
              msg={msg}
              artifacts={artifacts}
              onOpenArtifact={handleOpenArtifact}
              onExecuteAction={executeCardAction}
            />
          ))}

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
