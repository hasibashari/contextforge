import React, { forwardRef } from 'react'
import { cn } from '@/shared/utils/cn'

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: 'default' | 'mono'
  error?: string | boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      variant = 'default',
      error,
      className,
      disabled,
      rows = 3,
      ...props
    },
    ref,
  ) => {
    return (
      <textarea
        ref={ref}
        rows={rows}
        disabled={disabled}
        className={cn(
          'w-full bg-canvas border border-hairline rounded-lg text-ink placeholder:text-muted focus:outline-none focus:border-primary px-3 py-2 text-xs transition-colors leading-relaxed disabled:opacity-50 disabled:bg-canvas-soft shadow-2xs resize-y',
          variant === 'mono' ? 'font-mono' : 'font-sans',
          error ? 'border-semantic-error focus:border-semantic-error' : '',
          className,
        )}
        {...props}
      />
    )
  },
)

Textarea.displayName = 'Textarea'
