import React, { useState } from 'react'
import { Brain, Terminal, X, Sparkles, Check, Settings2 } from 'lucide-react'
import type { Agent } from '../../../shared/types/workspace'
import { useWorkspace } from '../../../shared/mock'

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

  // Local editing state
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

  // All tools available in workspace from connected integrations
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs">
      <div className="bg-surface-card border border-hairline rounded-xl max-w-2xl w-full p-6 space-y-5 shadow-xl max-h-[90vh] overflow-y-auto overscroll-contain">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl ${agent.avatarColor} text-canvas flex items-center justify-center font-mono font-bold text-sm shadow-xs`}
            >
              <Brain size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-ink">{agent.name}</h2>
              <div className="text-xs text-primary font-medium">{agent.role}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={isEditing ? handleCancelEdit : handleStartEdit}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                isEditing
                  ? 'bg-primary text-canvas border-primary'
                  : 'bg-canvas-soft hover:bg-canvas text-ink border-hairline'
              }`}
            >
              <Settings2 size={13} />
              <span>{isEditing ? 'Cancel Edit' : 'Edit Capabilities'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-md hover:bg-canvas-soft text-muted hover:text-ink cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Model & Config */}
        <div className="grid grid-cols-3 gap-3 p-3 bg-canvas-soft rounded-lg border border-hairline text-xs font-mono">
          <div>
            <div className="text-muted text-[10px] uppercase">Base LLM</div>
            <div className="font-semibold text-ink">{agent.model}</div>
          </div>
          <div>
            <div className="text-muted text-[10px] uppercase">Temperature</div>
            <div className="font-semibold text-ink">{agent.temperature}</div>
          </div>
          <div>
            <div className="text-muted text-[10px] uppercase">Historical Success</div>
            <div className="font-semibold text-semantic-success">{agent.successRatePct}%</div>
          </div>
        </div>

        {/* System Prompt */}
        <div className="space-y-1.5">
          <div className="text-xs font-mono uppercase tracking-caption text-muted">
            System Prompt & Guardrails:
          </div>
          <pre className="p-3 bg-ink text-canvas font-mono text-xs rounded-lg whitespace-pre-wrap leading-relaxed border border-hairline">
            {agent.systemPrompt}
          </pre>
        </div>

        {/* Assigned Skills Section */}
        <div className="space-y-2">
          <div className="text-xs font-mono uppercase tracking-caption text-primary flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sparkles size={13} />
              <span>Equipped Reasoning Skills ({isEditing ? selectedSkills.length : agent.assignedSkills?.length || 0}):</span>
            </span>
            {isEditing && (
              <span className="text-[10px] text-muted lowercase">click to toggle</span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
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
                      <div>
                        <div className="font-semibold text-ink text-[11px] leading-tight">
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
                      className="p-2.5 rounded bg-canvas border border-hairline flex items-center gap-2 text-ink"
                    >
                      <Sparkles size={13} className="text-primary shrink-0" />
                      <span className="truncate font-medium">
                        {s?.name || skillId}
                      </span>
                    </div>
                  )
                })}
          </div>
        </div>

        {/* Assigned Tools Section */}
        <div className="space-y-2">
          <div className="text-xs font-mono uppercase tracking-caption text-muted flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Terminal size={13} className="text-primary" />
              <span>Permitted Sandboxed Tools ({isEditing ? selectedTools.length : agent.assignedTools.length}):</span>
            </span>
            {isEditing && (
              <span className="text-[10px] text-muted lowercase">click to toggle</span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
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
                      <div>
                        <div className="font-semibold text-ink text-[11px] leading-tight">
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
                    className="p-2.5 rounded bg-canvas border border-hairline flex items-center gap-2 text-ink"
                  >
                    <Terminal size={13} className="text-primary shrink-0" />
                    <span className="truncate">{t}</span>
                  </div>
                ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-hairline flex items-center justify-between">
          {isEditing ? (
            <div className="flex items-center gap-2 w-full justify-end">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-3.5 py-1.5 bg-canvas-soft hover:bg-canvas text-xs font-semibold text-ink border border-hairline rounded-lg cursor-pointer"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={handleSaveCapabilities}
                className="px-4 py-1.5 bg-primary hover:bg-primary/90 text-xs font-semibold text-canvas rounded-lg shadow-xs cursor-pointer flex items-center gap-1"
              >
                <Check size={13} />
                <span>Save Agent Capabilities</span>
              </button>
            </div>
          ) : (
            <div className="flex justify-end w-full">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-canvas-soft hover:bg-canvas text-xs font-semibold text-ink border border-hairline rounded-lg cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
