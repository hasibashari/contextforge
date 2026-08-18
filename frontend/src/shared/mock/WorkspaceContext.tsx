import React, { useState, useCallback, useMemo } from 'react'
import type {
  Task,
  Agent,
  KnowledgeSource,
  Integration,
  ActivityLogEntry,
  StepStage,
  TaskStatus,
} from '../types/workspace'
import {
  INITIAL_AGENTS,
  INITIAL_TASKS,
  INITIAL_KNOWLEDGE_SOURCES,
  INITIAL_INTEGRATIONS,
  INITIAL_ACTIVITIES,
} from './mockData'
import { WorkspaceContext } from './context'

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS)
  const [agents] = useState<Agent[]>(INITIAL_AGENTS)
  const [knowledgeSources, setKnowledgeSources] = useState<KnowledgeSource[]>(
    INITIAL_KNOWLEDGE_SOURCES
  )
  const [integrations, setIntegrations] = useState<Integration[]>(INITIAL_INTEGRATIONS)
  const [activities, setActivities] = useState<ActivityLogEntry[]>(INITIAL_ACTIVITIES)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [activeRunningTaskId, setActiveRunningTaskId] = useState<string | null>(null)

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev))
    }, 3500)
  }, [])

  const clearToast = useCallback(() => {
    setToastMessage(null)
  }, [])

  const getTaskById = useCallback(
    (id: string) => {
      return tasks.find((t) => t.id === id)
    },
    [tasks]
  )

  const createTask = useCallback(
    ({
      title,
      objective,
      agentId = 'agent-sec-docs',
      selectedSources,
    }: {
      title: string
      objective: string
      agentId?: string
      selectedSources: string[]
    }) => {
      const newId = `PLAN-${Math.floor(100 + Math.random() * 900)}`
      const assignedAgent = agents.find((a) => a.id === agentId) || agents[0]

      const newTask: Task = {
        id: newId,
        title: title || objective.slice(0, 60),
        objective,
        repo: 'github:acme/platform-core',
        agentId: assignedAgent.id,
        status: 'planning',
        currentStage: 'planning',
        createdAt: 'Just now',
        knowledgeSources: selectedSources.length > 0 ? selectedSources : ['source-github-core'],
        toolsUsed: assignedAgent.assignedTools,
        tokensUsed: {
          input: 1200,
          output: 350,
          total: 1550,
          estimatedCostUsd: 0.007,
        },
        steps: [
          {
            id: `step-${newId}-1`,
            stage: 'planning',
            title: 'Task Decomposition & Security Analysis',
            status: 'in_progress',
            startedAt: 'Just now',
            logs: [
              `[Agent:${assignedAgent.name}] Dispatched workflow for objective: "${objective}"`,
              `[Planning] Selected ${selectedSources.length || 1} knowledge grounding sources.`,
              `[Planning] Synthesizing execution DAG...`,
            ],
          },
        ],
      }

      setTasks((prev) => [newTask, ...prev])

      // Record Activity
      const newActivity: ActivityLogEntry = {
        id: `act-${Date.now()}`,
        timestamp: 'Just now',
        taskId: newId,
        taskTitle: newTask.title,
        agentId: assignedAgent.id,
        agentName: assignedAgent.name,
        actionType: 'task_dispatched',
        summary: `Dispatched new task ${newId}: ${newTask.title}`,
        status: 'info',
      }
      setActivities((prev) => [newActivity, ...prev])
      showToast(`⚡ Dispatched Task ${newId} to ${assignedAgent.name}`)

      return newTask
    },
    [agents, showToast]
  )

  const approveTask = useCallback(
    (taskId: string) => {
      setTasks((prev) =>
        prev.map((task) => {
          if (task.id !== taskId) return task

          const updatedDeliverable = task.deliverable
            ? {
                ...task.deliverable,
                checkpoints: task.deliverable.checkpoints.map((cp) => ({ ...cp, done: true })),
              }
            : undefined

          return {
            ...task,
            status: 'completed',
            completedAt: 'Just now',
            deliverable: updatedDeliverable,
            steps: [
              ...task.steps,
              {
                id: `step-approved-${Date.now()}`,
                stage: 'deliverable',
                title: 'Human Sign-off & Pull Request Dispatched',
                status: 'completed',
                startedAt: 'Just now',
                completedAt: 'Just now',
                logs: [
                  `[Human Gate] Approved by Lead Architect.`,
                  `[GitHub Dispatch] Pull request branch merged into staging.`,
                  `[Notification] Closed deliverable cycle successfully.`,
                ],
              },
            ],
          }
        })
      )

      const targetTask = tasks.find((t) => t.id === taskId)
      const newActivity: ActivityLogEntry = {
        id: `act-${Date.now()}`,
        timestamp: 'Just now',
        taskId,
        taskTitle: targetTask?.title || taskId,
        agentId: targetTask?.agentId || 'system',
        agentName: 'Lead Architect (Human)',
        actionType: 'human_approved',
        summary: `Approved Action Plan ${taskId} and dispatched GitHub Pull Request`,
        status: 'success',
      }
      setActivities((prev) => [newActivity, ...prev])
      showToast(`✓ Action Plan ${taskId} approved! GitHub PR dispatched.`)
    },
    [tasks, showToast]
  )

  const rejectTask = useCallback(
    (taskId: string, reason = 'Human reviewer requested revisions') => {
      setTasks((prev) =>
        prev.map((task) => {
          if (task.id !== taskId) return task
          return {
            ...task,
            status: 'failed',
            steps: [
              ...task.steps,
              {
                id: `step-rejected-${Date.now()}`,
                stage: 'deliverable',
                title: 'Human Rejection & Rollback',
                status: 'failed',
                startedAt: 'Just now',
                completedAt: 'Just now',
                logs: [
                  `[Human Gate] Rejected by reviewer. Reason: ${reason}`,
                  `[Rollback] Sandbox state cleared and branch locked.`,
                ],
              },
            ],
          }
        })
      )

      const targetTask = tasks.find((t) => t.id === taskId)
      const newActivity: ActivityLogEntry = {
        id: `act-${Date.now()}`,
        timestamp: 'Just now',
        taskId,
        taskTitle: targetTask?.title || taskId,
        agentId: targetTask?.agentId || 'system',
        agentName: 'Lead Architect (Human)',
        actionType: 'human_rejected',
        summary: `Rejected Action Plan ${taskId}: ${reason}`,
        status: 'warning',
      }
      setActivities((prev) => [newActivity, ...prev])
      showToast(`✕ Action Plan ${taskId} rejected.`)
    },
    [tasks, showToast]
  )

  const advanceTaskStage = useCallback(
    (taskId: string) => {
      setTasks((prev) =>
        prev.map((task) => {
          if (task.id !== taskId) return task

          const stages: StepStage[] = [
            'planning',
            'context_retrieval',
            'tool_execution',
            'validation',
            'deliverable',
          ]
          const currentIndex = stages.indexOf(task.currentStage)
          const nextStage = stages[(currentIndex + 1) % stages.length]

          let nextStatus: TaskStatus
          if (nextStage === 'deliverable') {
            nextStatus = 'waiting_approval'
          } else if (nextStage === 'tool_execution' || nextStage === 'context_retrieval') {
            nextStatus = 'running_tools'
          } else if (nextStage === 'validation') {
            nextStatus = 'analyzing'
          } else {
            nextStatus = 'planning'
          }

          return {
            ...task,
            currentStage: nextStage,
            status: nextStatus,
          }
        })
      )
    },
    []
  )

  const simulateLiveRun = useCallback(
    (taskId: string) => {
      setActiveRunningTaskId(taskId)
      showToast(`▶ Simulating live agent execution for ${taskId}...`)

      // Stage 1: Planning
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, status: 'planning', currentStage: 'planning' }
            : t
        )
      )

      // Stage 2: Ingestion & Tools after 1.5s
      setTimeout(() => {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? { ...t, status: 'running_tools', currentStage: 'tool_execution' }
              : t
          )
        )
      }, 1500)

      // Stage 3: AST Validation after 3s
      setTimeout(() => {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? { ...t, status: 'analyzing', currentStage: 'validation' }
              : t
          )
        )
      }, 3000)

      // Stage 4: Ready for Review after 4.5s
      setTimeout(() => {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  status: 'waiting_approval',
                  currentStage: 'deliverable',
                }
              : t
          )
        )
        setActiveRunningTaskId(null)
        showToast(`✓ Task ${taskId} completed run! Action plan ready for human review.`)
      }, 4500)
    },
    [showToast]
  )

  const toggleKnowledgeSync = useCallback(
    (sourceId: string) => {
      setKnowledgeSources((prev) =>
        prev.map((src) => {
          if (src.id !== sourceId) return src
          const isCurrentlySynced = src.status === 'synced'
          return {
            ...src,
            status: isCurrentlySynced ? 'syncing' : 'synced',
            lastSynced: isCurrentlySynced ? 'Syncing now...' : 'Just now',
          }
        })
      )
      showToast(`Initiated sync for knowledge source`)
    },
    [showToast]
  )

  const testIntegration = useCallback(
    async (integrationId: string) => {
      setIntegrations((prev) =>
        prev.map((item) =>
          item.id === integrationId ? { ...item, status: 'connecting' } : item
        )
      )

      await new Promise((r) => setTimeout(r, 1200))

      setIntegrations((prev) =>
        prev.map((item) =>
          item.id === integrationId
            ? { ...item, status: 'connected', latencyMs: Math.floor(10 + Math.random() * 30) }
            : item
        )
      )
      showToast(`✓ Integration ping healthy`)
      return true
    },
    [showToast]
  )

  const value = useMemo(
    () => ({
      tasks,
      agents,
      knowledgeSources,
      integrations,
      activities,
      toastMessage,
      activeRunningTaskId,
      createTask,
      getTaskById,
      approveTask,
      rejectTask,
      advanceTaskStage,
      simulateLiveRun,
      toggleKnowledgeSync,
      testIntegration,
      showToast,
      clearToast,
    }),
    [
      tasks,
      agents,
      knowledgeSources,
      integrations,
      activities,
      toastMessage,
      activeRunningTaskId,
      createTask,
      getTaskById,
      approveTask,
      rejectTask,
      advanceTaskStage,
      simulateLiveRun,
      toggleKnowledgeSync,
      testIntegration,
      showToast,
      clearToast,
    ]
  )

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}
