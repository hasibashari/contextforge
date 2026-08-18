import { useState, useCallback } from 'react'
import type { Agent, Skill, Plugin, Integration, ActivityLogEntry, ToastType } from '@/shared/types/workspace'
import {
  INITIAL_AGENTS,
  INITIAL_SKILLS,
  INITIAL_PLUGINS,
  INITIAL_INTEGRATIONS,
} from '../mockData'

export function useEcosystemManager(
  showToast: (msg: string, type?: ToastType) => void,
  setActivities: React.Dispatch<React.SetStateAction<ActivityLogEntry[]>>
) {
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS)
  const [skills, setSkills] = useState<Skill[]>(INITIAL_SKILLS)
  const [plugins, setPlugins] = useState<Plugin[]>(INITIAL_PLUGINS)
  const [integrations, setIntegrations] = useState<Integration[]>(INITIAL_INTEGRATIONS)

  const toggleSkill = useCallback(
    (skillId: string) => {
      setSkills((prev) =>
        prev.map((skill) => {
          if (skill.id !== skillId) return skill
          const nextState = !skill.enabled
          showToast(nextState ? `Skill "${skill.name}" enabled` : `Skill "${skill.name}" disabled`, nextState ? 'success' : 'warning')
          return { ...skill, enabled: nextState }
        })
      )
    },
    [showToast]
  )

  const installPlugin = useCallback(
    (pluginId: string) => {
      const plugin = plugins.find((p) => p.id === pluginId)
      if (!plugin) return

      setPlugins((prev) =>
        prev.map((p) => (p.id === pluginId ? { ...p, installed: true } : p))
      )

      // Auto-enable bundled skills
      setSkills((prev) =>
        prev.map((s) =>
          plugin.bundledSkillIds.includes(s.id) ? { ...s, enabled: true } : s
        )
      )

      // Log activity
      const logEntry: ActivityLogEntry = {
        id: `act-plugin-${Date.now()}`,
        timestamp: 'Just now',
        agentId: 'system',
        agentName: 'Ecosystem Manager',
        actionType: 'tool_invoked',
        summary: `Installed and activated plugin pack: "${plugin.name}"`,
        status: 'success',
      }
      setActivities((prev) => [logEntry, ...prev])
      showToast(`Successfully installed plugin "${plugin.name}"`, 'success')
    },
    [plugins, setActivities, showToast]
  )

  const uninstallPlugin = useCallback(
    (pluginId: string) => {
      const plugin = plugins.find((p) => p.id === pluginId)
      if (!plugin) return

      setPlugins((prev) =>
        prev.map((p) => (p.id === pluginId ? { ...p, installed: false } : p))
      )
      showToast(`Uninstalled plugin "${plugin.name}"`, 'warning')
    },
    [plugins, showToast]
  )

  const toggleIntegrationConnect = useCallback(
    (integrationId: string) => {
      setIntegrations((prev) =>
        prev.map((intg) => {
          if (intg.id !== integrationId) return intg
          const isConnected = intg.status === 'connected'
          const newStatus = isConnected ? 'disconnected' : 'connected'
          showToast(
            isConnected
              ? `Disconnected connector "${intg.name}"`
              : `Connected connector "${intg.name}"`,
            isConnected ? 'warning' : 'success'
          )
          return { ...intg, status: newStatus }
        })
      )
    },
    [showToast]
  )

  const updateConnectorConfig = useCallback(
    (connectorId: string, updates: Partial<Integration>) => {
      setIntegrations((prev) =>
        prev.map((intg) => {
          if (intg.id !== connectorId) return intg
          return { ...intg, ...updates }
        })
      )
      showToast('Connector configuration saved successfully', 'success')
    },
    [showToast]
  )

  const addCustomConnector = useCallback(
    (data: {
      name: string
      category: Integration['category']
      endpoint: string
      description: string
      transport?: 'stdio' | 'sse' | 'rest'
    }) => {
      const newConnector: Integration = {
        id: `int-custom-${Date.now()}`,
        name: data.name,
        category: data.category,
        endpoint: data.endpoint,
        description: data.description,
        status: 'connected',
        version: 'v1.0.0',
        lastPingMs: 18,
        latencyMs: 14,
        transport: data.transport || 'stdio',
        isCustom: true,
        tools: [
          {
            name: `${data.name.toLowerCase().replace(/\s+/g, '_')}_exec`,
            description: `Execute sandboxed action on ${data.name}`,
            parametersSchema: { action: 'string', payload: 'object' },
            readOnly: false,
          },
        ],
      }
      setIntegrations((prev) => [newConnector, ...prev])
      showToast(`Added custom MCP connector: "${data.name}"`, 'success')
    },
    [showToast]
  )

  const addCustomSkill = useCallback(
    (data: {
      name: string
      description: string
      category: Skill['category']
      sopSummary: string
      instructions: string
      assignedTools: string[]
    }) => {
      const newSkill: Skill = {
        id: `skill-custom-${Date.now()}`,
        name: data.name,
        description: data.description,
        category: data.category,
        icon: 'Sparkles',
        sopSummary: data.sopSummary,
        instructions: data.instructions,
        assignedTools: data.assignedTools,
        enabled: true,
        isCustom: true,
      }
      setSkills((prev) => [newSkill, ...prev])
      showToast(`Created custom reasoning skill: "${data.name}"`, 'success')
    },
    [showToast]
  )

  const updateAgentCapabilities = useCallback(
    (agentId: string, toolIds: string[], skillIds: string[]) => {
      setAgents((prev) =>
        prev.map((agent) => {
          if (agent.id !== agentId) return agent
          return {
            ...agent,
            assignedTools: toolIds,
            assignedSkills: skillIds,
          }
        })
      )
      showToast(`Updated capabilities for agent`, 'success')
    },
    [showToast]
  )

  const testIntegration = useCallback(
    async (integrationId: string) => {
      const int = integrations.find((i) => i.id === integrationId)
      showToast(`Testing integration connection for ${int?.name || integrationId}...`, 'info')
      await new Promise((res) => setTimeout(res, 600))
      showToast(`Integration connection successful (latency: 12ms)`, 'success')
      return true
    },
    [integrations, showToast]
  )

  return {
    agents,
    setAgents,
    skills,
    setSkills,
    plugins,
    setPlugins,
    integrations,
    setIntegrations,
    toggleSkill,
    installPlugin,
    uninstallPlugin,
    toggleIntegrationConnect,
    updateConnectorConfig,
    addCustomConnector,
    addCustomSkill,
    updateAgentCapabilities,
    testIntegration,
  }
}
