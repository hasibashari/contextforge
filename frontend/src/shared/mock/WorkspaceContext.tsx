import React, { useState, useCallback } from 'react'
import type { ActivityLogEntry, ToastNotification, ToastType } from '@/shared/types/workspace'
import { INITIAL_ACTIVITIES } from './mockData'
import { WorkspaceContext } from './context'
import { useCalendarMemory } from './hooks/useCalendarMemory'
import { useEcosystemManager } from './hooks/useEcosystemManager'
import { useKnowledgeManager } from './hooks/useKnowledgeManager'
import { useTaskManager } from './hooks/useTaskManager'
import { useChatEngine } from './hooks/useChatEngine'

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activities, setActivities] = useState<ActivityLogEntry[]>(INITIAL_ACTIVITIES)
  const [toasts, setToasts] = useState<ToastNotification[]>([])
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [isAsideOpen, setIsAsideOpen] = useState<boolean>(true)

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback((msg: string, type?: ToastType) => {
    let toastType: ToastType = type || 'success'
    if (!type) {
      const lower = msg.toLowerCase()
      if (lower.includes('error') || lower.includes('failed') || lower.includes('rejected')) {
        toastType = 'error'
      } else if (lower.includes('warning') || lower.includes('disabled') || lower.includes('uninstalled')) {
        toastType = 'warning'
      } else if (lower.includes('info') || lower.includes('opened') || lower.includes('testing') || lower.includes('synthesized')) {
        toastType = 'info'
      }
    }

    const newToast: ToastNotification = {
      id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      message: msg,
      type: toastType,
    }

    setToastMessage(msg)
    setToasts((prev) => [newToast, ...prev].slice(0, 3))

    setTimeout(() => {
      dismissToast(newToast.id)
    }, 3500)
  }, [dismissToast])

  const clearToast = useCallback(() => {
    setToastMessage(null)
    setToasts([])
  }, [])

  const toggleAside = useCallback(() => {
    setIsAsideOpen((prev) => !prev)
  }, [])

  const setAsideOpen = useCallback((open: boolean) => {
    setIsAsideOpen(open)
  }, [])

  // Domain Hooks
  const calendarMemory = useCalendarMemory(showToast)
  const ecosystem = useEcosystemManager(showToast, setActivities)
  const knowledge = useKnowledgeManager(showToast)
  const taskManager = useTaskManager(ecosystem.agents, showToast)
  const chatEngine = useChatEngine(
    calendarMemory.calendarEvents,
    showToast,
    setActivities,
    setAsideOpen
  )

  return (
    <WorkspaceContext.Provider
      value={{
        // Legacy / Entity State
        tasks: taskManager.tasks,
        agents: ecosystem.agents,
        skills: ecosystem.skills,
        plugins: ecosystem.plugins,
        knowledgeSources: knowledge.knowledgeSources,
        integrations: ecosystem.integrations,
        activities,
        toastMessage,
        activeRunningTaskId: taskManager.activeRunningTaskId,

        // Ecosystem Actions
        toggleSkill: ecosystem.toggleSkill,
        installPlugin: ecosystem.installPlugin,
        uninstallPlugin: ecosystem.uninstallPlugin,
        toggleIntegrationConnect: ecosystem.toggleIntegrationConnect,
        updateConnectorConfig: ecosystem.updateConnectorConfig,
        addCustomConnector: ecosystem.addCustomConnector,
        addCustomSkill: ecosystem.addCustomSkill,
        updateAgentCapabilities: ecosystem.updateAgentCapabilities,

        // Conversational Agentic State
        chatSessions: chatEngine.chatSessions,
        activeSessionId: chatEngine.activeSessionId,
        activeSession: chatEngine.activeSession,
        activeArtifact: chatEngine.activeArtifact,
        artifacts: chatEngine.artifacts,
        isAsideOpen,
        isGeneratingResponse: chatEngine.isGeneratingResponse,
        selectedAgentMode: chatEngine.selectedAgentMode,
        activeSourceFilters: knowledge.activeSourceFilters,

        // Proactive, Calendar & Memory State & Actions
        calendarEvents: calendarMemory.calendarEvents,
        userMemories: calendarMemory.userMemories,
        triggerMorningBriefing: chatEngine.triggerMorningBriefing,
        addCalendarEvent: calendarMemory.addCalendarEvent,
        updateCalendarEventStatus: calendarMemory.updateCalendarEventStatus,
        addUserMemory: calendarMemory.addUserMemory,
        deleteUserMemory: calendarMemory.deleteUserMemory,

        // Conversational Actions
        sendChatMessage: chatEngine.sendChatMessage,
        createNewChatSession: chatEngine.createNewChatSession,
        switchChatSession: chatEngine.switchChatSession,
        setActiveArtifact: chatEngine.setActiveArtifact,
        saveArtifactContent: chatEngine.saveArtifactContent,
        executeCardAction: chatEngine.executeCardAction,
        toggleAside,
        setAsideOpen,
        setSelectedAgentMode: chatEngine.setSelectedAgentMode,
        toggleSourceFilter: knowledge.toggleSourceFilter,

        // Task & Knowledge Actions
        createTask: taskManager.createTask,
        getTaskById: taskManager.getTaskById,
        approveTask: taskManager.approveTask,
        rejectTask: taskManager.rejectTask,
        advanceTaskStage: taskManager.advanceTaskStage,
        simulateLiveRun: taskManager.simulateLiveRun,
        toggleKnowledgeSync: knowledge.toggleKnowledgeSync,
        toggleKnowledgeSourceConnect: knowledge.toggleKnowledgeSourceConnect,
        addKnowledgeSource: knowledge.addKnowledgeSource,
        testIntegration: ecosystem.testIntegration,
        toasts,
        dismissToast,
        showToast,
        clearToast,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}
