import React, { forwardRef } from 'react'
import { cn } from '@/shared/utils/cn'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ hoverable = false, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'p-3.5 bg-surface-card rounded-xl border border-hairline shadow-2xs transition-all space-y-2',
          hoverable && 'hover:border-hairline-strong hover:shadow-xs cursor-pointer',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    )
  },
)
Card.displayName = 'Card'

export const CardHeader = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('flex items-start justify-between gap-2', className)}
      {...props}
    >
      {children}
    </div>
  )
})
CardHeader.displayName = 'CardHeader'

export const CardTitle = forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...props }, ref) => {
  return (
    <h3
      ref={ref}
      className={cn('font-semibold text-ink text-xs sm:text-sm leading-snug', className)}
      {...props}
    >
      {children}
    </h3>
  )
})
CardTitle.displayName = 'CardTitle'

export const CardContent = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div ref={ref} className={cn('text-xs text-body leading-relaxed', className)} {...props}>
      {children}
    </div>
  )
})
CardContent.displayName = 'CardContent'

export const CardFooter = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'pt-2 border-t border-hairline flex items-center justify-between gap-2',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
})
CardFooter.displayName = 'CardFooter'
