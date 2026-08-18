import React, { useState, useCallback, useMemo } from 'react'
import type {
  Task,
  Agent,
  Skill,
  Plugin,
  KnowledgeSource,
  Integration,
  ActivityLogEntry,
  Artifact,
  ChatSession,
  ChatMessage,
  ActionCardData,
} from '@/shared/types/workspace'
import {
  INITIAL_AGENTS,
  INITIAL_SKILLS,
  INITIAL_PLUGINS,
  INITIAL_TASKS,
  INITIAL_KNOWLEDGE_SOURCES,
  INITIAL_INTEGRATIONS,
  INITIAL_ACTIVITIES,
  INITIAL_ARTIFACTS,
  INITIAL_CHAT_SESSIONS,
} from './mockData'
import { WorkspaceContext } from './context'

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Legacy & Entity State
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS)
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS)
  const [skills, setSkills] = useState<Skill[]>(INITIAL_SKILLS)
  const [plugins, setPlugins] = useState<Plugin[]>(INITIAL_PLUGINS)
  const [knowledgeSources, setKnowledgeSources] = useState<KnowledgeSource[]>(
    INITIAL_KNOWLEDGE_SOURCES
  )
  const [integrations, setIntegrations] = useState<Integration[]>(INITIAL_INTEGRATIONS)
  const [activities, setActivities] = useState<ActivityLogEntry[]>(INITIAL_ACTIVITIES)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [activeRunningTaskId, setActiveRunningTaskId] = useState<string | null>(null)

  // Conversational Agentic State
  const [chatSessions, setChatSessions] = useState<ChatSession[]>(INITIAL_CHAT_SESSIONS)
  const [activeSessionId, setActiveSessionId] = useState<string>(INITIAL_CHAT_SESSIONS[0]?.id || 'session-sprint-planning')
  const [artifacts, setArtifacts] = useState<Artifact[]>(INITIAL_ARTIFACTS)
  const [activeArtifact, setActiveArtifact] = useState<Artifact | null>(INITIAL_ARTIFACTS[0] || null)
  const [isAsideOpen, setIsAsideOpen] = useState<boolean>(true)
  const [isGeneratingResponse, setIsGeneratingResponse] = useState<boolean>(false)
  const [selectedAgentMode, setSelectedAgentMode] = useState<string>('auto')
  const [activeSourceFilters, setActiveSourceFilters] = useState<string[]>([
    'source-obsidian-vault',
    'source-web-search',
    'source-github-core',
  ])

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev))
    }, 3500)
  }, [])

  const clearToast = useCallback(() => {
    setToastMessage(null)
  }, [])

  const toggleAside = useCallback(() => {
    setIsAsideOpen((prev) => !prev)
  }, [])

  const setAsideOpen = useCallback((open: boolean) => {
    setIsAsideOpen(open)
  }, [])

  const toggleSourceFilter = useCallback((sourceId: string) => {
    setActiveSourceFilters((prev) =>
      prev.includes(sourceId) ? prev.filter((id) => id !== sourceId) : [...prev, sourceId]
    )
  }, [])

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

  const switchChatSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId)
    const targetSession = chatSessions.find((s) => s.id === sessionId)
    if (targetSession?.activeArtifactId) {
      const art = artifacts.find((a) => a.id === targetSession.activeArtifactId)
      if (art) setActiveArtifact(art)
    }
  }, [chatSessions, artifacts])

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
      if (actionKey === 'open_aside') {
        setIsAsideOpen(true)
        showToast('📌 Document opened in Aside panel')
      } else if (actionKey === 'copy_content' || actionKey === 'copy_citations') {
        if (activeArtifact) {
          navigator.clipboard?.writeText(activeArtifact.content)
        }
        showToast('📋 Text copied to clipboard')
      } else if (actionKey === 'sync_vault') {
        showToast(`🔄 Re-syncing to Obsidian Vault: ${card.locationPath || 'Vault'}`)
      } else if (actionKey === 'open_calendar') {
        showToast('📅 Opening Google Calendar...')
      } else if (actionKey === 'edit_time') {
        showToast('⚙️ Please type the new time in the chat box')
      } else {
        showToast(`Action "${actionKey}" executed`)
      }
    },
    [activeArtifact, showToast]
  )

  // Autonomous Conversational Engine
  const sendChatMessage = useCallback(
    async (prompt: string, customOptions?: { agentId?: string; sources?: string[] }) => {
      if (!prompt.trim() || isGeneratingResponse) return

      const targetAgentId = customOptions?.agentId || selectedAgentMode
      const activeAgent = targetAgentId !== 'auto' ? agents.find((a) => a.id === targetAgentId) : undefined

      const userMsgId = `msg-user-${Date.now()}`
      const userMessage: ChatMessage = {
        id: userMsgId,
        role: 'user',
        content: prompt.trim(),
        timestamp: 'Just now',
      }

      // Add user message immediately
      setChatSessions((prev) =>
        prev.map((session) => {
          if (session.id === activeSessionId) {
            // Update title if it's currently generic
            const isFirst = session.messages.length <= 1
            const updatedTitle = isFirst ? prompt.slice(0, 36) + (prompt.length > 36 ? '...' : '') : session.title
            return {
              ...session,
              title: updatedTitle,
              messages: [...session.messages, userMessage],
            }
          }
          return session
        })
      )

      setIsGeneratingResponse(true)

      // Simulate natural thinking & agentic intent routing delay (800ms)
      await new Promise((res) => setTimeout(res, 800))

      const lower = prompt.toLowerCase()

      // Intent 1: Obsidian Note Creation / Summarization
      if (
        lower.includes('obsidian') ||
        lower.includes('catatan') ||
        lower.includes('note') ||
        lower.includes('rangkum') ||
        lower.includes('summary') ||
        lower.includes('summarize') ||
        lower.includes('sprint') ||
        lower.includes('simpan') ||
        lower.includes('save') ||
        lower.includes('dokumen') ||
        lower.includes('document') ||
        lower.includes('doc')
      ) {
        const docTitle = prompt.length > 40 ? prompt.slice(0, 40) + '...' : prompt
        const safeSlug = prompt
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .slice(0, 25) || 'note'
        const pathName = `Vault/Work/Notes/${safeSlug}.md`
        const newArtId = `art-${Date.now()}`

        const artifactContent = `# ${docTitle}\n\n> **Generated by ContextForge** · Synced to \`${pathName}\`\n> **Date:** ${new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}\n\n## 📝 Summary & Key Takeaways\n\n1. **Primary Goal:** ${prompt}\n2. **Context:** Integrated with Obsidian Vault knowledge base and architectural guidelines.\n3. **Next Steps:**\n   - [ ] Implement architecture items as drafted.\n   - [ ] Verify module compatibility and dependencies.\n   - [ ] Review with team during standup.\n\n---\n*This document is stored locally and can be edited anytime.*`

        const newArtifact: Artifact = {
          id: newArtId,
          type: 'markdown_doc',
          title: docTitle,
          content: artifactContent,
          locationPath: pathName,
          serviceOrigin: 'obsidian',
          createdAt: 'Just now',
          updatedAt: 'Just now',
          wordCount: artifactContent.split(/\s+/).filter(Boolean).length,
        }

        const actionCard: ActionCardData = {
          id: `card-${Date.now()}`,
          type: 'obsidian_note',
          title: docTitle,
          description: `Structured Markdown document has been formatted and saved to your Obsidian vault.`,
          badgeText: '✓ Saved to Obsidian',
          badgeColor: 'bg-primary/10 text-primary',
          locationPath: pathName,
          metaDetails: {
            'File Location': pathName,
            'Vault': 'Personal Obsidian Vault',
            'Status': 'Synced',
          },
          actions: [
            { label: 'Open in Aside Panel', actionKey: 'open_aside', primary: true },
            { label: 'Copy Markdown', actionKey: 'copy_content' },
            { label: 'Sync to Obsidian', actionKey: 'sync_vault' },
          ],
        }

        const assistantMsg: ChatMessage = {
          id: `msg-asst-${Date.now()}`,
          role: 'assistant',
          content: `Sure! I have processed your request ${activeAgent ? `using ${activeAgent.name}` : ''} and created a structured document.\n\nThe file has been written and saved directly to your Obsidian vault at **\`${pathName}\`**. You can now read and edit the full document in the right panel.`,
          timestamp: 'Just now',
          intent: {
            toolName: 'obsidian_vault_writer',
            service: 'obsidian',
            status: 'completed',
            summaryText: `Saved to Obsidian: ${pathName}`,
          },
          artifactId: newArtId,
          actionCard,
        }

        setArtifacts((prev) => [newArtifact, ...prev])
        setActiveArtifact(newArtifact)
        setIsAsideOpen(true)

        setChatSessions((prev) =>
          prev.map((session) =>
            session.id === activeSessionId
              ? {
                  ...session,
                  activeArtifactId: newArtId,
                  messages: [...session.messages, assistantMsg],
                }
              : session
          )
        )

        const newAct: ActivityLogEntry = {
          id: `act-${Date.now()}`,
          timestamp: 'Just now',
          agentId: activeAgent?.id || 'agent-doc-crawl',
          agentName: activeAgent?.name || 'Knowledge & Obsidian Sync',
          actionType: 'obsidian_note_created',
          summary: `Created note in Obsidian vault: ${pathName}`,
          status: 'success',
        }
        setActivities((prev) => [newAct, ...prev])
        showToast(`✓ Note created in Obsidian: ${pathName}`)
      }
      // Intent 2: Calendar & Reminder
      else if (
        lower.includes('ingat') ||
        lower.includes('remind') ||
        lower.includes('reminder') ||
        lower.includes('jadwal') ||
        lower.includes('schedule') ||
        lower.includes('kalender') ||
        lower.includes('calendar') ||
        lower.includes('besok') ||
        lower.includes('tomorrow') ||
        lower.includes('jam') ||
        lower.includes('am') ||
        lower.includes('pm')
      ) {
        const reminderTitle = prompt.length > 50 ? prompt.slice(0, 50) + '...' : prompt
        const actionCard: ActionCardData = {
          id: `card-${Date.now()}`,
          type: 'calendar_reminder',
          title: reminderTitle,
          description:
            'Reminder has been automatically scheduled in Google Calendar with notification alerts.',
          badgeText: '📅 Reminder Active',
          badgeColor: 'bg-semantic-success/15 text-semantic-success',
          metaDetails: {
            'Time': 'Tomorrow, 09:00 AM',
            'Calendar': 'Primary Google Calendar',
            'Alert': '10 Minutes Before Event',
          },
          actions: [
            { label: 'Open Calendar', actionKey: 'open_calendar', primary: true },
            { label: 'Edit Time', actionKey: 'edit_time' },
          ],
        }

        const assistantMsg: ChatMessage = {
          id: `msg-asst-${Date.now()}`,
          role: 'assistant',
          content: `Done! I have scheduled the reminder: **"${reminderTitle}"** in your Google Calendar.\n\nNotification alerts will be sent automatically as scheduled.`,
          timestamp: 'Just now',
          intent: {
            toolName: 'calendar_create_reminder',
            service: 'calendar',
            status: 'completed',
            summaryText: `Google Calendar: ${reminderTitle} @ Tomorrow 09:00 AM`,
          },
          actionCard,
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
          id: `act-${Date.now()}`,
          timestamp: 'Just now',
          agentId: 'agent-db-platform',
          agentName: 'Database & Productivity Agent',
          actionType: 'reminder_created',
          summary: `Scheduled reminder: "${reminderTitle}"`,
          status: 'success',
        }
        setActivities((prev) => [newAct, ...prev])
        showToast('📅 Calendar reminder scheduled successfully')
      }
      // Intent 3: Web Search & Intelligence
      else if (
        lower.includes('cari') ||
        lower.includes('search') ||
        lower.includes('web') ||
        lower.includes('internet') ||
        lower.includes('berita') ||
        lower.includes('news') ||
        lower.includes('tren') ||
        lower.includes('trend') ||
        lower.includes('update') ||
        lower.includes('ai') ||
        lower.includes('model')
      ) {
        const queryTitle = `Live Web Research: ${prompt.slice(0, 35)}...`
        const newArtId = `art-web-${Date.now()}`

        const webContent = `# ${queryTitle}\n\n> **Live Grounding via Web Search Engine** · ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}\n\n## 🌐 Real-Time Intelligence Overview\n\nBased on recent queries across 3 verified sources:\n\n1. **Primary Insight:** Query "${prompt}" highlights rapid integration between LLM reasoning and local tooling/APIs (MCP).\n2. **Key Advantage:** Direct execution delivers finalized artifacts without manual mediation.\n3. **Verified Source Citations:**\n   - *Official Tech Specs & Developer Reports (2026)*\n   - *Model Context Protocol Registry Articles*\n`

        const newArtifact: Artifact = {
          id: newArtId,
          type: 'search_synthesis',
          title: queryTitle,
          content: webContent,
          serviceOrigin: 'web',
          createdAt: 'Just now',
          wordCount: webContent.split(/\s+/).filter(Boolean).length,
        }

        const actionCard: ActionCardData = {
          id: `card-${Date.now()}`,
          type: 'web_search_summary',
          title: queryTitle,
          description: 'Information from live web has been synthesized with verified citations.',
          badgeText: '🌐 Web Grounded',
          badgeColor: 'bg-[#9fbbe0]/20 text-[#3b6ea5]',
          metaDetails: {
            'Source': 'Tavily Search API & Web Engine',
            'Status': 'Verified (3 domains)',
          },
          actions: [
            { label: 'View Summary in Aside Panel', actionKey: 'open_aside', primary: true },
            { label: 'Copy Citations', actionKey: 'copy_citations' },
          ],
        }

        const assistantMsg: ChatMessage = {
          id: `msg-asst-${Date.now()}`,
          role: 'assistant',
          content: `Based on live web research for **"${prompt}"**:\n\n* Information has been verified from reputable technical sources.\n* A comprehensive summary and citations have been prepared in the right panel for your review.`,
          timestamp: 'Just now',
          intent: {
            toolName: 'web_search',
            service: 'web',
            status: 'completed',
            summaryText: 'Web Search (3 verified sources found)',
          },
          artifactId: newArtId,
          actionCard,
        }

        setArtifacts((prev) => [newArtifact, ...prev])
        setActiveArtifact(newArtifact)
        setIsAsideOpen(true)

        setChatSessions((prev) =>
          prev.map((session) =>
            session.id === activeSessionId
              ? {
                  ...session,
                  activeArtifactId: newArtId,
                  messages: [...session.messages, assistantMsg],
                }
              : session
          )
        )

        const newAct: ActivityLogEntry = {
          id: `act-${Date.now()}`,
          timestamp: 'Just now',
          agentId: 'agent-doc-crawl',
          agentName: 'Knowledge & Obsidian Sync',
          actionType: 'web_searched',
          summary: `Web search executed for: "${prompt.slice(0, 40)}"`,
          status: 'info',
        }
        setActivities((prev) => [newAct, ...prev])
        showToast('🌐 Web research completed')
      }
      // Intent 4: General Assistant Query
      else {
        const assistantMsg: ChatMessage = {
          id: `msg-asst-${Date.now()}`,
          role: 'assistant',
          content: `I understand your instruction: **"${prompt}"**.\n\nThe system has analyzed your goal and connected it with active workspace context (Obsidian Vault & Live Web). Would you like me to draft a document in Obsidian or configure a follow-up task for this?`,
          timestamp: 'Just now',
          intent: {
            toolName: 'context_analyzer',
            service: 'obsidian',
            status: 'completed',
            summaryText: 'Grounded against Active Workspace Context',
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
      }

      setIsGeneratingResponse(false)
    },
    [activeSessionId, isGeneratingResponse, selectedAgentMode, agents, showToast]
  )

  // Legacy Task Methods for compatibility
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

  const toggleKnowledgeSync = useCallback(
    (sourceId: string) => {
      setKnowledgeSources((prev) =>
        prev.map((src) => {
          if (src.id !== sourceId) return src
          const newStatus = src.status === 'synced' ? 'syncing' : 'synced'
          return { ...src, status: newStatus, lastSynced: 'Just now' }
        })
      )
      showToast(`Data source status updated`)
    },
    [showToast]
  )

  const toggleKnowledgeSourceConnect = useCallback(
    (sourceId: string) => {
      setKnowledgeSources((prev) =>
        prev.map((src) => {
          if (src.id !== sourceId) return src
          const isSynced = src.status === 'synced'
          const newStatus = isSynced ? 'error' : 'synced'
          showToast(
            isSynced
              ? `Disconnected knowledge source "${src.name}"`
              : `✓ Connected & grounded source "${src.name}"`
          )
          return { ...src, status: newStatus, lastSynced: isSynced ? src.lastSynced : 'Just now' }
        })
      )
    },
    [showToast]
  )

  const addKnowledgeSource = useCallback(
    (data: { name: string; type: KnowledgeSource['type']; location: string }) => {
      const getIconType = (t: KnowledgeSource['type']): KnowledgeSource['iconType'] => {
        if (t === 'github_repo') return 'terminal'
        if (t === 'obsidian_vault') return 'book-open'
        if (t === 'web_search') return 'globe'
        if (t === 'database_schema') return 'database'
        if (t === 'notion_workspace') return 'layers'
        return 'file'
      }

      const newSource: KnowledgeSource = {
        id: `source-custom-${Date.now()}`,
        name: data.name,
        type: data.type,
        location: data.location,
        description: `Connected ${data.type.replace('_', ' ')} grounding knowledge repository.`,
        meta: '0 files indexed · Just connected',
        filesCount: 1,
        chunksCount: 24,
        lastSynced: 'Just now',
        status: 'synced',
        iconType: getIconType(data.type),
        color: 'text-primary',
      }

      setKnowledgeSources((prev) => [newSource, ...prev])
      showToast(`✓ Knowledge source "${data.name}" connected & indexed!`)
    },
    [showToast]
  )

  const testIntegration = useCallback(
    async (integrationId: string) => {
      const int = integrations.find((i) => i.id === integrationId)
      showToast(`Testing integration connection for ${int?.name || integrationId}...`)
      await new Promise((res) => setTimeout(res, 600))
      showToast(`✓ Integration connection successful (latency: 12ms)`)
      return true
    },
    [integrations, showToast]
  )

  // Ecosystem Actions
  const toggleSkill = useCallback(
    (skillId: string) => {
      setSkills((prev) =>
        prev.map((skill) => {
          if (skill.id !== skillId) return skill
          const nextState = !skill.enabled
          showToast(nextState ? `✓ Skill "${skill.name}" enabled` : `Skill "${skill.name}" disabled`)
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
      showToast(`✓ Successfully installed plugin "${plugin.name}"`)
    },
    [plugins, showToast]
  )

  const uninstallPlugin = useCallback(
    (pluginId: string) => {
      const plugin = plugins.find((p) => p.id === pluginId)
      if (!plugin) return

      setPlugins((prev) =>
        prev.map((p) => (p.id === pluginId ? { ...p, installed: false } : p))
      )
      showToast(`Uninstalled plugin "${plugin.name}"`)
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
              : `✓ Connected connector "${intg.name}"`
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
      showToast('✓ Connector configuration saved successfully')
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
      showToast(`✓ Added custom MCP connector: "${data.name}"`)
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
      showToast(`✓ Created custom reasoning skill: "${data.name}"`)
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
      showToast(`✓ Updated capabilities for agent`)
    },
    [showToast]
  )

  return (
    <WorkspaceContext.Provider
      value={{
        // Legacy/Entity
        tasks,
        agents,
        skills,
        plugins,
        knowledgeSources,
        integrations,
        activities,
        toastMessage,
        activeRunningTaskId,

        // Ecosystem Actions
        toggleSkill,
        installPlugin,
        uninstallPlugin,
        toggleIntegrationConnect,
        updateConnectorConfig,
        addCustomConnector,
        addCustomSkill,
        updateAgentCapabilities,

        // Conversational Agentic State
        chatSessions,
        activeSessionId,
        activeSession,
        activeArtifact,
        artifacts,
        isAsideOpen,
        isGeneratingResponse,
        selectedAgentMode,
        activeSourceFilters,

        // Conversational Actions
        sendChatMessage,
        createNewChatSession,
        switchChatSession,
        setActiveArtifact,
        saveArtifactContent,
        executeCardAction,
        toggleAside,
        setAsideOpen,
        setSelectedAgentMode,
        toggleSourceFilter,

        // Task Actions
        createTask,
        getTaskById,
        approveTask,
        rejectTask,
        advanceTaskStage,
        simulateLiveRun,
        toggleKnowledgeSync,
        toggleKnowledgeSourceConnect,
        addKnowledgeSource,
        testIntegration,
        showToast,
        clearToast,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}
