import React, { useState } from 'react'
import { Brain, Terminal, Sparkles, Check, Settings2 } from 'lucide-react'
import type { Agent } from '@/shared/types/workspace'
import { useWorkspace } from '@/shared/mock'
import { Modal, ModalHeader, ModalFooter } from '@/shared/components/ui/Modal'

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

  const handleStartEdit = () => {
    if (agent) {
      setSelectedTools(agent.assignedTools || [])
      setSelectedSkills(agent.assignedSkills || [])
      setIsEditing(true)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
  }

  if (!agent) return null

  const allWorkspaceTools = integrations.flatMap((intg) =>
    intg.tools.map((t) => ({ name: t.name, integrationName: intg.name }))
  )

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
    updateAgentCapabilities(agent.id, selectedTools, selectedSkills)
    setIsEditing(false)
  }

  const icon = (
    <div
      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${agent.avatarColor} text-canvas flex items-center justify-center font-mono font-bold text-sm shadow-xs shrink-0`}
    >
      <Brain className="w-4 h-4 sm:w-5 sm:h-5" />
    </div>
  )

  const renderActions = () => (
    <button
      onClick={isEditing ? handleCancelEdit : handleStartEdit}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
        isEditing
          ? 'bg-primary text-canvas border-primary'
          : 'bg-canvas-soft hover:bg-canvas text-ink border-hairline'
      }`}
    >
      <Settings2 size={13} />
      <span>{isEditing ? 'Cancel' : 'Edit Capabilities'}</span>
    </button>
  )

  return (
    <Modal isOpen={Boolean(agent)} onClose={onClose} size="2xl">
      <ModalHeader
        icon={icon}
        title={agent.name}
        subtitle={agent.role}
        onClose={onClose}
        actions={renderActions()}
      />

      <div className="space-y-3 text-xs">
        {/* Model & Config */}
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
          <pre className="p-2.5 bg-canvas text-ink font-mono text-xs rounded-lg whitespace-pre-wrap leading-relaxed border border-hairline max-h-28 overflow-y-auto">
            {agent.systemPrompt}
          </pre>
        </div>

        {/* Assigned Skills Section */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-mono uppercase tracking-caption text-primary flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sparkles size={12} />
              <span>
                Equipped Reasoning Skills (
                {isEditing ? selectedSkills.length : agent.assignedSkills?.length || 0}
                ):
              </span>
            </span>
            {isEditing && (
              <span className="text-[10px] text-muted lowercase">click to toggle</span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono">
            {isEditing
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
                      <span className="truncate font-medium text-xs">
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
                Permitted Sandboxed Tools (
                {isEditing ? selectedTools.length : agent.assignedTools.length}
                ):
              </span>
            </span>
            {isEditing && (
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
              : agent.assignedTools.map((t) => (
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
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-3.5 py-1.5 text-xs text-body hover:text-ink cursor-pointer"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={handleSaveCapabilities}
                className="px-4 py-1.5 bg-primary hover:bg-primary/90 text-xs font-semibold text-canvas rounded-lg shadow-xs cursor-pointer flex items-center gap-1"
              >
                <Check size={13} />
                <span>Save Capabilities</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-primary hover:bg-primary/90 text-xs font-semibold text-canvas rounded-lg shadow-xs cursor-pointer transition-colors flex items-center gap-1"
            >
              <Check size={13} />
              <span>Done</span>
            </button>
          )}
        </ModalFooter>
      </div>
    </Modal>
  )
}
