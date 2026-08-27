import React, { useEffect } from 'react'
import { X } from 'lucide-react'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | 'full'
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
    '4xl': 'max-w-4xl',
    full: 'max-w-5xl',
  }

  return (
    <div
      onClick={closeOnBackdrop ? onClose : undefined}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-ink/40 backdrop-blur-xs overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-surface-card border border-hairline rounded-3xl ${
          sizeClasses[size] || 'max-w-2xl'
        } w-full p-5 sm:p-6 space-y-4 shadow-2xl max-h-[88vh] sm:max-h-[82vh] overflow-y-auto overscroll-contain animate-in fade-in zoom-in-95 duration-150 my-auto ${className}`}
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
      className={`flex items-start justify-between gap-3 pb-3.5 border-b border-hairline w-full min-w-0 ${className}`}
    >
      <div className="flex items-start gap-3 min-w-0 flex-1">
        {icon && <div className="shrink-0 mt-0.5">{icon}</div>}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <h2 className="text-base font-semibold text-ink leading-snug wrap-break-word">
              {title}
            </h2>
            {badge && <span className="shrink-0">{badge}</span>}
          </div>
          {subtitle && (
            <div className="text-xs text-muted mt-1 wrap-break-word leading-relaxed font-sans">
              {subtitle}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {actions && <div>{actions}</div>}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-surface-strong text-muted hover:text-ink cursor-pointer transition-colors active:scale-95"
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
      className={`pt-3.5 border-t border-hairline flex items-center justify-between gap-3 ${className}`}
    >
      {children}
    </div>
  )
}
