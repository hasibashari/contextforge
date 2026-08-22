import { useState } from 'react'
import { Plus, Zap } from 'lucide-react'
import { useWorkspace } from '@/shared/context'
import {
  PageHeader,
  Button,
  ConfirmDeleteModal,
} from '@/shared/components'
import type { AutomationWorkflow } from '@/shared/types/workspace'
import { AutomationCard } from '../components/AutomationCard'
import { AutomationModal } from '../components/AutomationModal'

export default function AutomationView() {
  const {
    automations,
    runningAutomationId,
    createAutomation,
    updateAutomation,
    deleteAutomation,
    toggleAutomationActive,
    runAutomationNow,
    agents,
    integrations,
  } = useWorkspace()

  // Modals state (ID-based for full reactivity)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingWorkflowId, setEditingWorkflowId] = useState<string | null>(null)
  const [deletingWorkflowId, setDeletingWorkflowId] = useState<string | null>(null)

  const editingWorkflow = automations.find((a) => a.id === editingWorkflowId) || null

  const handleOpenCreateModal = () => {
    setEditingWorkflowId(null)
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (workflow: AutomationWorkflow) => {
    setEditingWorkflowId(workflow.id)
    setIsModalOpen(true)
  }

  const handleSaveWorkflow = (
    data: Omit<AutomationWorkflow, 'id' | 'totalRuns' | 'createdAt'>
  ) => {
    if (editingWorkflowId) {
      updateAutomation(editingWorkflowId, data)
    } else {
      createAutomation(data)
    }
  }

  const handleConfirmDelete = () => {
    if (deletingWorkflowId) {
      deleteAutomation(deletingWorkflowId)
      setDeletingWorkflowId(null)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
      {/* Top Banner Header */}
      <PageHeader
        eyebrow="Autonomous Background Workers & Scheduled Tasks"
        title="Automations & Workflows"
        description="Configure autonomous background schedules (Triggers), prompt templates, and direct MCP tool executions (Obsidian Vault daily note synthesis, Notion task briefings)."
        actions={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus size={14} />}
            onClick={handleOpenCreateModal}
          >
            Create Automation
          </Button>
        }
      />

      {/* Cards Grid */}
      {automations.length === 0 ? (
        <div className="p-12 text-center rounded-xl border border-hairline bg-surface-card text-muted space-y-3">
          <Zap size={32} className="mx-auto text-muted/60" />
          <h3 className="text-sm font-semibold text-ink">No automations found</h3>
          <p className="text-xs max-w-md mx-auto">
            Create a new autonomous agent workflow to trigger scheduled tasks or Obsidian Vault note generation.
          </p>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus size={14} />}
            onClick={handleOpenCreateModal}
          >
            Create Your First Automation
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {automations.map((workflow) => (
            <AutomationCard
              key={workflow.id}
              workflow={workflow}
              isRunning={runningAutomationId === workflow.id}
              onRunNow={runAutomationNow}
              onToggleActive={toggleAutomationActive}
              onEdit={handleOpenEditModal}
              onDelete={(id) => setDeletingWorkflowId(id)}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <AutomationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveWorkflow}
        initialWorkflow={editingWorkflow}
        agents={agents}
        integrations={integrations}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(deletingWorkflowId)}
        onClose={() => setDeletingWorkflowId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Automation Workflow"
        description="Are you sure you want to delete this automation? Scheduled triggers for this workflow will be permanently stopped."
      />
    </div>
  )
}
