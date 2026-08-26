import React, { forwardRef } from 'react'
import { cn } from '@/shared/utils/cn'

export interface SelectOption {
  label: string
  value: string
  disabled?: boolean
}

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  variant?: 'default' | 'mono'
  selectSize?: 'sm' | 'md'
  options?: SelectOption[]
  error?: string | boolean
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      variant = 'default',
      selectSize = 'sm',
      options,
      error,
      className,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const sizeClasses = {
      sm: 'px-2.5 py-1.5 text-xs rounded-lg',
      md: 'px-3 py-2 text-xs sm:text-sm rounded-lg',
    }

    return (
      <select
        ref={ref}
        disabled={disabled}
        className={cn(
          'w-full bg-canvas border border-hairline text-ink focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer disabled:opacity-50 disabled:bg-canvas-soft shadow-2xs',
          variant === 'mono' ? 'font-mono' : 'font-sans',
          sizeClasses[selectSize],
          error ? 'border-semantic-error focus:border-semantic-error focus:ring-semantic-error/20' : '',
          className,
        )}
        {...props}
      >
        {options
          ? options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))
          : children}
      </select>
    )
  },
)

Select.displayName = 'Select'
