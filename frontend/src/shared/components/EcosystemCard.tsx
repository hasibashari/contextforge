import React from 'react'
import { CheckCircle2, Plus } from 'lucide-react'

export interface EcosystemCardProps {
  icon: React.ReactNode
  title: string
  description: string
  metaLine?: string | React.ReactNode
  badge?: string
  actionIcon?: React.ReactNode
  onClick: () => void
  onActionClick?: () => void
  actionTooltip?: string
}

export const EcosystemCard: React.FC<EcosystemCardProps> = ({
  icon,
  title,
  description,
  metaLine,
  badge,
  actionIcon,
  onClick,
  onActionClick,
  actionTooltip = 'View details & options',
}) => {
  return (
    <div
      onClick={onClick}
      className="bg-surface-card border border-hairline hover:border-hairline-strong rounded-2xl p-5 flex flex-col justify-between gap-3 shadow-2xs hover:shadow-xs transition-colors duration-150 cursor-pointer select-none min-h-32.5"
    >
      {/* Top Header: Icon + Title + Badge (left), Action Button (right) */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* App Icon Inline with Title */}
          <div className="shrink-0">{icon}</div>

          {/* Title & Badges */}
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <h3 className="text-sm sm:text-base font-semibold text-ink leading-tight truncate">
              {title}
            </h3>
            <CheckCircle2
              size={15}
              className="text-primary/70 shrink-0 fill-primary/10"
            />
            {badge && (
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20 font-semibold">
                {badge}
              </span>
            )}
          </div>
        </div>

        {/* Action Button (Plus or Settings) - Hover effects only active on button hover */}
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
          className="w-8 h-8 rounded-xl bg-canvas-soft hover:bg-surface-strong border border-hairline hover:border-hairline-strong text-muted hover:text-ink flex items-center justify-center transition-all duration-150 cursor-pointer shadow-2xs shrink-0"
          title={actionTooltip}
        >
          {actionIcon || <Plus size={16} />}
        </button>
      </div>

      {/* Description - Spans full width aligned with left margin */}
      <p className="text-xs text-body leading-relaxed line-clamp-2">
        {description}
      </p>

      {/* Meta Line Footer */}
      {metaLine && (
        <div className="flex items-center gap-2 text-[10px] font-mono text-muted pt-2 border-t border-hairline/60">
          {metaLine}
        </div>
      )}
    </div>
  )
}
