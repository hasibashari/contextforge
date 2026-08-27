import React, { forwardRef } from 'react'
import { RefreshCw } from 'lucide-react'
import { cn } from '@/shared/utils/cn'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'dark' | 'purple'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'icon'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'sm',
      isLoading = false,
      leftIcon,
      rightIcon,
      className,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const variantClasses = {
      primary:
        'bg-primary hover:bg-primary-hover active:bg-primary-active text-on-primary font-semibold shadow-xs hover:shadow-sm disabled:opacity-50',
      secondary:
        'bg-surface-strong hover:bg-canvas text-ink border border-hairline hover:border-hairline-strong shadow-2xs disabled:opacity-50',
      outline:
        'bg-surface-card hover:bg-surface-strong text-ink border border-hairline hover:border-hairline-strong shadow-2xs disabled:opacity-50',
      ghost:
        'bg-transparent hover:bg-surface-strong text-muted hover:text-ink disabled:opacity-50',
      danger:
        'bg-semantic-error-soft hover:bg-semantic-error/20 text-semantic-error border border-semantic-error/30 font-semibold disabled:opacity-50',
      success:
        'bg-semantic-success-soft hover:bg-semantic-success/20 text-semantic-success border border-semantic-success/30 font-semibold disabled:opacity-50',
      dark:
        'bg-ink hover:bg-ink-secondary active:bg-black text-canvas font-semibold shadow-xs disabled:opacity-50',
      purple:
        'bg-[#7c3aed] hover:bg-[#6d28d9] active:bg-[#5b21b6] text-white font-semibold shadow-xs disabled:opacity-50',
    }

    const sizeClasses = {
      xs: 'px-2.5 py-1 text-[11px] rounded-lg gap-1',
      sm: 'px-3.5 py-1.5 text-xs rounded-xl gap-1.5 font-medium',
      md: 'px-4 py-2 text-xs sm:text-sm rounded-xl gap-2 font-medium',
      lg: 'px-5 py-2.5 text-sm rounded-2xl gap-2 font-medium',
      icon: 'w-8 h-8 p-0 rounded-xl flex items-center justify-center',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center transition-all cursor-pointer select-none font-sans outline-none focus-visible:ring-2 focus-visible:ring-primary/40 active:scale-[0.98]',
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {isLoading ? (
          <RefreshCw size={size === 'xs' ? 11 : 13} className="animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        {children}
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    )
  },
)

Button.displayName = 'Button'
