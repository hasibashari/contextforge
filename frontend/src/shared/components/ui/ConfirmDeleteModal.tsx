import React, { useState } from 'react'
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react'
import { Modal, ModalHeader, ModalFooter } from './Modal'
import { IconBox } from './IconBox'

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

      <div className="space-y-3 text-xs">
        <p className="text-body leading-relaxed">{description}</p>

        {itemName && (
          <div className="p-2.5 bg-canvas rounded-lg border border-hairline flex items-center gap-2 font-mono text-[11px] text-ink">
            <Trash2 size={13} className="text-semantic-error shrink-0" />
            <span className="font-semibold truncate">{itemName}</span>
          </div>
        )}
      </div>

      <ModalFooter className="justify-end gap-2 pt-3">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="px-3.5 py-1.5 text-xs text-body hover:text-ink cursor-pointer disabled:opacity-50"
        >
          {cancelLabel}
        </button>

        <button
          type="button"
          onClick={handleConfirm}
          disabled={loading}
          className="px-4 py-1.5 bg-semantic-error hover:bg-semantic-error/90 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 size={13} className="animate-spin" />
              <span>Deleting...</span>
            </>
          ) : (
            <>
              <Trash2 size={13} />
              <span>{confirmLabel}</span>
            </>
          )}
        </button>
      </ModalFooter>
    </Modal>
  )
}
