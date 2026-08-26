import React, { useState } from 'react'
import { Terminal, Sparkles, Check, Settings2, RotateCcw, Layers, ShieldCheck } from 'lucide-react'
import type { Agent } from '@/shared/types/workspace'
import { useWorkspace } from '@/shared'
import {
  Modal,
  ModalHeader,
  ModalFooter,
  Button,
  AgentIconBox,
} from '@/shared'

interface AgentInspectorModalProps {
  agent: Agent | null
  onClose: () => void
}

export const AgentInspectorModal: React.FC<AgentInspectorModalProps> = ({
  agent,
  onClose,
}) => {
  const { skills, integrations, updateAgentCapabilities } = useWorkspace()
  const [isEditing, setIsEditing] = useState(false)

  const [selectedTools, setSelectedTools] = useState<string[]>([])
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])

  if (!agent) return null

  const isCoreOrchestrator =
    agent.agentType === 'orchestrator' ||
    agent.id === 'agent-personal-assistant' ||
    agent.id === 'agent-conversational'

  const handleStartEdit = () => {
    if (isCoreOrchestrator) return
    setSelectedTools(agent.assignedTools || [])
    setSelectedSkills(agent.assignedSkills || [])
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
  }

  const handleToggleTool = (toolName: string) => {
    setSelectedTools((prev) =>
      prev.includes(toolName)
        ? prev.filter((t) => t !== toolName)
        : [...prev, toolName]
    )
  }

  const handleToggleSkill = (skillId: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skillId)
        ? prev.filter((s) => s !== skillId)
        : [...prev, skillId]
    )
  }

  const handleSaveCapabilities = () => {
    if (!agent || isCoreOrchestrator) return
    updateAgentCapabilities(agent.id, selectedTools, selectedSkills)
    setIsEditing(false)
  }

  // Flatten all MCP tools from all integrations
  const allWorkspaceTools = integrations.flatMap((integration) =>
    (integration.tools || []).map((tool) => ({
      name: tool.name,
      description: tool.description,
      integrationName: integration.name,
    }))
  )

  const icon = <AgentIconBox agent={agent} size="md" />

  const renderActions = () => {
    if (isCoreOrchestrator) {
      return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary-soft border border-primary-subtle text-primary font-mono text-[11px] font-medium shadow-2xs">
          <ShieldCheck size={13} />
          <span>Core System (Built-in)</span>
        </div>
      )
    }

    return (
      <Button
        variant={isEditing ? 'secondary' : 'outline'}
        size="xs"
        leftIcon={isEditing ? <RotateCcw size={12} /> : <Settings2 size={12} />}
        onClick={isEditing ? handleCancelEdit : handleStartEdit}
      >
        {isEditing ? 'Cancel Edit' : 'Edit Capabilities'}
      </Button>
    )
  }

  return (
    <Modal isOpen={Boolean(agent)} onClose={onClose} size="2xl">
      <ModalHeader
        icon={icon}
        title={agent.name}
        subtitle={agent.role}
        onClose={onClose}
        actions={renderActions()}
      />

      <div className="space-y-4 text-xs font-sans">
        {/* Model & Metrics Tiles */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="p-3 bg-canvas-soft rounded-xl border border-hairline flex flex-col justify-between">
            <div className="text-muted text-[10px] uppercase font-mono tracking-caption">Base LLM</div>
            <div className="font-semibold text-ink font-mono text-xs mt-1 truncate" title={agent.model}>
              {agent.model}
            </div>
          </div>
          <div className="p-3 bg-canvas-soft rounded-xl border border-hairline flex flex-col justify-between">
            <div className="text-muted text-[10px] uppercase font-mono tracking-caption">Tasks Completed</div>
            <div className="font-semibold text-ink font-mono text-xs mt-1">
              {agent.totalTasksCompleted} tasks
            </div>
          </div>
          <div className="p-3 bg-canvas-soft rounded-xl border border-hairline flex flex-col justify-between">
            <div className="text-muted text-[10px] uppercase font-mono tracking-caption">Success Rate</div>
            <div className="font-semibold text-semantic-success font-mono text-xs mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-semantic-success animate-pulse" />
              <span>{agent.successRatePct}%</span>
            </div>
          </div>
        </div>

        {/* System Prompt & Guardrails */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-mono uppercase tracking-caption text-muted flex items-center gap-1.5">
            <Terminal size={11} className="text-primary" />
            <span>System Prompt &amp; Guardrails</span>
          </div>
          <div className="p-3 bg-canvas-soft text-ink font-mono text-xs rounded-xl whitespace-pre-wrap leading-relaxed border border-hairline max-h-24 overflow-y-auto">
            {agent.systemPrompt}
          </div>
        </div>

        {/* Core Agent Capabilities */}
        {agent.capabilities && agent.capabilities.length > 0 && (
          <div className="space-y-2">
            <div className="text-[11px] font-mono uppercase tracking-caption text-ink font-semibold flex items-center gap-1.5">
              <Layers size={12} className="text-primary" />
              <span>Core Capabilities</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {agent.capabilities.map((cap) => (
                <div
                  key={cap.id}
                  className="p-3 rounded-xl bg-canvas-soft border border-hairline flex flex-col justify-between space-y-1"
                >
                  <div className="font-semibold text-ink text-xs font-sans flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    <span className="truncate">{cap.name}</span>
                  </div>
                  <p className="text-[11px] text-muted font-sans leading-relaxed">
                    {cap.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Assigned Skills Section */}
        <div className="space-y-2">
          <div className="text-[11px] font-mono uppercase tracking-caption text-purple-600 dark:text-purple-400 font-semibold flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sparkles size={12} />
              <span>
                {isCoreOrchestrator
                  ? `Equipped Reasoning SOPs (${agent.assignedSkills?.length || 0}):`
                  : `Equipped Reasoning Skills (${isEditing ? selectedSkills.length : agent.assignedSkills?.length || 0}):`}
              </span>
            </span>
            {isEditing && !isCoreOrchestrator && (
              <span className="text-[10px] text-muted normal-case font-normal">click card to toggle</span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono">
            {isEditing && !isCoreOrchestrator
              ? skills.map((skill) => {
                  const isChecked = selectedSkills.includes(skill.id)
                  return (
                    <button
                      key={skill.id}
                      type="button"
                      onClick={() => handleToggleSkill(skill.id)}
                      className={`p-2.5 rounded-xl border text-left flex items-start justify-between gap-2 transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-purple-500/10 border-purple-500/40 text-ink shadow-2xs'
                          : 'bg-canvas-soft border-hairline text-muted hover:text-ink hover:border-hairline-strong'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-ink text-xs font-sans leading-tight truncate">
                          {skill.name}
                        </div>
                        <div className="text-[10px] text-muted mt-0.5 capitalize font-mono">
                          {skill.category.replace('_', ' ')}
                        </div>
                      </div>
                      <span
                        className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold shrink-0 transition-colors ${
                          isChecked ? 'bg-purple-600 text-white' : 'border border-hairline bg-surface-card'
                        }`}
                      >
                        {isChecked && <Check size={11} />}
                      </span>
                    </button>
                  )
                })
              : (agent.assignedSkills || []).map((skillId) => {
                  const s = skills.find((item) => item.id === skillId)
                  return (
                    <div
                      key={skillId}
                      className="p-2.5 rounded-xl bg-canvas-soft border border-hairline flex items-center gap-2 text-ink"
                    >
                      <Sparkles size={12} className="text-purple-600 dark:text-purple-400 shrink-0" />
                      <span className="truncate font-medium text-xs font-sans">
                        {s?.name || skillId}
                      </span>
                    </div>
                  )
                })}
          </div>
        </div>

        {/* Assigned Tools Section */}
        <div className="space-y-2">
          <div className="text-[11px] font-mono uppercase tracking-caption text-ink font-semibold flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Terminal size={12} className="text-primary" />
              <span>
                {isCoreOrchestrator
                  ? `Built-in Delegation Tools (${agent.assignedTools?.length || 0}):`
                  : `Authorized MCP Tools (${isEditing ? selectedTools.length : agent.assignedTools?.length || 0}):`}
              </span>
            </span>
            {isEditing && !isCoreOrchestrator && (
              <span className="text-[10px] text-muted normal-case font-normal">click card to toggle</span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono">
            {isEditing
              ? allWorkspaceTools.map((tool) => {
                  const isChecked = selectedTools.includes(tool.name)
                  return (
                    <button
                      key={tool.name}
                      type="button"
                      onClick={() => handleToggleTool(tool.name)}
                      className={`p-2.5 rounded-xl border text-left flex items-start justify-between gap-2 transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-primary-soft border-primary-subtle text-ink shadow-2xs'
                          : 'bg-canvas-soft border-hairline text-muted hover:text-ink hover:border-hairline-strong'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-ink text-xs font-mono leading-tight truncate">
                          {tool.name}
                        </div>
                        <div className="text-[10px] text-muted mt-0.5 truncate font-sans">
                          {tool.integrationName}
                        </div>
                      </div>
                      <span
                        className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold shrink-0 transition-colors ${
                          isChecked ? 'bg-primary text-on-primary' : 'border border-hairline bg-surface-card'
                        }`}
                      >
                        {isChecked && <Check size={11} />}
                      </span>
                    </button>
                  )
                })
              : (agent.assignedTools || []).map((t) => (
                  <div
                    key={t}
                    className="p-2.5 rounded-xl bg-canvas-soft border border-hairline flex items-center gap-2 text-ink"
                  >
                    <Terminal size={12} className="text-primary shrink-0" />
                    <span className="truncate text-xs font-mono">{t}</span>
                  </div>
                ))}
          </div>
        </div>

        {/* Footer Actions */}
        <ModalFooter className="justify-end pt-3">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="xs" onClick={handleCancelEdit}>
                Discard
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Check size={13} />}
                onClick={handleSaveCapabilities}
              >
                Save Capabilities
              </Button>
            </div>
          ) : (
            <Button variant="primary" size="sm" leftIcon={<Check size={13} />} onClick={onClose}>
              Done
            </Button>
          )}
        </ModalFooter>
      </div>
    </Modal>
  )
}
