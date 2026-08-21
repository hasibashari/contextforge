import React from 'react'
import { Sparkles } from 'lucide-react'
import { cn } from '@/shared/utils/cn'

export interface PageHeaderProps {
  eyebrow?: React.ReactNode
  eyebrowIcon?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  eyebrow,
  eyebrowIcon,
  title,
  description,
  actions,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface-card border border-hairline p-5 sm:p-6 rounded-xl sm:rounded-2xl shadow-xs',
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        {eyebrow && (
          <div className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-caption text-primary mb-1">
            {eyebrowIcon || <Sparkles size={13} />}
            <span>{eyebrow}</span>
          </div>
        )}
        <h1 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-xs sm:text-sm text-body mt-1 max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2 font-mono text-xs shrink-0 self-start lg:self-center">
          {actions}
        </div>
      )}
    </div>
  )
}
