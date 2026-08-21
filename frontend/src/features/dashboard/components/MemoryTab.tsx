import React, { useState } from 'react'
import {
  Brain,
  Plus,
  Trash2,
} from 'lucide-react'
import { useWorkspace } from '@/shared/mock'
import {
  EmptyState,
  IconBox,
  Button,
  Input,
  Select,
  Textarea,
  Badge,
} from '@/shared/components'
import type { UserMemoryItem } from '@/shared/types/workspace'

export const MemoryTab: React.FC = () => {
  const {
    userMemories,
    addUserMemory,
    deleteUserMemory,
  } = useWorkspace()

  const [showAddMemoryModal, setShowAddMemoryModal] = useState(false)
  const [newMemoryCategory, setNewMemoryCategory] = useState<UserMemoryItem['category']>('preference')
  const [newMemoryKey, setNewMemoryKey] = useState('')
  const [newMemoryValue, setNewMemoryValue] = useState('')

  const handleCreateMemory = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMemoryKey.trim() || !newMemoryValue.trim()) return

    addUserMemory({
      category: newMemoryCategory,
      key: newMemoryKey.trim(),
      value: newMemoryValue.trim(),
    })

    setNewMemoryKey('')
    setNewMemoryValue('')
    setShowAddMemoryModal(false)
  }

  return (
    <div className="space-y-3">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-mono uppercase tracking-caption text-muted flex items-center gap-1.5">
          <Brain size={12} className="text-primary" />
          <span>AI Long-Term Memory ({userMemories.length})</span>
        </div>

        <Button
          variant="secondary"
          size="xs"
          leftIcon={<Plus size={11} />}
          onClick={() => setShowAddMemoryModal(!showAddMemoryModal)}
        >
          Add Fact
        </Button>
      </div>

      {/* Inline Add Memory Form */}
      {showAddMemoryModal && (
        <form
          onSubmit={handleCreateMemory}
          className="p-3 bg-surface-card border border-primary/40 rounded-xl space-y-2.5 shadow-xs"
        >
          <div className="font-semibold text-ink text-xs">Add Personal Preference / Fact</div>
          <div className="grid grid-cols-2 gap-2">
            <Select
              value={newMemoryCategory}
              onChange={(e) => setNewMemoryCategory(e.target.value as UserMemoryItem['category'])}
              options={[
                { label: 'Profile', value: 'profile' },
                { label: 'Preference', value: 'preference' },
                { label: 'Project', value: 'project' },
                { label: 'Workflow', value: 'workflow' },
              ]}
            />
            <Input
              placeholder="Memory Key"
              value={newMemoryKey}
              onChange={(e) => setNewMemoryKey(e.target.value)}
              required
            />
          </div>
          <Textarea
            rows={2}
            placeholder="Value / Context details (e.g. Always generate TypeScript code with strict mode)"
            value={newMemoryValue}
            onChange={(e) => setNewMemoryValue(e.target.value)}
            required
          />
          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => setShowAddMemoryModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="xs">
              Save to Memory
            </Button>
          </div>
        </form>
      )}

      {/* Memory Items List */}
      <div className="space-y-2">
        {userMemories.length === 0 ? (
          <EmptyState
            compact
            icon={
              <IconBox
                size="md"
                variant="purple"
                icon={<Brain size={18} />}
              />
            }
            title="Memory Bank is Empty"
            description="ContextForge AI automatically stores key facts, preferences, and workspace rules here."
          />
        ) : (
          userMemories.map((mem) => (
            <div
              key={mem.id}
              className="p-3 rounded-xl bg-surface-card border border-hairline hover:border-hairline-strong space-y-1.5 shadow-2xs group"
            >
              <div className="flex items-center justify-between gap-2">
                <Badge variant="primary" size="xs">
                  {mem.category}
                </Badge>

                <button
                  type="button"
                  onClick={() => deleteUserMemory(mem.id)}
                  className="text-muted hover:text-semantic-error opacity-0 group-hover:opacity-100 transition-opacity p-1 cursor-pointer"
                  title="Forget this memory item"
                >
                  <Trash2 size={12} />
                </button>
              </div>

              <div className="font-semibold text-xs text-ink">{mem.key}</div>
              <p className="text-[11px] text-body leading-relaxed">{mem.value}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
