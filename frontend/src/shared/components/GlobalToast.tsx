import React from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { CheckCircle2, Info, AlertTriangle, AlertCircle, X } from 'lucide-react'
import type { ToastNotification } from '@/shared/types/workspace'

interface GlobalToastProps {
  toasts: ToastNotification[]
  onDismiss: (id: string) => void
}

export const GlobalToast: React.FC<GlobalToastProps> = ({ toasts, onDismiss }) => {
  const getIcon = (type: ToastNotification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={16} className="text-semantic-success shrink-0" />
      case 'info':
        return <Info size={16} className="text-primary shrink-0" />
      case 'warning':
        return <AlertTriangle size={16} className="text-[#f59e0b] shrink-0" />
      case 'error':
        return <AlertCircle size={16} className="text-semantic-error shrink-0" />
      default:
        return <CheckCircle2 size={16} className="text-semantic-success shrink-0" />
    }
  }

  const getBorderColor = (type: ToastNotification['type']) => {
    switch (type) {
      case 'success':
        return 'border-semantic-success/30'
      case 'info':
        return 'border-primary/30'
      case 'warning':
        return 'border-[#f59e0b]/30'
      case 'error':
        return 'border-semantic-error/30'
      default:
        return 'border-hairline'
    }
  }

  return (
    <div className="fixed top-5 right-6 z-50 flex flex-col gap-2.5 pointer-events-none max-w-sm sm:max-w-md w-full">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -16, scale: 0.94, x: 20 }}
            animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
            exit={{ opacity: 0, y: -10, scale: 0.94, x: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`pointer-events-auto bg-surface-card/95 backdrop-blur-md text-ink px-3.5 py-2.5 rounded-xl shadow-lg border ${getBorderColor(
              t.type
            )} flex items-center justify-between gap-3 text-xs font-sans group`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {getIcon(t.type)}
              <span className="leading-snug font-medium truncate sm:whitespace-normal">
                {t.message}
              </span>
            </div>

            <button
              type="button"
              onClick={() => onDismiss(t.id)}
              className="text-muted hover:text-ink p-1 rounded-md hover:bg-canvas-soft transition-colors cursor-pointer shrink-0"
              title="Dismiss"
            >
              <X size={13} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
