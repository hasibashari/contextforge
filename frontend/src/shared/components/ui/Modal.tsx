import React, { useEffect } from 'react'
import { X } from 'lucide-react'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full'
  className?: string
  closeOnBackdrop?: boolean
  closeOnEsc?: boolean
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  size = '2xl',
  className = '',
  closeOnBackdrop = true,
  closeOnEsc = true,
}) => {
  useEffect(() => {
    if (!isOpen || !closeOnEsc) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, closeOnEsc, onClose])

  if (!isOpen) return null

  const sizeClasses: Record<string, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    full: 'max-w-5xl',
  }

  return (
    <div
      onClick={closeOnBackdrop ? onClose : undefined}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-ink/40 backdrop-blur-xs overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-surface-card border border-hairline rounded-xl sm:rounded-2xl ${
          sizeClasses[size] || 'max-w-2xl'
        } w-full p-4 sm:p-5 space-y-3.5 shadow-2xl max-h-[85vh] sm:max-h-[80vh] overflow-y-auto overscroll-contain animate-in fade-in zoom-in-95 duration-150 my-auto ${className}`}
      >
        {children}
      </div>
    </div>
  )
}

export interface ModalHeaderProps {
  icon?: React.ReactNode
  title: React.ReactNode
  subtitle?: React.ReactNode
  badge?: React.ReactNode
  onClose?: () => void
  actions?: React.ReactNode
  className?: string
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({
  icon,
  title,
  subtitle,
  badge,
  onClose,
  actions,
  className = '',
}) => {
  return (
    <div
      className={`flex items-start justify-between gap-3 pb-3 border-b border-hairline ${className}`}
    >
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        {icon && <div className="shrink-0">{icon}</div>}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
            <h2 className="text-sm sm:text-base font-semibold text-ink leading-snug truncate">
              {title}
            </h2>
            {badge && <span className="shrink-0">{badge}</span>}
          </div>
          {subtitle && (
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-mono text-muted mt-0.5">
              {subtitle}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {actions && <div>{actions}</div>}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-canvas-soft text-muted hover:text-ink cursor-pointer transition-colors"
            title="Close modal"
          >
            <X size={17} />
          </button>
        )}
      </div>
    </div>
  )
}

export interface ModalFooterProps {
  children: React.ReactNode
  className?: string
}

export const ModalFooter: React.FC<ModalFooterProps> = ({
  children,
  className = '',
}) => {
  return (
    <div
      className={`pt-3 border-t border-hairline flex items-center justify-between gap-2.5 ${className}`}
    >
      {children}
    </div>
  )
}
