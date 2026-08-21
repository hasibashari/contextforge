import React from 'react'
import { cn } from '@/shared/utils/cn'

export interface BadgeProps {
  variant?:
    | 'neutral'
    | 'primary'
    | 'success'
    | 'warning'
    | 'error'
    | 'purple'
    | 'blue'
    | 'mono'
  size?: 'xs' | 'sm'
  icon?: React.ReactNode
  className?: string
  children: React.ReactNode
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'xs',
  icon,
  className,
  children,
}) => {
  const variantClasses = {
    neutral: 'bg-surface-strong text-muted',
    primary: 'bg-primary/10 text-primary',
    success: 'bg-semantic-success/15 text-semantic-success',
    warning: 'bg-[#f59e0b]/15 text-[#f59e0b]',
    error: 'bg-semantic-error/15 text-semantic-error',
    purple: 'bg-[#7c3aed]/15 text-[#7c3aed]',
    blue: 'bg-[#3b6ea5]/15 text-[#3b6ea5]',
    mono: 'bg-canvas-soft border border-hairline text-ink font-mono',
  }

  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5 rounded font-semibold',
    sm: 'text-[11px] px-2 py-0.5 rounded-md font-medium',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 leading-none select-none font-sans',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  )
}
