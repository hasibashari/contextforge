import React, { useState, useMemo } from 'react'
import {
  Modal,
  ModalHeader,
  ModalFooter,
  Button,
  FormField,
  Input,
  Textarea,
  Select,
} from '@/shared'
import type {
  AutomationWorkflow,
  AutomationTriggerType,
  Agent,
  Integration,
} from '@/shared/types/workspace'
import { Clock, Zap, Play, Cpu, ShieldCheck, Sparkles, ChevronDown, Settings2 } from 'lucide-react'

interface AutomationModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: Omit<AutomationWorkflow, 'id' | 'totalRuns' | 'createdAt'>) => void
  initialWorkflow?: AutomationWorkflow | null
  agents: Agent[]
  integrations: Integration[]
}

const SCHEDULE_PRESETS = [
  { id: 'daily-08', label: '🌅 Every day at 08:00 AM (WIB)', cron: '0 8 * * *', displayLabel: 'Every day at 08:00 AM (WIB)' },
  { id: 'weekday-09', label: '💼 Every weekday (Mon - Fri) at 09:00 AM (WIB)', cron: '0 9 * * 1-5', displayLabel: 'Every weekday (Mon - Fri) at 09:00 AM (WIB)' },
  { id: 'every-6h', label: '🔄 Every 6 hours', cron: '0 */6 * * *', displayLabel: 'Every 6 hours' },
  { id: 'every-1h', label: '⏱️ Every hour', cron: '0 * * * *', displayLabel: 'Every hour' },
  { id: 'friday-17', label: '📅 Every Friday at 05:00 PM (WIB)', cron: '0 17 * * 5', displayLabel: 'Every Friday at 05:00 PM (WIB)' },
  { id: 'custom-time', label: '⚙️ Set Custom Time (Daily / Weekly)...', cron: 'custom-time', displayLabel: '' },
  { id: 'custom-cron', label: '🛠️ Direct Cron Expression (Advanced)...', cron: 'custom-cron', displayLabel: '' },
]

const DAYS_OF_WEEK = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 0, label: 'Sunday' },
]

function translateCronToText(cron: string): string {
  const parts = cron.trim().split(/\s+/)
  if (parts.length < 5) return 'Invalid cron (requires 5 fields: min hr dom mon dow)'
  const [min, hr, dom, month, dow] = parts

  if (cron === '0 8 * * *') return 'Every day at 08:00 AM (WIB)'
  if (cron === '0 9 * * 1-5') return 'Every weekday (Mon - Fri) at 09:00 AM (WIB)'
  if (cron === '0 */6 * * *') return 'Every 6 hours'
  if (cron === '0 * * * *') return 'Every hour'
  if (cron.startsWith('*/')) return `Every ${cron.slice(2).split(' ')[0]} minutes`

  const formattedTime = `${hr.padStart(2, '0')}:${min.padStart(2, '0')} WIB`
  if (dow === '1-5' && dom === '*' && month === '*') {
    return `Every weekday (Mon - Fri) at ${formattedTime}`
  }
  if (dow === '*' && dom === '*' && month === '*') {
    return `Every day at ${formattedTime}`
  }
  if (/^[0-6]$/.test(dow) && dom === '*' && month === '*') {
    const dayName = DAYS_OF_WEEK.find((d) => d.value === parseInt(dow, 10))?.label || `Day ${dow}`
    return `Every ${dayName} at ${formattedTime}`
  }

  return `Custom Schedule (${cron})`
}

