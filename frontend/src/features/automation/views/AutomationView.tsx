import { useState } from 'react'
import { Plus, Zap } from 'lucide-react'
import { useWorkspace } from '@/shared'
import {
  PageHeader,
  Button,
  ConfirmDeleteModal,
  EmptyState,
  IconBox,
} from '@/shared'
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
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-card border border-hairline shadow-2xs font-mono text-xs">
              <span
                className={`w-2 h-2 rounded-full ${
                  automations.filter((a) => a.isActive).length > 0
                    ? 'bg-semantic-success animate-pulse'
                    : 'bg-muted'
                }`}
              />
              <span className="text-body font-medium text-xs">
                <strong className="text-ink font-semibold">
                  {automations.filter((a) => a.isActive).length}
                </strong>{' '}
                of {automations.length} Active
              </span>
            </div>

            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus size={14} />}
              onClick={handleOpenCreateModal}
            >
              Create Automation
            </Button>
          </div>
        }
      />

      {/* Cards Grid or Empty State */}
      {automations.length === 0 ? (
        <EmptyState
          icon={<IconBox size="lg" variant="primary" icon={<Zap size={22} />} />}
          title="No Automations Configured"
          description="Create scheduled background workflows or event-driven triggers to execute multi-step MCP agent actions autonomously."
          action={{
            label: 'Create Your First Automation',
            onClick: handleOpenCreateModal,
            icon: <Plus size={14} />,
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
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
