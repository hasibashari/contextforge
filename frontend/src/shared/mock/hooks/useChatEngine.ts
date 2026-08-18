import { useState, useCallback, useMemo } from 'react'
import type {
  ChatSession,
  ChatMessage,
  Artifact,
  ActionCardData,
  ActivityLogEntry,
  CalendarEvent,
} from '@/shared/types/workspace'
import { INITIAL_CHAT_SESSIONS, INITIAL_ARTIFACTS } from '../mockData'
import {
  generateObsidianNoteOutput,
  generateCodeMutationOutput,
  generateWebResearchOutput,
  generateCalendarScheduleOutput,
  generateVisualAssetOutput,
  generateGeneralReasoningOutput,
} from '../generators/responseGenerators'

export function useChatEngine(
  calendarEvents: CalendarEvent[],
  showToast: (msg: string) => void,
  setActivities: React.Dispatch<React.SetStateAction<ActivityLogEntry[]>>,
  setIsAsideOpen: (open: boolean) => void
) {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>(INITIAL_CHAT_SESSIONS)
  const [activeSessionId, setActiveSessionId] = useState<string>(
    INITIAL_CHAT_SESSIONS[0]?.id || 'session-sprint-planning'
  )
  const [artifacts, setArtifacts] = useState<Artifact[]>(INITIAL_ARTIFACTS)
  const [activeArtifact, setActiveArtifact] = useState<Artifact | null>(INITIAL_ARTIFACTS[0] || null)
  const [isGeneratingResponse, setIsGeneratingResponse] = useState<boolean>(false)
  const [selectedAgentMode, setSelectedAgentMode] = useState<string>('auto')

  const activeSession = useMemo(() => {
    return chatSessions.find((s) => s.id === activeSessionId) || chatSessions[0]
  }, [chatSessions, activeSessionId])

  const createNewChatSession = useCallback(() => {
    const newSessionId = `session-${Date.now()}`
    const newSession: ChatSession = {
      id: newSessionId,
      title: 'New Chat',
      createdAt: 'Just now',
      messages: [],
    }

    setChatSessions((prev) => [newSession, ...prev])
    setActiveSessionId(newSessionId)
    setActiveArtifact(null)
    showToast('✨ New chat session started')
    return newSessionId
  }, [showToast])

  const switchChatSession = useCallback(
    (sessionId: string) => {
      setActiveSessionId(sessionId)
      const targetSession = chatSessions.find((s) => s.id === sessionId)
      if (targetSession?.activeArtifactId) {
        const art = artifacts.find((a) => a.id === targetSession.activeArtifactId)
        if (art) setActiveArtifact(art)
      }
    },
    [chatSessions, artifacts]
  )

  const saveArtifactContent = useCallback(
    (artifactId: string, newContent: string) => {
      setArtifacts((prev) =>
        prev.map((art) => {
          if (art.id === artifactId) {
            const updated = {
              ...art,
              content: newContent,
              updatedAt: 'Just now',
              wordCount: newContent.split(/\s+/).filter(Boolean).length,
            }
            if (activeArtifact?.id === artifactId) {
              setActiveArtifact(updated)
            }
            return updated
          }
          return art
        })
      )
      showToast('✓ Document changes synced to Obsidian')
    },
    [activeArtifact, showToast]
  )

  const executeCardAction = useCallback(
    (actionKey: string, card: ActionCardData) => {
      if (actionKey === 'open_aside' || actionKey === 'open_schedule') {
        setIsAsideOpen(true)
        showToast('📌 Opened in Workspace Aside')
      } else if (actionKey === 'copy_content' || actionKey === 'copy_citations') {
        showToast('📋 Copied content to clipboard')
      } else {
        showToast(`Action "${actionKey}" executed on ${card.title}`)
      }
    },
    [setIsAsideOpen, showToast]
  )

  const triggerMorningBriefing = useCallback(() => {
    const briefingMsgId = `msg-asst-briefing-${Date.now()}`
    const upcomingEvents = calendarEvents.filter((e) => e.status !== 'completed')
    const eventsListText =
      upcomingEvents.length > 0
        ? upcomingEvents
            .map((e) => `• **${e.time}** - ${e.title} *(${e.duration})*`)
            .join('\n')
        : '• *No upcoming meetings scheduled for the rest of today.*'

    const greetingContent = `🌅 **Good morning, Alex!** Here is your automated daily executive briefing:\n\n### 📅 Today's Schedule Overview\n${eventsListText}\n\n### ⚡ Priority Action Items\n1. **PR #104 (Token Compliance)** is awaiting your human approval checkpoint.\n2. **Obsidian Sprint 35 Notes** have been synchronized to your local vault.\n\nWould you like me to draft meeting agendas or prepare technical discussion points for your team sync?`

    const assistantMsg: ChatMessage = {
      id: briefingMsgId,
      role: 'assistant',
      content: greetingContent,
      timestamp: 'Just now',
      intent: {
        toolName: 'proactive_morning_briefing',
        service: 'briefing',
        status: 'completed',
        summaryText: `Morning Briefing: ${upcomingEvents.length} events, 1 pending PR`,
      },
    }

    setChatSessions((prev) =>
      prev.map((session) =>
        session.id === activeSessionId
          ? {
              ...session,
              messages: [...session.messages, assistantMsg],
            }
          : session
      )
    )

    const newAct: ActivityLogEntry = {
      id: `act-briefing-${Date.now()}`,
      timestamp: 'Just now',
      agentId: 'agent-sec-docs',
      agentName: 'ContextForge Proactive Assistant',
      actionType: 'morning_briefing',
      summary: `Dispatched automated morning briefing with ${upcomingEvents.length} agenda items`,
      status: 'success',
    }
    setActivities((prev) => [newAct, ...prev])
    showToast('🌅 Automated Morning Briefing triggered successfully!')
  }, [activeSessionId, calendarEvents, setActivities, showToast])

  const sendChatMessage = useCallback(
    async (prompt: string, customOptions?: { agentId?: string; sources?: string[] }) => {
      if (!prompt.trim() || isGeneratingResponse) return

      const targetAgentId = customOptions?.agentId || selectedAgentMode
      void targetAgentId

      const userMsgId = `msg-user-${Date.now()}`
      const userMessage: ChatMessage = {
        id: userMsgId,
        role: 'user',
        content: prompt.trim(),
        timestamp: 'Just now',
      }

      // Add user message immediately
      setChatSessions((prev) =>
        prev.map((session) =>
          session.id === activeSessionId
            ? {
                ...session,
                messages: [...session.messages, userMessage],
              }
            : session
        )
      )

      setIsGeneratingResponse(true)

      // Simulate streaming latency
      await new Promise((resolve) => setTimeout(resolve, 800))

      const lower = prompt.toLowerCase()

      // Route to pure generators
      let output
      let activityType: ActivityLogEntry['actionType'] = 'tool_invoked'
      let activitySummary = ''
      let activityAgent = 'ContextForge Core Orchestrator'
      let toastText = ''

      if (lower.includes('obsidian') || lower.includes('sprint') || lower.includes('catat') || lower.includes('note')) {
        output = generateObsidianNoteOutput(prompt)
        activityType = 'obsidian_note_created'
        activitySummary = `Obsidian Vault Worker wrote note: "${output.artifact?.locationPath}"`
        activityAgent = 'Obsidian Vault Worker (Side Agent)'
        toastText = 'Obsidian note saved to vault'
      } else if (
        lower.includes('middleware') ||
        lower.includes('file') ||
        lower.includes('code') ||
        lower.includes('auth.ts') ||
        lower.includes('buatkan') ||
        lower.includes('edit')
      ) {
        output = generateCodeMutationOutput(prompt)
        activityType = 'ast_verified'
        activitySummary = `CLI Sandbox Runner created verified code for: "${output.artifact?.locationPath}"`
        activityAgent = 'CLI & Code Sandbox Runner (Side Agent)'
        toastText = 'Source code created and verified'
      } else if (lower.includes('remind') || lower.includes('jadwal') || lower.includes('calendar') || lower.includes('meeting')) {
        output = generateCalendarScheduleOutput(prompt)
        activityType = 'reminder_created'
        activitySummary = `Calendar Worker created scheduled event`
        activityAgent = 'Calendar & Workflow Worker (Side Agent)'
        toastText = 'Calendar event scheduled'
      } else if (lower.includes('gambar') || lower.includes('diagram') || lower.includes('visual') || lower.includes('desain')) {
        output = generateVisualAssetOutput(prompt)
        activityType = 'image_generated'
        activitySummary = `GPU Renderer generated visual asset`
        activityAgent = 'Visual & Asset Generator (Side Agent)'
        toastText = 'Visual asset rendered'
      } else if (
        lower.includes('cari') ||
        lower.includes('search') ||
        lower.includes('web') ||
        lower.includes('internet') ||
        lower.includes('berita') ||
        lower.includes('news') ||
        lower.includes('tren') ||
        lower.includes('trend') ||
        lower.includes('update') ||
        lower.includes('ai')
      ) {
        output = generateWebResearchOutput(prompt)
        activityType = 'web_searched'
        activitySummary = `Main Agent executed read-only web search for: "${prompt.slice(0, 40)}"`
        activityAgent = 'ContextForge Core Orchestrator (Read-Only)'
        toastText = 'Web research synthesized'
      } else {
        output = generateGeneralReasoningOutput(prompt)
      }

      const assistantMsg: ChatMessage = {
        id: `msg-asst-${Date.now()}`,
        role: 'assistant',
        content: output.textContent,
        timestamp: 'Just now',
        intent: output.intent,
        sideAgent: output.sideAgent,
        artifactId: output.artifact?.id,
        sourceDomains: output.sourceDomains,
      }

      if (output.artifact) {
        setArtifacts((prev) => [output.artifact!, ...prev])
        setActiveArtifact(output.artifact)
        setIsAsideOpen(true)
      }

      setChatSessions((prev) =>
        prev.map((session) =>
          session.id === activeSessionId
            ? {
                ...session,
                activeArtifactId: output.artifact?.id || session.activeArtifactId,
                messages: [...session.messages, assistantMsg],
              }
            : session
        )
      )

      if (activitySummary) {
        const newAct: ActivityLogEntry = {
          id: `act-${Date.now()}`,
          timestamp: 'Just now',
          agentId: output.sideAgent?.agentId || 'agent-sec-docs',
          agentName: activityAgent,
          actionType: activityType,
          summary: activitySummary,
          status: 'success',
        }
        setActivities((prev) => [newAct, ...prev])
      }

      if (toastText) {
        showToast(toastText)
      }

      setIsGeneratingResponse(false)
    },
    [activeSessionId, isGeneratingResponse, selectedAgentMode, setActivities, showToast, setIsAsideOpen]
  )

  return {
    chatSessions,
    activeSessionId,
    activeSession,
    artifacts,
    activeArtifact,
    isGeneratingResponse,
    selectedAgentMode,
    setActiveArtifact,
    setSelectedAgentMode,
    saveArtifactContent,
    executeCardAction,
    triggerMorningBriefing,
    sendChatMessage,
    createNewChatSession,
    switchChatSession,
  }
}
