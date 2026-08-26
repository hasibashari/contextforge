import React, { useState, forwardRef } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/shared/utils/cn'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'mono'
  inputSize?: 'sm' | 'md'
  leftIcon?: React.ReactNode
  rightAction?: React.ReactNode
  allowToggleVisibility?: boolean
  error?: string | boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      variant = 'default',
      inputSize = 'sm',
      leftIcon,
      rightAction,
      allowToggleVisibility = false,
      type = 'text',
      error,
      className,
      disabled,
      ...props
    },
    ref,
  ) => {
    const [showPassword, setShowPassword] = useState(false)
    const isPasswordType = type === 'password'
    const computedType = isPasswordType && showPassword ? 'text' : type

    const sizeClasses = {
      sm: 'px-2.5 py-1.5 text-xs rounded-lg',
      md: 'px-3 py-2 text-xs sm:text-sm rounded-lg',
    }

    return (
      <div className="relative w-full flex items-center">
        {leftIcon && (
          <div className="absolute left-2.5 flex items-center pointer-events-none text-muted">
            {leftIcon}
          </div>
        )}

        <input
          ref={ref}
          type={computedType}
          disabled={disabled}
          className={cn(
            'w-full bg-canvas border border-hairline text-ink placeholder:text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50 disabled:bg-canvas-soft shadow-2xs',
            variant === 'mono' ? 'font-mono' : 'font-sans',
            sizeClasses[inputSize],
            leftIcon ? 'pl-8' : '',
            allowToggleVisibility || rightAction ? 'pr-9' : '',
            error ? 'border-semantic-error focus:border-semantic-error focus:ring-semantic-error/20' : '',
            className,
          )}
          {...props}
        />

        {allowToggleVisibility && isPasswordType && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2.5 p-1 text-muted hover:text-ink cursor-pointer transition-colors"
            title={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
        )}

        {!allowToggleVisibility && rightAction && (
          <div className="absolute right-2.5 flex items-center">{rightAction}</div>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'
