import React, { useState } from 'react'
import { Sparkles, Check } from 'lucide-react'
import type { Skill } from '@/shared/types/workspace'
import {
  Modal,
  ModalHeader,
  ModalFooter,
  IconBox,
  Button,
  Input,
  Select,
  Textarea,
  FormField,
} from '@/shared/components'

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

      <form onSubmit={handleSubmit} className="space-y-3.5 text-xs font-mono">
        <FormField label="Skill Title" required>
          <Input
            placeholder="e.g. Clean Code & DRY Refactoring SOP"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Domain Category">
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value as Skill['category'])}
              options={[
                { label: 'QA & Testing', value: 'qa_testing' },
                { label: 'Security & CVE', value: 'security' },
                { label: 'Knowledge & Vault', value: 'knowledge' },
                { label: 'Database & Schema', value: 'database' },
                { label: 'Architecture', value: 'architecture' },
                { label: 'Productivity', value: 'productivity' },
              ]}
            />
          </FormField>

          <FormField label="Assigned Tools (comma separated)">
            <Input
              variant="mono"
              placeholder="github_grep, eslint_ast_checker"
              value={toolsString}
              onChange={(e) => setToolsString(e.target.value)}
            />
          </FormField>
        </div>

        <FormField label="SOP Summary (Single Line Flow)" required>
          <Input
            placeholder="Inspect AST -> Run linter -> Propose minimal diff -> Verify clean build"
            value={sopSummary}
            onChange={(e) => setSopSummary(e.target.value)}
            required
          />
        </FormField>

        <FormField label="Short Description">
          <Input
            placeholder="What problem does this skill solve?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </FormField>

        <FormField label="AI Instructions & Guardrails" required>
          <Textarea
            variant="mono"
            rows={3}
            placeholder="1. First check XYZ...&#10;2. Never perform destructive operations without user signoff...&#10;3. Format final answer in markdown tables."
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            required
          />
        </FormField>

        <ModalFooter className="justify-end">
          <Button type="button" variant="ghost" size="xs" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" leftIcon={<Check size={13} />}>
            Create Skill Playbook
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
