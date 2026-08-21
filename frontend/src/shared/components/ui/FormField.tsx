import React from 'react'
import { cn } from '@/shared/utils/cn'

export interface FormFieldProps {
  label?: React.ReactNode
  badge?: React.ReactNode
  hint?: React.ReactNode
  error?: React.ReactNode
  required?: boolean
  className?: string
  children: React.ReactNode
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  badge,
  hint,
  error,
  required,
  className,
  children,
}) => {
  return (
    <div className={cn('space-y-1 text-xs', className)}>
      {(label || badge) && (
        <div className="flex items-center justify-between gap-2 text-ink font-semibold">
          <label className="flex items-center gap-1">
            <span>{label}</span>
            {required && <span className="text-primary">*</span>}
          </label>
          {badge && <span className="shrink-0 text-[10px] font-normal">{badge}</span>}
        </div>
      )}

      {children}

      {hint && !error && (
        <p className="text-[11px] text-muted leading-tight">{hint}</p>
      )}

      {error && (
        <p className="text-[11px] text-semantic-error leading-tight font-medium">
          {error}
        </p>
      )}
    </div>
  )
}
