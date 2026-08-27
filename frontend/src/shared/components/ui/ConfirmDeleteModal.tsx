import React, { useState } from 'react'
import { Trash2, AlertTriangle } from 'lucide-react'
import { Modal, ModalHeader, ModalFooter } from './Modal'
import { IconBox } from './IconBox'
import { Button } from './Button'

export interface ConfirmDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title?: string
  itemName?: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  isDeleting?: boolean
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete Confirmation',
  itemName,
  description = 'Are you sure you want to permanently delete this item? This action cannot be undone.',
  confirmLabel = 'Delete Permanently',
  cancelLabel = 'Cancel',
  isDeleting = false,
}) => {
  const [internalLoading, setInternalLoading] = useState(false)
  const loading = isDeleting || internalLoading

  const handleConfirm = async () => {
    try {
      setInternalLoading(true)
      await onConfirm()
    } finally {
      setInternalLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={loading ? () => {} : onClose} size="md">
      <ModalHeader
        icon={<IconBox size="md" variant="error" icon={<AlertTriangle size={18} />} />}
        title={title}
        onClose={loading ? undefined : onClose}
      />

      <div className="space-y-3.5 text-xs py-1">
        <p className="text-muted leading-relaxed font-sans">{description}</p>

        {itemName && (
          <div className="p-3 bg-surface-strong/60 rounded-xl border border-hairline flex items-center gap-2.5 font-mono text-[11px] text-ink">
            <Trash2 size={14} className="text-semantic-error shrink-0" />
            <span className="font-semibold truncate">{itemName}</span>
          </div>
        )}
      </div>

      <ModalFooter className="justify-end gap-2.5">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClose}
          disabled={loading}
        >
          {cancelLabel}
        </Button>

        <Button
          type="button"
          variant="danger"
          size="sm"
          onClick={handleConfirm}
          isLoading={loading}
          leftIcon={<Trash2 size={13} />}
        >
          {confirmLabel}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
