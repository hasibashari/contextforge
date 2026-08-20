import React, { useState, useCallback, useEffect } from 'react'
import type { ActivityLogEntry, ToastNotification, ToastType } from '@/shared/types/workspace'
import { activityApi } from '@/shared/api/activityApi'
import { WorkspaceContext } from './context'
import { useCalendarMemory } from './hooks/useCalendarMemory'
import { useEcosystemManager } from './hooks/useEcosystemManager'
import { useKnowledgeManager } from './hooks/useKnowledgeManager'
import { useTaskManager } from './hooks/useTaskManager'
import { useChatEngine } from './hooks/useChatEngine'

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activities, setActivities] = useState<ActivityLogEntry[]>([])
  const [toasts, setToasts] = useState<ToastNotification[]>([])
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [isAsideOpen, setIsAsideOpen] = useState<boolean>(false)

  // Fetch real activity logs on mount
  useEffect(() => {
    let isMounted = true
    async function loadActivities() {
      try {
        const logs = await activityApi.getLogs()
        if (Array.isArray(logs) && isMounted) {
          setActivities(logs)
        }
      } catch {
        // gracefully handle empty or offline logs
      }
    }
    void loadActivities()
    return () => {
      isMounted = false
    }
  }, [])

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
        toasts,
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
        testIntegration: ecosystem.testIntegration,

        // Conversational Agentic State
        chatSessions: chatEngine.chatSessions,
        activeSessionId: chatEngine.activeSessionId,
        activeSession: chatEngine.activeSession,
        activeArtifact: chatEngine.activeArtifact,
        artifacts: chatEngine.artifacts,
        isGeneratingResponse: chatEngine.isGeneratingResponse,
        selectedAgentMode: chatEngine.selectedAgentMode,
        isAsideOpen,

        // Conversational Actions
        sendChatMessage: chatEngine.sendChatMessage,
        createNewChatSession: chatEngine.createNewChatSession,
        switchChatSession: chatEngine.switchChatSession,
        deleteChatSession: chatEngine.deleteChatSession,
        setActiveArtifact: chatEngine.setActiveArtifact,
        saveArtifactContent: chatEngine.saveArtifactContent,
        executeCardAction: chatEngine.executeCardAction,
        triggerMorningBriefing: chatEngine.triggerMorningBriefing,
        setSelectedAgentMode: chatEngine.setSelectedAgentMode,

        // Toast & Layout Actions
        showToast,
        dismissToast,
        clearToast,
        toggleAside,
        setAsideOpen,

        // Knowledge Source Filter Grounding State
        activeSourceFilters: knowledge.activeSourceFilters,
        toggleSourceFilter: knowledge.toggleSourceFilter,
        toggleKnowledgeSync: knowledge.toggleKnowledgeSync,
        toggleKnowledgeSourceConnect: knowledge.toggleKnowledgeSourceConnect,
        addKnowledgeSource: knowledge.addKnowledgeSource,
        uploadKnowledgeFiles: knowledge.uploadKnowledgeFiles,
        deleteKnowledgeSource: knowledge.deleteKnowledgeSource,

        // Personal Hub Grounding Context
        calendarEvents: calendarMemory.calendarEvents,
        addCalendarEvent: calendarMemory.addCalendarEvent,
        updateCalendarEventStatus: calendarMemory.updateCalendarEventStatus,
        userMemories: calendarMemory.userMemories,
        addUserMemory: calendarMemory.addUserMemory,
        deleteUserMemory: calendarMemory.deleteUserMemory,

        // Task Formulation & Autonomous Planner State
        createTask: taskManager.createTask,
        getTaskById: taskManager.getTaskById,
        approveTask: taskManager.approveTask,
        rejectTask: taskManager.rejectTask,
        advanceTaskStage: taskManager.advanceTaskStage,
        simulateLiveRun: taskManager.simulateLiveRun,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}
