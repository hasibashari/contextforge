import {
  Menu,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react'
import { useWorkspace } from '@/shared/context'

interface DashboardHeaderProps {
  onOpenMobileMenu: () => void
  isAsideOpen?: boolean
  onToggleAside?: () => void
}

export default function DashboardHeader({
  onOpenMobileMenu,
  isAsideOpen = true,
  onToggleAside,
}: DashboardHeaderProps) {
  const { activeSession } = useWorkspace()

  return (
    <header className="h-14 bg-canvas border-b border-hairline px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30 shrink-0">
      <div className="flex items-center gap-3 truncate">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-1.5 rounded-md hover:bg-surface-card border border-hairline text-ink cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu size={18} />
        </button>

        {/* Current Active Chat Title */}
        <div className="flex items-center gap-2 truncate">
          <span className="font-semibold text-ink text-xs sm:text-sm truncate">
            {activeSession?.title || 'ContextForge AI Workspace'}
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Aside Inspector Toggle */}
        {onToggleAside && (
          <button
            onClick={onToggleAside}
            title={isAsideOpen ? 'Close Document Panel' : 'Open Document Panel'}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer hidden md:flex ${
              isAsideOpen
                ? 'bg-surface-strong border-hairline text-primary'
                : 'bg-canvas-soft border-hairline text-muted hover:text-ink'
            }`}
            aria-label="Toggle Document Panel"
          >
            {isAsideOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
          </button>
        )}
      </div>
    </header>
  )
}
