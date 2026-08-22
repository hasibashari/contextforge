import React, { useState } from 'react'
import { Brain, Terminal, Sparkles, Check, Settings2, RotateCcw, Layers, ShieldCheck } from 'lucide-react'
import type { Agent } from '@/shared/types/workspace'
import { useWorkspace } from '@/shared/context'
import {
  Modal,
  ModalHeader,
  ModalFooter,
  Button,
} from '@/shared/components'

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
    agent.agentType === 'orchestrator' || agent.id === 'agent-conversational'

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

  const icon = (
    <div
      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${agent.avatarColor} text-canvas flex items-center justify-center font-mono font-bold text-sm shadow-xs shrink-0`}
    >
      <Brain className="w-4 h-4 sm:w-5 sm:h-5" />
    </div>
  )

  const renderActions = () => {
    if (isCoreOrchestrator) {
      return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary font-mono text-[11px] font-medium shadow-2xs">
          <ShieldCheck size={13} />
          <span>Core System (Built-in)</span>
        </div>
      )
    }

    return (
      <Button
        variant={isEditing ? 'secondary' : 'outline'}
        size="xs"
        leftIcon={isEditing ? <RotateCcw size={13} /> : <Settings2 size={13} />}
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

      <div className="space-y-3 text-xs font-sans">
        {/* Model & Config Bar */}
        <div className="grid grid-cols-3 gap-2 p-2.5 bg-canvas-soft rounded-lg border border-hairline font-mono text-[11px]">
          <div>
            <div className="text-muted text-[10px] uppercase">Base LLM</div>
            <div className="font-semibold text-ink truncate">{agent.model}</div>
          </div>
          <div>
            <div className="text-muted text-[10px] uppercase">Tasks Done</div>
            <div className="font-semibold text-ink">{agent.totalTasksCompleted}</div>
          </div>
          <div>
            <div className="text-muted text-[10px] uppercase">Success Rate</div>
            <div className="font-semibold text-semantic-success">
              {agent.successRatePct}%
            </div>
          </div>
        </div>

        {/* System Prompt */}
        <div className="space-y-1">
          <div className="text-[11px] font-mono uppercase tracking-caption text-muted">
            System Prompt &amp; Guardrails:
          </div>
          <pre className="p-2.5 bg-canvas text-ink font-mono text-xs rounded-lg whitespace-pre-wrap leading-relaxed border border-hairline max-h-24 overflow-y-auto">
            {agent.systemPrompt}
          </pre>
        </div>

        {/* Core Agent Capabilities */}
        {agent.capabilities && agent.capabilities.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-[11px] font-mono uppercase tracking-caption text-ink font-semibold flex items-center gap-1.5">
              <Layers size={12} className="text-primary" />
              <span>Core Capabilities (What this agent does):</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {agent.capabilities.map((cap) => (
                <div
                  key={cap.id}
                  className="p-2.5 rounded-lg bg-canvas border border-hairline flex flex-col justify-between space-y-1"
                >
                  <div className="font-semibold text-ink text-[11px] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    <span className="truncate">{cap.name}</span>
                  </div>
                  <p className="text-[10px] text-muted leading-relaxed">
                    {cap.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Assigned Skills Section */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-mono uppercase tracking-caption text-primary flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sparkles size={12} />
              <span>
                {isCoreOrchestrator
                  ? `Equipped Reasoning SOPs (${agent.assignedSkills?.length || 0}):`
                  : `Equipped Reasoning Skills (${isEditing ? selectedSkills.length : agent.assignedSkills?.length || 0}):`}
              </span>
            </span>
            {isEditing && !isCoreOrchestrator && (
              <span className="text-[10px] text-muted lowercase">click to toggle</span>
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
                      className={`p-2.5 rounded-lg border text-left flex items-start justify-between gap-2 transition-colors cursor-pointer ${
                        isChecked
                          ? 'bg-primary/10 border-primary/40 text-ink'
                          : 'bg-canvas border-hairline text-muted hover:text-ink'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-ink text-[11px] leading-tight truncate">
                          {skill.name}
                        </div>
                        <div className="text-[10px] text-muted mt-0.5 capitalize">
                          {skill.category.replace('_', ' ')}
                        </div>
                      </div>
                      <span
                        className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          isChecked ? 'bg-primary text-canvas' : 'border border-hairline'
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
                      className="p-2 rounded bg-canvas border border-hairline flex items-center gap-2 text-ink"
                    >
                      <Sparkles size={12} className="text-primary shrink-0" />
                      <span className="truncate font-medium text-xs font-sans">
                        {s?.name || skillId}
                      </span>
                    </div>
                  )
                })}
          </div>
        </div>

        {/* Assigned Tools Section */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-mono uppercase tracking-caption text-muted flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Terminal size={12} className="text-primary" />
              <span>
                {isCoreOrchestrator
                  ? `Built-in Delegation Tools (${agent.assignedTools?.length || 0}):`
                  : `Authorized MCP Tools (${isEditing ? selectedTools.length : agent.assignedTools?.length || 0}):`}
              </span>
            </span>
            {isEditing && !isCoreOrchestrator && (
              <span className="text-[10px] text-muted lowercase">click to toggle</span>
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
                      className={`p-2.5 rounded-lg border text-left flex items-start justify-between gap-2 transition-colors cursor-pointer ${
                        isChecked
                          ? 'bg-canvas-soft border-primary/40 text-ink'
                          : 'bg-canvas border-hairline text-muted hover:text-ink'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-ink text-[11px] leading-tight truncate">
                          {tool.name}
                        </div>
                        <div className="text-[10px] text-muted mt-0.5">
                          {tool.integrationName}
                        </div>
                      </div>
                      <span
                        className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          isChecked ? 'bg-primary text-canvas' : 'border border-hairline'
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
                    className="p-2 rounded bg-canvas border border-hairline flex items-center gap-2 text-ink"
                  >
                    <Terminal size={12} className="text-primary shrink-0" />
                    <span className="truncate text-xs">{t}</span>
                  </div>
                ))}
          </div>
        </div>

        {/* Footer Actions */}
        <ModalFooter className="justify-end">
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
