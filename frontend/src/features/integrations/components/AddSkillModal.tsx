import React, { useState } from 'react'
import { Sparkles, Check } from 'lucide-react'
import type { Skill } from '@/shared/types/workspace'
import { Modal, ModalHeader, ModalFooter } from '@/shared/components/ui/Modal'
import { IconBox } from '@/shared/components/ui/IconBox'

interface AddSkillModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (data: {
    name: string
    description: string
    category: Skill['category']
    sopSummary: string
    instructions: string
    assignedTools: string[]
  }) => void
}

export const AddSkillModal: React.FC<AddSkillModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const [name, setName] = useState('')
  const [category, setCategory] = useState<Skill['category']>('qa_testing')
  const [sopSummary, setSopSummary] = useState('')
  const [description, setDescription] = useState('')
  const [instructions, setInstructions] = useState('')
  const [toolsString, setToolsString] = useState('eslint_ast_checker, github_grep')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !instructions.trim()) return

    const parsedTools = toolsString
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    onAdd({
      name: name.trim(),
      category,
      sopSummary: sopSummary.trim() || 'Custom reasoning playbook workflow',
      description: description.trim() || 'Custom AI skill for workspace agents.',
      instructions: instructions.trim(),
      assignedTools: parsedTools.length > 0 ? parsedTools : ['github_grep'],
    })

    setName('')
    setSopSummary('')
    setDescription('')
    setInstructions('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalHeader
        icon={<IconBox size="md" variant="primary" icon={<Sparkles size={19} />} />}
        title="Author Custom Skill Playbook"
        subtitle="Teach agents procedural SOPs & reasoning instructions"
        onClose={onClose}
      />

      <form onSubmit={handleSubmit} className="space-y-3 text-xs font-mono">
        <div className="space-y-1">
          <label className="text-ink font-semibold">Skill Title</label>
          <input
            type="text"
            placeholder="e.g. Clean Code & DRY Refactoring SOP"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 bg-canvas border border-hairline rounded-lg text-ink focus:outline-none focus:border-primary text-xs"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-ink font-semibold">Domain Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Skill['category'])}
              className="w-full px-3 py-2 bg-canvas border border-hairline rounded-lg text-ink focus:outline-none focus:border-primary text-xs cursor-pointer"
            >
              <option value="qa_testing">QA & Testing</option>
              <option value="security">Security & CVE</option>
              <option value="knowledge">Knowledge & Vault</option>
              <option value="database">Database & Schema</option>
              <option value="architecture">Architecture</option>
              <option value="productivity">Productivity</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-ink font-semibold">Assigned Tools (comma separated)</label>
            <input
              type="text"
              placeholder="github_grep, eslint_ast_checker"
              value={toolsString}
              onChange={(e) => setToolsString(e.target.value)}
              className="w-full px-3 py-2 bg-canvas border border-hairline rounded-lg text-ink focus:outline-none focus:border-primary text-xs"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-ink font-semibold">SOP Summary (Single Line Flow)</label>
          <input
            type="text"
            placeholder="Inspect AST -> Run linter -> Propose minimal diff -> Verify clean build"
            value={sopSummary}
            onChange={(e) => setSopSummary(e.target.value)}
            required
            className="w-full px-3 py-2 bg-canvas border border-hairline rounded-lg text-ink focus:outline-none focus:border-primary text-xs"
          />
        </div>

        <div className="space-y-1">
          <label className="text-ink font-semibold">Short Description</label>
          <input
            type="text"
            placeholder="What problem does this skill solve?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 bg-canvas border border-hairline rounded-lg text-ink focus:outline-none focus:border-primary font-sans text-xs"
          />
        </div>

        <div className="space-y-1">
          <label className="text-ink font-semibold">AI Instructions & Guardrails</label>
          <textarea
            rows={3}
            placeholder="1. First check XYZ...&#10;2. Never perform destructive operations without user signoff...&#10;3. Format final answer in markdown tables."
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            required
            className="w-full px-3 py-2 bg-canvas border border-hairline rounded-lg text-ink focus:outline-none focus:border-primary font-mono text-xs resize-none"
          />
        </div>

        <ModalFooter className="justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs text-body hover:text-ink cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-1.5 bg-primary hover:bg-primary/90 text-canvas text-xs font-semibold rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Check size={13} />
            <span>Create Skill Playbook</span>
          </button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
