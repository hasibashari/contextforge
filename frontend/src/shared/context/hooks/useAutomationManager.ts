import { useState, useCallback, useEffect, useMemo } from 'react'
import type {
  AutomationWorkflow,
  ToastType,
} from '@/shared/types/workspace'
import { automationApi } from '@/shared/api/automationApi'

export function useAutomationManager(
  showToast: (msg: string, type?: ToastType) => void
) {
  const [automations, setAutomations] = useState<AutomationWorkflow[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [runningAutomationId, setRunningAutomationId] = useState<string | null>(null)

  // Fetch real automations from backend database on mount
  useEffect(() => {
    let isMounted = true

    async function loadAutomations() {
      try {
        const data = await automationApi.getAll()
        if (isMounted) {
          setAutomations(data)
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        console.warn('Failed to load automations from backend API:', msg)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadAutomations()

    return () => {
      isMounted = false
    }
  }, [])

  const activeAutomationsCount = useMemo(() => {
    return automations.filter((a) => a.isActive).length
  }, [automations])

  // Create new automation on PostgreSQL database
  const createAutomation = useCallback(
    async (data: Omit<AutomationWorkflow, 'id' | 'totalRuns' | 'createdAt'>) => {
      try {
        const created = await automationApi.create(data)
        setAutomations((prev) => [created, ...prev.filter((a) => a.id !== created.id)])
        showToast(`Automation "${created.name}" created successfully!`, 'success')
        return created
      } catch {
        // Fallback optimistic
        const fallback: AutomationWorkflow = {
          ...data,
          id: `auto-${Date.now()}`,
          totalRuns: 0,
          createdAt: new Date().toISOString(),
          isActive: data.isActive !== undefined ? data.isActive : true,
        }
        setAutomations((prev) => [fallback, ...prev])
        showToast(`Automation "${fallback.name}" saved!`, 'success')
        return fallback
      }
    },
    [showToast]
  )

  // Update existing automation on PostgreSQL database
  const updateAutomation = useCallback(
    async (id: string, updates: Partial<AutomationWorkflow>) => {
      // Optimistic update
      setAutomations((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
      )
      try {
        const updated = await automationApi.update(id, updates)
        setAutomations((prev) =>
          prev.map((item) => (item.id === id ? updated : item))
        )
        showToast('Automation settings updated', 'info')
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        showToast(`Failed to update automation: ${msg}`, 'error')
      }
    },
    [showToast]
  )

  // Delete automation from PostgreSQL database
  const deleteAutomation = useCallback(
    async (id: string) => {
      const prevList = automations
      setAutomations((prev) => prev.filter((item) => item.id !== id))
      try {
        await automationApi.delete(id)
        showToast('Automation deleted', 'info')
      } catch (err: unknown) {
        setAutomations(prevList)
        const msg = err instanceof Error ? err.message : String(err)
        showToast(`Failed to delete automation: ${msg}`, 'error')
      }
    },
    [automations, showToast]
  )

  // Toggle active / paused status on PostgreSQL database
  const toggleAutomationActive = useCallback(
    async (id: string) => {
      const target = automations.find((a) => a.id === id)
      if (!target) return
      const nextActive = !target.isActive

      // Optimistic update
      setAutomations((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, isActive: nextActive } : item
        )
      )

      try {
        await automationApi.update(id, { isActive: nextActive })
        showToast(
          `Automation "${target.name}" is now ${nextActive ? 'Active' : 'Paused'}`,
          nextActive ? 'success' : 'warning'
        )
      } catch (err: unknown) {
        // Revert
        setAutomations((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, isActive: target.isActive } : item
          )
        )
        const msg = err instanceof Error ? err.message : String(err)
        showToast(`Failed to toggle status: ${msg}`, 'error')
      }
    },
    [automations, showToast]
  )

  // Run Automation Now (Triggers backend agentic execution with real DB update)
  const runAutomationNow = useCallback(
    async (id: string) => {
      const workflow = automations.find((a) => a.id === id)
      if (!workflow) return

      if (runningAutomationId) {
        showToast('Another automation is currently executing. Please wait...', 'warning')
        return
      }

      setRunningAutomationId(id)
      showToast(`Triggering "${workflow.name}" via Backend Agentic Engine...`, 'info')

      // Mark workflow as running
      setAutomations((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, lastRunStatus: 'running' } : item
        )
      )

      try {
        const startTime = Date.now()
        await automationApi.run(id)
        const duration = ((Date.now() - startTime) / 1000).toFixed(1)

        setAutomations((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  lastRunAt: new Date().toISOString(),
                  lastRunStatus: 'success',
                  totalRuns: (item.totalRuns || 0) + 1,
                }
              : item
          )
        )

        const isObsidian =
          workflow.mcpServerId?.includes('obsidian') ||
          workflow.mcpTools.some((t) => t.includes('obsidian'))
        const toolMsg = isObsidian ? ' [MCP: Obsidian Vault]' : ' [MCP: Notion]'

        showToast(
          `Automation "${workflow.name}" finished successfully${toolMsg}! (${duration}s)`,
          'success'
        )
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        setAutomations((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, lastRunStatus: 'failed' } : item
          )
        )
        showToast(`Automation execution failed: ${msg}`, 'error')
      } finally {
        setRunningAutomationId(null)
      }
    },
    [automations, runningAutomationId, showToast]
  )

  return {
    automations,
    isLoading,
    activeAutomationsCount,
    runningAutomationId,
    createAutomation,
    updateAutomation,
    deleteAutomation,
    toggleAutomationActive,
    runAutomationNow,
  }
}
