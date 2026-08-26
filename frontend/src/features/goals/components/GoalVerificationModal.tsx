import React, { useState } from 'react'
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react'
import { goalsApi, type GoalTask } from '@/shared/api/goalsApi'
import {
  Modal,
  ModalHeader,
  ModalFooter,
  Button,
  FormField,
  Input,
  IconBox,
} from '@/shared'

interface GoalVerificationModalProps {
  isOpen: boolean
  task: GoalTask | null
  onClose: () => void
  onTaskUpdated: () => void
}

export const GoalVerificationModal: React.FC<GoalVerificationModalProps> = ({
  isOpen,
  task,
  onClose,
  onTaskUpdated,
}) => {
  const [isVerifying, setIsVerifying] = useState(false)
  const [notes, setNotes] = useState('')

  if (!isOpen || !task) return null

  const handleManualVerify = async (
    status: 'verified_completed' | 'incomplete',
  ) => {
    setIsVerifying(true)
    try {
      await goalsApi.updateGoalTaskStatus(task.goal_id, task.id, {
        status,
        verificationNotes:
          notes.trim() ||
          (status === 'verified_completed'
            ? 'Confirmed directly as completed by user.'
            : 'Marked as incomplete by user.'),
        verificationEvidence: {
          verifiedBy: 'human_in_the_loop',
          verifiedAt: new Date().toISOString(),
        },
      })
      onTaskUpdated()
      onClose()
    } catch {
      // safe
    } finally {
      setIsVerifying(false)
    }
  }

  const handleMcpTelemetryCheck = async () => {
    setIsVerifying(true)
    try {
      await goalsApi.verifyGoalTask(task.goal_id, task.id)
      onTaskUpdated()
      onClose()
    } catch {
      // safe
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalHeader
        title="Evidence Verification Gate"
        subtitle="Epistemic Rigor & Zero-Assumption Policy"
        icon={<IconBox size="md" variant="neutral" icon={<ShieldCheck size={18} className="text-amber-500" />} />}
        onClose={onClose}
      />

      <div className="space-y-4 py-2">
        {/* Task Context Card */}
        <div className="p-3.5 bg-surface-card border border-hairline rounded-2xl space-y-1.5 shadow-2xs">
          <div className="text-[10px] font-mono text-muted uppercase tracking-caption font-semibold">
            Task Under Verification
          </div>
          <h4 className="text-xs font-semibold text-ink">{task.title}</h4>
          {task.description && (
            <p className="text-[11px] text-muted leading-tight">{task.description}</p>
          )}
          <div className="pt-1 flex items-center gap-2 text-xs">
            <span className="text-muted text-[11px]">Target MCP:</span>
            <span className="font-mono text-ink text-xs font-semibold">
              {task.mcp_target || 'General'}
            </span>
          </div>
        </div>

        <p className="text-xs text-muted leading-relaxed font-sans">
          The system did not find automatic telemetry verification for this item or it was conducted offline. Please select the verified outcome:
        </p>

        {/* Reflection Notes */}
        <FormField label="Verification Note / Reflection (Optional)">
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Read chapter 3, finished mock implementation..."
          />
        </FormField>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <Button
            type="button"
            variant="primary"
            size="sm"
            className="w-full justify-center"
            isLoading={isVerifying}
            leftIcon={<CheckCircle2 size={14} />}
            onClick={() => handleManualVerify('verified_completed')}
          >
            Confirm Verified Done
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full justify-center"
            disabled={isVerifying}
            leftIcon={<Sparkles size={13} className="text-primary" />}
            onClick={handleMcpTelemetryCheck}
          >
            Re-check via MCP Telemetry
          </Button>

          <Button
            type="button"
            variant="danger"
            size="sm"
            className="w-full justify-center"
            disabled={isVerifying}
            leftIcon={<AlertCircle size={13} />}
            onClick={() => handleManualVerify('incomplete')}
          >
            Mark Incomplete & Reschedule
          </Button>
        </div>
      </div>

      <ModalFooter>
        <div className="text-[10px] font-mono text-muted">
          HITL Gate • Rigorous Evidence Mode
        </div>
        <Button type="button" variant="ghost" size="xs" onClick={onClose}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  )
}
