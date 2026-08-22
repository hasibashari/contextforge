import React, { useState, useCallback } from 'react'
import type { ToastNotification, ToastType } from '@/shared/types/workspace'
import { WorkspaceContext } from './context'
import { useUserMemory } from './hooks/useUserMemory'
import { useEcosystemManager } from './hooks/useEcosystemManager'
import { useKnowledgeManager } from './hooks/useKnowledgeManager'
import { useChatEngine } from './hooks/useChatEngine'
import { useAutomationManager } from './hooks/useAutomationManager'

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastNotification[]>([])
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [isAsideOpen, setIsAsideOpen] = useState<boolean>(false)

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
  const userMemory = useUserMemory(showToast)
  const ecosystem = useEcosystemManager(showToast)
  const knowledge = useKnowledgeManager(showToast)
  const automationManager = useAutomationManager(showToast)
  const chatEngine = useChatEngine(
    showToast,
    undefined,
    setAsideOpen,
    automationManager.createAutomation
  )

  return (
    <WorkspaceContext.Provider
      value={{
        // 4 Pillars State
        agents: ecosystem.agents,
        skills: ecosystem.skills,
        knowledgeSources: knowledge.knowledgeSources,
        integrations: ecosystem.integrations,
        toastMessage,
        toasts,

        // Automation & Trigger State
        automations: automationManager.automations,
        activeAutomationsCount: automationManager.activeAutomationsCount,
        runningAutomationId: automationManager.runningAutomationId,
        createAutomation: automationManager.createAutomation,
        updateAutomation: automationManager.updateAutomation,
        deleteAutomation: automationManager.deleteAutomation,
        toggleAutomationActive: automationManager.toggleAutomationActive,
        runAutomationNow: automationManager.runAutomationNow,

        // Ecosystem Actions
        toggleSkill: ecosystem.toggleSkill,
        addCustomSkill: ecosystem.addCustomSkill,
        toggleIntegrationConnect: ecosystem.toggleIntegrationConnect,
        updateConnectorConfig: ecosystem.updateConnectorConfig,
        addCustomConnector: ecosystem.addCustomConnector,
        updateAgentCapabilities: ecosystem.updateAgentCapabilities,
        testIntegration: ecosystem.testIntegration,
        discoverTools: ecosystem.discoverTools,
        refreshIntegrations: ecosystem.refreshIntegrations,

        // Conversational Agentic State
        chatSessions: chatEngine.chatSessions,
        activeSessionId: chatEngine.activeSessionId,
        activeSession: chatEngine.activeSession,
        activeArtifact: chatEngine.activeArtifact,
        artifacts: chatEngine.artifacts,
        isGeneratingResponse: chatEngine.isGeneratingResponse,
        liveReasoningState: chatEngine.liveReasoningState,
        selectedAgentMode: chatEngine.selectedAgentMode,
        isAsideOpen,

        // Conversational Actions
        sendChatMessage: chatEngine.sendChatMessage,
        createNewChatSession: chatEngine.createNewChatSession,
        switchChatSession: chatEngine.switchChatSession,
        deleteChatSession: chatEngine.deleteChatSession,
        setActiveArtifact: chatEngine.setActiveArtifact,
        saveArtifactContent: chatEngine.saveArtifactContent,
        deleteArtifact: chatEngine.deleteArtifact,
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
        ingestDirectDocuments: knowledge.ingestDirectDocuments,
        uploadKnowledgeFiles: knowledge.uploadKnowledgeFiles,
        deleteKnowledgeSource: knowledge.deleteKnowledgeSource,

        // Long-Term Memory (PostgreSQL & memory-summary.md)
        userMemories: userMemory.userMemories,
        memorySummary: userMemory.memorySummary,
        addUserMemory: userMemory.addUserMemory,
        deleteUserMemory: userMemory.deleteUserMemory,
        clearAllMemories: userMemory.clearAllMemories,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}
