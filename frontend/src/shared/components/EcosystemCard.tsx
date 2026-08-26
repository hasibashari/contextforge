import React from 'react'
import { CheckCircle2, Plus } from 'lucide-react'

export interface EcosystemCardProps {
  icon: React.ReactNode
  title: string
  subtitle?: string
  description: string
  metaLine?: string | React.ReactNode
  badge?: string
  badgeVariant?: 'primary' | 'success' | 'warning' | 'neutral'
  actionIcon?: React.ReactNode | null
  hideAction?: boolean
  onClick: () => void
  onActionClick?: () => void
  actionTooltip?: string
}

export const EcosystemCard: React.FC<EcosystemCardProps> = ({
  icon,
  title,
  subtitle,
  description,
  metaLine,
  badge,
  badgeVariant = 'primary',
  actionIcon,
  hideAction = false,
  onClick,
  onActionClick,
  actionTooltip = 'View details & options',
}) => {
  const getBadgeStyle = () => {
    switch (badgeVariant) {
      case 'success':
        return 'bg-semantic-success/10 text-semantic-success border-semantic-success/20'
      case 'warning':
        return 'bg-semantic-warning/10 text-semantic-warning border-semantic-warning/20'
      case 'neutral':
        return 'bg-canvas-soft text-muted border-hairline'
      case 'primary':
      default:
        return 'bg-primary-soft text-primary border-primary-subtle'
    }
  }

  return (
    <div
      onClick={onClick}
      className="bg-surface-card border border-hairline hover:border-primary/40 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-3 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer select-none min-h-32"
    >
      {/* Top Header: Icon + Title + Badge (left), Action Button (right) */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* App Icon Inline with Title */}
          <div className="shrink-0">{icon}</div>

          {/* Title & Badges */}
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
              <h3 className="text-sm sm:text-base font-semibold text-ink leading-tight font-sans truncate">
                {title}
              </h3>
              <CheckCircle2
                size={14}
                className="text-semantic-success shrink-0"
              />
              {badge && (
                <span className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border font-semibold ${getBadgeStyle()}`}>
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <div className="text-[11px] font-mono text-muted truncate pt-0.5">
                {subtitle}
              </div>
            )}
          </div>
        </div>

        {/* Action Button (Optional) */}
        {!hideAction && actionIcon !== null && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              if (onActionClick) {
                onActionClick()
              } else {
                onClick()
              }
            }}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-canvas-soft hover:bg-canvas border border-hairline hover:border-hairline-strong text-muted hover:text-ink flex items-center justify-center transition-all duration-150 cursor-pointer shadow-2xs shrink-0"
            title={actionTooltip}
          >
            {actionIcon || <Plus size={15} />}
          </button>
        )}
      </div>

      {/* Description */}
      <p className="text-xs text-body font-sans leading-relaxed line-clamp-2">
        {description}
      </p>

      {/* Meta Line Footer */}
      {metaLine && (
        <div className="flex items-center gap-2 text-[10px] sm:text-[11px] font-mono text-muted pt-2.5 border-t border-hairline/60 flex-wrap">
          {metaLine}
        </div>
      )}
    </div>
  )
}
