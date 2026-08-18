import { useState, useCallback } from 'react'
import type { Task, Agent } from '@/shared/types/workspace'
import { INITIAL_TASKS } from '../mockData'

export function useTaskManager(agents: Agent[], showToast: (msg: string) => void) {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS)
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
        agentId: assignedAgent.id,
        status: 'planning',
        currentStage: 'planning',
        createdAt: 'Just now',
        knowledgeSources: selectedSources.length > 0 ? selectedSources : ['source-obsidian-vault'],
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
            title: 'Task Formulation',
            status: 'in_progress',
            startedAt: 'Just now',
            logs: [`[Agent:${assignedAgent.name}] Dispatched workflow for: "${objective}"`],
          },
        ],
      }

      setTasks((prev) => [newTask, ...prev])
      showToast(`⚡ Dispatched Task ${newId}`)
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
      showToast(`✓ Task ${taskId} approved & merged`)
    },
    [showToast]
  )

  const rejectTask = useCallback(
    (taskId: string, reason = 'Rollback requested') => {
      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? { ...task, status: 'failed' } : task))
      )
      showToast(`✕ Task ${taskId} rejected: ${reason}`)
    },
    [showToast]
  )

  const advanceTaskStage = useCallback(
    (taskId: string) => {
      showToast(`Advanced task ${taskId}`)
    },
    [showToast]
  )

  const simulateLiveRun = useCallback(
    (taskId: string) => {
      setActiveRunningTaskId(taskId)
      showToast(`Simulating step for task ${taskId}`)
      setTimeout(() => {
        setActiveRunningTaskId(null)
      }, 1500)
    },
    [showToast]
  )

  return {
    tasks,
    setTasks,
    activeRunningTaskId,
    getTaskById,
    createTask,
    approveTask,
    rejectTask,
    advanceTaskStage,
    simulateLiveRun,
  }
}