function AutomationFormContent({
  initialWorkflow,
  agents,
  integrations,
  onSave,
  onClose,
}: {
  initialWorkflow?: AutomationWorkflow | null
  agents: Agent[]
  integrations: Integration[]
  onSave: (data: Omit<AutomationWorkflow, 'id' | 'totalRuns' | 'createdAt'>) => void
  onClose: () => void
}) {
  const [name, setName] = useState(initialWorkflow?.name || '')
  const [description, setDescription] = useState(initialWorkflow?.description || '')
  const [triggerType, setTriggerType] = useState<AutomationTriggerType>(
    initialWorkflow?.triggerType || 'schedule'
  )

  // Determine initial schedule mode
  const initialCron = initialWorkflow?.scheduleCron || '0 8 * * *'
  const matchingPreset = SCHEDULE_PRESETS.find((p) => p.cron === initialCron)

  const [scheduleMode, setScheduleMode] = useState<string>(
    matchingPreset ? matchingPreset.cron : 'custom-cron'
  )

  // Custom Time state
  const [customFreq, setCustomFreq] = useState<'daily' | 'weekdays' | 'weekly'>('daily')
  const [customDay, setCustomDay] = useState<number>(1) // Monday
  const [customHour, setCustomHour] = useState<string>('08')
  const [customMinute, setCustomMinute] = useState<string>('00')

  // Direct Cron state
  const [directCron, setDirectCron] = useState<string>(initialCron)

  const [agentId, setAgentId] = useState(
    initialWorkflow?.agentId || agents[0]?.id || 'agent-personal-assistant'
  )
  const [mcpServerId, setMcpServerId] = useState(
    initialWorkflow?.mcpServerId || 'int-obsidian-vault-mcp'
  )
  const [selectedTools, setSelectedTools] = useState<string[]>(
    initialWorkflow?.mcpTools || [
      'obsidian_create_daily_note',
      'obsidian_write_note',
      'obsidian_read_note',
    ]
  )
  const [promptTemplate, setPromptTemplate] = useState(
    initialWorkflow?.promptTemplate ||
      "Fetch today's urgent priorities and construct a structured daily note in Obsidian at DailyNotes/{{today}}.md with YAML frontmatter, today's focus, and bi-directional links [[Daily Review]]."
  )
  const masterHitlEnabled = typeof window !== 'undefined'
    ? localStorage.getItem('cf_strict_hitl') !== 'false'
    : true

  const [guardrailStrictHITL, setGuardrailStrictHITL] = useState(
    initialWorkflow
      ? Boolean(initialWorkflow.guardrailStrictHITL)
      : masterHitlEnabled
  )
  const [isActive] = useState(
    initialWorkflow ? initialWorkflow.isActive : true
  )
  const [isToolsExpanded, setIsToolsExpanded] = useState(false)

  // Computed Custom Schedule
  const computedCustomSchedule = useMemo(() => {
    const minNum = parseInt(customMinute, 10) || 0
    const hrNum = parseInt(customHour, 10) || 0
    const timeStr = `${customHour.padStart(2, '0')}:${customMinute.padStart(2, '0')} (WIB)`

    if (customFreq === 'daily') {
      return {
        cron: `${minNum} ${hrNum} * * *`,
        label: `Every day at ${timeStr}`,
      }
    }
    if (customFreq === 'weekdays') {
      return {
        cron: `${minNum} ${hrNum} * * 1-5`,
        label: `Every weekday (Mon - Fri) at ${timeStr}`,
      }
    }
    const dayLabel = DAYS_OF_WEEK.find((d) => d.value === customDay)?.label || 'Sunday'
    return {
      cron: `${minNum} ${hrNum} * * ${customDay}`,
      label: `Every ${dayLabel} at ${timeStr}`,
    }
  }, [customFreq, customDay, customHour, customMinute])

  // Computed final schedule for display & submit
  const finalSchedule = useMemo(() => {
    if (triggerType !== 'schedule') {
      return {
        cron: undefined,
        label: triggerType === 'event' ? 'Event Watcher (File edits & Webhooks)' : 'Manual Trigger On-Demand',
      }
    }

    if (scheduleMode === 'custom-time') {
      return {
        cron: computedCustomSchedule.cron,
        label: computedCustomSchedule.label,
      }
    }

    if (scheduleMode === 'custom-cron') {
      const trimmed = directCron.trim() || '0 8 * * *'
      return {
        cron: trimmed,
        label: translateCronToText(trimmed),
      }
    }

    const preset = SCHEDULE_PRESETS.find((p) => p.cron === scheduleMode)
    return {
      cron: preset?.cron || '0 8 * * *',
      label: preset?.displayLabel || 'Every day at 08:00 AM (WIB)',
    }
  }, [triggerType, scheduleMode, computedCustomSchedule, directCron])

  const handleToggleTool = (toolName: string) => {
    setSelectedTools((prev) =>
      prev.includes(toolName)
        ? prev.filter((t) => t !== toolName)
        : [...prev, toolName]
    )
  }

  const handleMcpServerChange = (newServerId: string) => {
    setMcpServerId(newServerId)
    const targetIntg = integrations.find((i) => i.id === newServerId)
    if (targetIntg && targetIntg.tools && targetIntg.tools.length > 0) {
      setSelectedTools(targetIntg.tools.map((t) => t.name))
    } else if (newServerId === 'int-notion-mcp') {
      setSelectedTools(['notion_get_tasks', 'notion_read_page', 'notion_search'])
    } else if (newServerId === 'int-obsidian-vault-mcp') {
      setSelectedTools([
        'obsidian_create_daily_note',
        'obsidian_write_note',
        'obsidian_read_note',
      ])
    } else if (newServerId === 'int-google-calendar-mcp') {
      setSelectedTools([
        'google_calendar_list_events',
        'google_calendar_create_event',
        'google_calendar_check_availability',
      ])
    } else if (newServerId === 'int-android-bridge-mcp') {
      setSelectedTools([
        'android_get_usage_summary',
        'android_get_foreground_app',
        'android_set_app_limit',
        'android_set_dnd',
        'android_send_notification',
      ])
    } else {
      setSelectedTools([])
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    const selectedAgent = agents.find((a) => a.id === agentId)

    onSave({
      name: name.trim(),
      description: description.trim(),
      triggerType,
      scheduleCron: finalSchedule.cron,
      scheduleLabel: finalSchedule.label,
      agentId: agentId || agents[0]?.id || 'agent-personal-assistant',
      agentName: selectedAgent?.name || 'ContextForge Agent',
      mcpServerId: mcpServerId || undefined,
      mcpTools: selectedTools,
      promptTemplate: promptTemplate.trim(),
      guardrailStrictHITL,
      isActive,
    })
    onClose()
  }

  const selectedIntegration = integrations.find((i) => i.id === mcpServerId)
  const availableMcpTools = selectedIntegration?.tools || [
    { id: 'obsidian_create_daily_note', name: 'obsidian_create_daily_note', description: 'Create daily note in Obsidian' },
    { id: 'obsidian_write_note', name: 'obsidian_write_note', description: 'Write or append markdown note' },
    { id: 'obsidian_read_note', name: 'obsidian_read_note', description: 'Read vault notes & backlinks' },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <ModalHeader
        title={initialWorkflow ? 'Edit Automation Workflow' : 'Create Agentic Automation'}
        subtitle="Configure autonomous background tasks, scheduled triggers, and MCP tool execution rules."
        onClose={onClose}
      />

      <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1 py-1">
        {/* Workflow Name & Description */}
        <FormField label="Automation Name" required>
          <Input
            placeholder="e.g. Daily Morning Obsidian Briefing & Journaling"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </FormField>

        <FormField label="Description">
          <Input
            placeholder="Explain what this automated agent workflow does..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </FormField>

        {/* Trigger Type Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-ink">Trigger Type</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setTriggerType('schedule')}
              className={`p-3 rounded-lg border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                triggerType === 'schedule'
                  ? 'border-primary bg-primary/10 text-ink ring-1 ring-primary/30'
                  : 'border-hairline bg-surface-card text-muted hover:text-ink'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-ink">
                <Clock size={14} className="text-primary" />
                <span>Schedule / Cron</span>
              </div>
              <span className="text-[11px] text-muted">Periodic time triggers</span>
            </button>

            <button
              type="button"
              onClick={() => setTriggerType('event')}
              className={`p-3 rounded-lg border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                triggerType === 'event'
                  ? 'border-amber-500 bg-amber-500/10 text-ink ring-1 ring-amber-500/30'
                  : 'border-hairline bg-surface-card text-muted hover:text-ink'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-ink">
                <Zap size={14} className="text-amber-500" />
                <span>Event Watcher</span>
              </div>
              <span className="text-[11px] text-muted">File edits, PRs, or webhooks</span>
            </button>

            <button
              type="button"
              onClick={() => setTriggerType('manual')}
              className={`p-3 rounded-lg border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                triggerType === 'manual'
                  ? 'border-primary bg-primary/10 text-ink ring-1 ring-primary/30'
                  : 'border-hairline bg-surface-card text-muted hover:text-ink'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-ink">
                <Play size={14} className="text-muted" />
                <span>Manual Only</span>
              </div>
              <span className="text-[11px] text-muted">On-demand button trigger</span>
            </button>
          </div>
        </div>

        {/* Unified Schedule Frequency & Time Picker (Non-redundant) */}
        {triggerType === 'schedule' && (
          <div className="p-3.5 rounded-lg bg-surface-strong/40 border border-hairline space-y-3">
            <FormField label="Execution Schedule">
              <Select
                value={scheduleMode}
                onChange={(e) => setScheduleMode(e.target.value)}
              >
                {SCHEDULE_PRESETS.map((p) => (
                  <option key={p.cron} value={p.cron}>
                    {p.label}
                  </option>
                ))}
              </Select>
            </FormField>

            {/* Custom Time Selector (Inline & Simple) */}
            {scheduleMode === 'custom-time' && (
              <div className="p-3 rounded-lg bg-surface-card border border-hairline/80 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField label="Repeat Frequency">
                    <Select
                      value={customFreq}
                      onChange={(e) => setCustomFreq(e.target.value as 'daily' | 'weekdays' | 'weekly')}
                    >
                      <option value="daily">Every Day</option>
                      <option value="weekdays">Every Weekday (Mon - Fri)</option>
                      <option value="weekly">Weekly on Specific Day</option>
                    </Select>
                  </FormField>

                  {customFreq === 'weekly' ? (
                    <FormField label="Day of Week">
                      <Select
                        value={customDay}
                        onChange={(e) => setCustomDay(parseInt(e.target.value, 10))}
                      >
                        {DAYS_OF_WEEK.map((d) => (
                          <option key={d.value} value={d.value}>
                            {d.label}
                          </option>
                        ))}
                      </Select>
                    </FormField>
                  ) : null}

                  <FormField label="Execution Time (Hour : Minute)">
                    <div className="flex items-center gap-2">
                      <Select
                        value={customHour}
                        onChange={(e) => setCustomHour(e.target.value)}
                        className="w-24 font-mono"
                      >
                        {Array.from({ length: 24 }, (_, i) => {
                          const h = i.toString().padStart(2, '0')
                          return (
                            <option key={h} value={h}>
                              {h}:00
                            </option>
                          )
                        })}
                      </Select>
                      <span className="text-muted font-bold">:</span>
                      <Select
                        value={customMinute}
                        onChange={(e) => setCustomMinute(e.target.value)}
                        className="w-20 font-mono"
                      >
                        <option value="00">00</option>
                        <option value="15">15</option>
                        <option value="30">30</option>
                        <option value="45">45</option>
                      </Select>
                      <span className="text-xs font-mono text-muted">WIB</span>
                    </div>
                  </FormField>
                </div>
              </div>
            )}

            {/* Direct Cron Expression (For Power Users) */}
            {scheduleMode === 'custom-cron' && (
              <div className="p-3 rounded-lg bg-surface-card border border-hairline/80 space-y-2">
                <FormField
                  label="Cron Expression (5-field standard)"
                  hint="Format: minute hour day-of-month month day-of-week"
                >
                  <Input
                    value={directCron}
                    onChange={(e) => setDirectCron(e.target.value)}
                    placeholder="0 8 * * *"
                    className="font-mono text-xs"
                  />
                </FormField>
              </div>
            )}

            {/* Live Auto-Translation Badge (Feedback Chip) */}
            <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-md bg-primary/5 border border-primary/20 text-xs">
              <div className="flex items-center gap-1.5 text-primary font-medium">
                <Sparkles size={13} className="shrink-0" />
                <span className="truncate">{finalSchedule.label}</span>
              </div>
              {finalSchedule.cron && (
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-surface-card text-muted border border-hairline shrink-0">
                  {finalSchedule.cron}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Agent Assignment */}
        <FormField label="Assigned Agent">
          <Select
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
          >
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name} ({agent.role})
              </option>
            ))}
          </Select>
        </FormField>

        {/* MCP Connector & Tools Assignment */}
        <div className="space-y-2">
          <FormField label="Target MCP Protocol Server">
            <Select
              value={mcpServerId}
              onChange={(e) => handleMcpServerChange(e.target.value)}
            >
              <option value="int-obsidian-vault-mcp">
                📚 Obsidian Vault MCP Bridge (Local Vaults & Daily Notes)
              </option>
              <option value="int-notion-mcp">
                📑 Notion Workspace MCP Server
              </option>
              <option value="int-google-calendar-mcp">
                📅 Google Calendar MCP Server (Events & Availability)
              </option>
              <option value="int-android-bridge-mcp">
                📱 Android Bridge & Digital Wellbeing MCP (Screen Time & Focus)
              </option>
              <option value="">⚙️ Internal Sandboxed Agent Tools</option>
            </Select>
          </FormField>

          {/* MCP Tool Chips & Optional Customization Accordion */}
          <div className="p-3 rounded-lg bg-surface-strong/40 border border-hairline space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                <Cpu size={13} className="text-primary" />
                <span>Authorized MCP Tools</span>
                <span className="text-[11px] font-normal text-muted">
                  ({selectedTools.length} active)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsToolsExpanded((prev) => !prev)}
                className="text-[11px] text-primary hover:text-primary-active font-medium flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Settings2 size={12} />
                <span>{isToolsExpanded ? 'Hide Permissions' : 'Customize Tools'}</span>
                <ChevronDown
                  size={12}
                  className={`transition-transform duration-200 ${isToolsExpanded ? 'rotate-180' : ''}`}
                />
              </button>
            </div>

            {/* Compact Chips Preview */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {selectedTools.map((toolName) => (
                <span
                  key={toolName}
                  className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-surface-card text-ink border border-hairline flex items-center gap-1"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-semantic-success" />
                  <span>{toolName}</span>
                </span>
              ))}
            </div>

            {/* Collapsible Accordion for Fine-Grained Customization */}
            {isToolsExpanded && (
              <div className="pt-2 mt-2 border-t border-hairline space-y-2">
                <p className="text-[11px] text-muted">
                  Toggle specific tool permissions authorized for this workflow execution:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {availableMcpTools.map((tool) => {
                    const isSelected = selectedTools.includes(tool.name)
                    return (
                      <button
                        key={tool.name}
                        type="button"
                        onClick={() => handleToggleTool(tool.name)}
                        className={`flex items-center gap-2 p-2 rounded-md border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-primary/40 bg-primary/10 text-ink'
                            : 'border-hairline bg-surface-card text-muted hover:text-ink'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          readOnly
                          className="rounded border-hairline text-primary focus:ring-0"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-mono font-medium truncate">
                            {tool.name}
                          </div>
                          <div className="text-[10px] text-muted truncate">
                            {tool.description}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Prompt Instructions Template */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-ink font-sans">
              Workflow Prompt Template <span className="text-semantic-error">*</span>
            </label>
            <div className="flex items-center gap-1 text-[10px] font-mono text-muted">
              <span>Insert:</span>
              {['{{today}}', '{{now}}', '{{workspace}}'].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setPromptTemplate((prev) => prev + ' ' + v)}
                  className="px-1.5 py-0.5 rounded bg-canvas-soft border border-hairline hover:border-primary/40 text-primary cursor-pointer transition-colors"
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <Textarea
            rows={4}
            value={promptTemplate}
            onChange={(e) => setPromptTemplate(e.target.value)}
            placeholder="e.g. Read today's schedule and format an atomic markdown daily note with frontmatter and backlinks..."
            required
            className="text-xs font-mono"
          />
          <p className="text-[11px] text-muted font-sans">
            Instructions sent to the agent when triggered. Variables like &#123;&#123;today&#125;&#125; and &#123;&#123;workspace&#125;&#125; are auto-resolved at runtime.
          </p>
        </div>

        {/* Guardrails / Safety Policy */}
        <div className="pt-3 border-t border-hairline space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-semantic-success" />
              <span>Safety & Human-in-the-Loop (HITL) Gate</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-canvas-soft text-muted border border-hairline flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${masterHitlEnabled ? 'bg-semantic-success' : 'bg-muted'}`} />
              <span>Master Policy: {masterHitlEnabled ? 'Enforced' : 'Relaxed'}</span>
            </span>
          </div>

          <label className="flex items-start gap-2.5 p-3 rounded-xl bg-canvas-soft border border-hairline hover:border-hairline-strong transition-colors cursor-pointer select-none">
            <input
              type="checkbox"
              checked={guardrailStrictHITL}
              onChange={(e) => setGuardrailStrictHITL(e.target.checked)}
              className="mt-0.5 rounded border-hairline text-primary focus:ring-0 cursor-pointer"
            />
            <div>
              <div className="text-xs font-medium text-ink">
                Require Manual Sign-Off before MCP Writes & File Mutations
              </div>
              <p className="text-[11px] text-muted leading-relaxed mt-0.5">
                {guardrailStrictHITL
                  ? 'Active: Workflow runs will pause and prompt for confirmation before modifying any external files or databases.'
                  : 'Automated: Workflow runs can autonomously execute authorized tool mutations in background without interrupting you.'}
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Action Buttons */}
      <ModalFooter className="justify-end pt-3">
        <div className="flex items-center justify-end gap-2 w-full">
          <Button variant="ghost" size="sm" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit">
            {initialWorkflow ? 'Save Changes' : 'Create Automation'}
          </Button>
        </div>
      </ModalFooter>
    </form>
  )
}

export function AutomationModal({
  isOpen,
  onClose,
  onSave,
  initialWorkflow,
  agents,
  integrations,
}: AutomationModalProps) {
  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="3xl"
    >
      <AutomationFormContent
        key={initialWorkflow?.id || 'new'}
        initialWorkflow={initialWorkflow}
        agents={agents}
        integrations={integrations}
        onSave={onSave}
        onClose={onClose}
      />
    </Modal>
  )
}
