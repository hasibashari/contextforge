import React, { useState } from 'react'
import {
  Modal,
  ModalHeader,
  ModalFooter,
  Button,
  FormField,
  Input,
  Textarea,
  Select,
} from '@/shared/components'
import type {
  AutomationWorkflow,
  AutomationTriggerType,
  Agent,
  Integration,
} from '@/shared/types/workspace'
import { Clock, Zap, Play, Cpu, ShieldCheck } from 'lucide-react'

interface AutomationModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: Omit<AutomationWorkflow, 'id' | 'totalRuns' | 'createdAt'>) => void
  initialWorkflow?: AutomationWorkflow | null
  agents: Agent[]
  integrations: Integration[]
}

const CRON_PRESETS = [
  { label: 'Every day at 08:00 AM (Daily Obsidian Note)', cron: '0 8 * * *' },
  { label: 'Every 6 hours (Knowledge Backlink Sync)', cron: '0 */6 * * *' },
  { label: 'Every hour (Real-time Watcher)', cron: '0 * * * *' },
  { label: 'Every weekday morning at 09:00 AM (Sprint Briefing)', cron: '0 9 * * 1-5' },
  { label: 'Every Friday at 05:00 PM (Weekly Archive)', cron: '0 17 * * 5' },
  { label: 'Custom Cron Expression', cron: 'custom' },
]

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

  const initialCron = initialWorkflow?.scheduleCron || '0 8 * * *'
  const matchingPreset = CRON_PRESETS.find((p) => p.cron === initialCron)

  const [cronPreset, setCronPreset] = useState(
    matchingPreset ? matchingPreset.cron : 'custom'
  )
  const [customCron, setCustomCron] = useState(initialCron)
  const [scheduleLabel, setScheduleLabel] = useState(
    initialWorkflow?.scheduleLabel || 'Every day at 08:00 AM (WIB)'
  )
  const [agentId, setAgentId] = useState(
    initialWorkflow?.agentId || agents[0]?.id || 'agent-conversational'
  )
  const [mcpServerId, setMcpServerId] = useState(
    initialWorkflow?.mcpServerId || 'int-obsidian-vault-mcp'
  )
  const [selectedTools, setSelectedTools] = useState<string[]>(
    initialWorkflow?.mcpTools || [
      'obsidian_create_daily_note',
      'obsidian_vault_writer',
    ]
  )
  const [promptTemplate, setPromptTemplate] = useState(
    initialWorkflow?.promptTemplate ||
      "Fetch today's scheduled calendar meetings, summarize uncompleted backlog items, and construct an atomic markdown daily note in Obsidian at DailyNotes/{{today}}.md with frontmatter and bi-directional backlinks."
  )
  const [guardrailStrictHITL, setGuardrailStrictHITL] = useState(
    Boolean(initialWorkflow?.guardrailStrictHITL)
  )
  const [isActive] = useState(
    initialWorkflow ? initialWorkflow.isActive : true
  )

  const handleCronPresetChange = (presetCron: string) => {
    setCronPreset(presetCron)
    const preset = CRON_PRESETS.find((p) => p.cron === presetCron)
    if (preset && presetCron !== 'custom') {
      setScheduleLabel(preset.label)
    }
  }

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
        'obsidian_vault_writer',
        'obsidian_vault_reader',
      ])
    } else {
      setSelectedTools([])
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    const selectedAgent = agents.find((a) => a.id === agentId)
    const finalCron =
      triggerType === 'schedule'
        ? cronPreset === 'custom'
          ? customCron
          : cronPreset
        : undefined

    onSave({
      name: name.trim(),
      description: description.trim(),
      triggerType,
      scheduleCron: finalCron,
      scheduleLabel:
        triggerType === 'schedule'
          ? scheduleLabel || 'Custom Schedule'
          : triggerType === 'event'
          ? 'Event Trigger: File Change / PR'
          : 'Manual Run On-Demand',
      agentId: agentId || agents[0]?.id || 'agent-conversational',
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
    { id: 'obsidian_vault_writer', name: 'obsidian_vault_writer', description: 'Write or append markdown note' },
    { id: 'obsidian_vault_reader', name: 'obsidian_vault_reader', description: 'Read vault notes & backlinks' },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <ModalHeader
        title={initialWorkflow ? 'Edit Automation Workflow' : 'Create Agentic Automation'}
        subtitle="Configure autonomous background tasks, cron schedule triggers, and MCP tool execution rules."
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

        {/* Schedule Frequency / Cron details */}
        {triggerType === 'schedule' && (
          <div className="p-3.5 rounded-lg bg-surface-strong/50 border border-hairline space-y-3">
            <FormField label="Execution Frequency">
              <Select
                value={cronPreset}
                onChange={(e) => handleCronPresetChange(e.target.value)}
              >
                {CRON_PRESETS.map((p) => (
                  <option key={p.cron} value={p.cron}>
                    {p.label}
                  </option>
                ))}
              </Select>
            </FormField>

            {cronPreset === 'custom' ? (
              <FormField label="Cron Expression (5-field standard)">
                <Input
                  value={customCron}
                  onChange={(e) => setCustomCron(e.target.value)}
                  placeholder="0 8 * * *"
                  className="font-mono text-xs"
                />
              </FormField>
            ) : null}

            <FormField label="Schedule Display Label">
              <Input
                value={scheduleLabel}
                onChange={(e) => setScheduleLabel(e.target.value)}
                placeholder="e.g. Every day at 08:00 AM (WIB)"
              />
            </FormField>
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
              <option value="">⚙️ Internal Sandboxed Agent Tools</option>
            </Select>
          </FormField>

          {/* MCP Tool Checkboxes */}
          <div className="p-3 rounded-lg bg-surface-strong/40 border border-hairline space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
                <Cpu size={13} className="text-primary" />
                <span>Authorized MCP Tools</span>
              </span>
              <span className="text-[11px] text-muted">
                {selectedTools.length} selected
              </span>
            </div>

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
        </div>

        {/* Prompt Instructions Template */}
        <FormField
          label="Workflow Prompt Template"
          hint="Instructions sent to the agent when triggered. Variables like {{today}}, {{schedule}}, and {{backlog}} are auto-resolved."
          required
        >
          <Textarea
            rows={4}
            value={promptTemplate}
            onChange={(e) => setPromptTemplate(e.target.value)}
            placeholder="e.g. Read today's schedule and format an atomic markdown daily note with frontmatter and backlinks..."
            required
            className="text-xs font-mono"
          />
        </FormField>

        {/* Guardrails Checkbox */}
        <div className="pt-2 border-t border-hairline flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={guardrailStrictHITL}
              onChange={(e) => setGuardrailStrictHITL(e.target.checked)}
              className="rounded border-hairline text-primary focus:ring-0"
            />
            <div>
              <span className="text-xs font-medium text-ink flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-semantic-success" />
                <span>Strict Human-In-The-Loop (HITL)</span>
              </span>
              <p className="text-[11px] text-muted">
                Require human review before file mutation or MCP writes are committed.
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Action Buttons */}
      <ModalFooter>
        <div className="flex items-center justify-end gap-2 w-full">
          <Button variant="secondary" size="sm" onClick={onClose} type="button">
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
      size="2xl"
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
