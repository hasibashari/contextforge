import React from 'react'

export interface EmptyStateAction {
  label: string
  onClick: () => void
  icon?: React.ReactNode
  variant?: 'primary' | 'secondary' | 'outline'
}

export interface EmptyStateFooterPill {
  icon?: React.ReactNode
  label: string
}

export interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description?: string
  action?: EmptyStateAction
  secondaryAction?: EmptyStateAction
  footerPills?: EmptyStateFooterPill[]
  className?: string
  compact?: boolean
  fullWidth?: boolean
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  secondaryAction,
  footerPills,
  className = '',
  compact = false,
  fullWidth = true,
}) => {
  return (
    <div
      className={`bg-surface-card border border-hairline rounded-2xl text-center space-y-3.5 shadow-2xs ${
        compact
          ? 'p-6 max-w-md mx-auto'
          : fullWidth
          ? 'w-full p-8 sm:p-12'
          : 'p-8 sm:p-12 max-w-2xl mx-auto'
      } ${className}`}
    >
      {/* Centered Icon Wrapper */}
      <div className="mx-auto w-fit">{icon}</div>

      {/* Title & Description */}
      <div className="space-y-1.5 max-w-md mx-auto">
        <h3 className={`font-semibold text-ink ${compact ? 'text-sm' : 'text-base'}`}>
          {title}
        </h3>
        {description && (
          <p className="text-xs text-body leading-relaxed">{description}</p>
        )}
      </div>

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1.5 font-sans">
          {action && (
            <button
              type="button"
              onClick={action.onClick}
              className={`px-4 py-2 text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                action.variant === 'secondary'
                  ? 'bg-canvas-soft hover:bg-canvas text-ink border border-hairline'
                  : action.variant === 'outline'
                  ? 'bg-transparent hover:bg-surface-strong text-primary border border-primary/30'
                  : 'bg-primary hover:bg-primary/90 text-canvas'
              }`}
            >
              {action.icon}
              <span>{action.label}</span>
            </button>
          )}

          {secondaryAction && (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5 bg-canvas-soft hover:bg-canvas text-body hover:text-ink border border-hairline"
            >
              {secondaryAction.icon}
              <span>{secondaryAction.label}</span>
            </button>
          )}
        </div>
      )}

      {/* Footer Feature Highlights */}
      {footerPills && footerPills.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-3 pt-3.5 border-t border-hairline text-[11px] font-mono text-muted">
          {footerPills.map((pill, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              {pill.icon}
              <span>{pill.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
