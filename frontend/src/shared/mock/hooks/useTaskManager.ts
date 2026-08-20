import { useState, useCallback } from 'react'
import type { Task, Agent, ToastType } from '@/shared/types/workspace'

export function useTaskManager(agents: Agent[], showToast: (msg: string, type?: ToastType) => void) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [activeRunningTaskId, setActiveRunningTaskId] = useState<string | null>(null)

  const getTaskById = useCallback(
    (id: string) => tasks.find((t) => t.id === id),
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
        agentId: assignedAgent ? assignedAgent.id : 'agent-sec-docs',
        status: 'planning',
        currentStage: 'planning',
        createdAt: 'Just now',
        knowledgeSources: selectedSources.length > 0 ? selectedSources : [],
        toolsUsed: assignedAgent ? assignedAgent.assignedTools : [],
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
            title: 'Task Formulation',
            status: 'in_progress',
            startedAt: 'Just now',
            logs: [`[Agent:${assignedAgent?.name || 'Orchestrator'}] Dispatched workflow for: "${objective}"`],
          },
        ],
      }

      setTasks((prev) => [newTask, ...prev])
      showToast(`Dispatched Task ${newId}`, 'success')
      return newTask
    },
    [agents, showToast]
  )

  const approveTask = useCallback(
    (taskId: string) => {
      setTasks((prev) =>
        prev.map((task) => {
          if (task.id !== taskId) return task
          return {
            ...task,
            status: 'completed',
            completedAt: 'Just now',
          }
        })
      )
      showToast(`Task ${taskId} approved and merged`, 'success')
    },
    [showToast]
  )

  const rejectTask = useCallback(
    (taskId: string, reason = 'Rollback requested') => {
      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? { ...task, status: 'failed' } : task))
      )
      showToast(`Task ${taskId} rejected: ${reason}`, 'error')
    },
    [showToast]
  )

  const advanceTaskStage = useCallback(
    (taskId: string) => {
      showToast(`Advanced task ${taskId}`, 'info')
    },
    [showToast]
  )

  const simulateLiveRun = useCallback(
    (taskId: string) => {
      setActiveRunningTaskId(taskId)
      showToast(`Agent executing sub-steps for ${taskId}...`, 'info')

      setTimeout(() => {
        setTasks((prev) =>
          prev.map((task) => {
            if (task.id !== taskId) return task
            return {
              ...task,
              status: 'running_tools',
              currentStage: 'tool_execution',
            }
          })
        )
      }, 1200)

      setTimeout(() => {
        setTasks((prev) =>
          prev.map((task) => {
            if (task.id !== taskId) return task
            return {
              ...task,
              status: 'completed',
              currentStage: 'deliverable',
              completedAt: 'Just now',
            }
          })
        )
        setActiveRunningTaskId(null)
        showToast(`Task ${taskId} completed!`, 'success')
      }, 3500)
    },
    [showToast]
  )

  return {
    tasks,
    activeRunningTaskId,
    getTaskById,
    createTask,
    approveTask,
    rejectTask,
    advanceTaskStage,
    simulateLiveRun,
  }
}
