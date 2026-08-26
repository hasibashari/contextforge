import {
  Menu,
  PanelRightClose,
  PanelRightOpen,
  RotateCcw,
} from 'lucide-react'
import { useWorkspace } from '@/shared'

interface WorkspaceHeaderProps {
  onOpenMobileMenu: () => void
  isAsideOpen?: boolean
  onToggleAside?: () => void
}

export default function WorkspaceHeader({
  onOpenMobileMenu,
  isAsideOpen = true,
  onToggleAside,
}: WorkspaceHeaderProps) {
  const { activeSession, resetDemoSession } = useWorkspace()

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
        {/* Hackathon Demo Mode Badge & Reset Action */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary-soft/60 border border-primary-subtle text-primary text-[11px] font-medium font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span>Hackathon Demo</span>
          </div>

          <button
            onClick={() => void resetDemoSession()}
            title="Reset demo session and start fresh"
            type="button"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-card hover:bg-canvas-soft border border-hairline hover:border-hairline-strong text-muted hover:text-ink text-xs font-medium transition-all duration-150 cursor-pointer shadow-2xs"
          >
            <RotateCcw size={13} className="shrink-0" />
            <span>Reset Demo</span>
          </button>
        </div>

        {/* Aside Inspector Toggle */}
        {onToggleAside && (
          <button
            onClick={onToggleAside}
            title={isAsideOpen ? 'Close Document Panel' : 'Open Document Panel'}
            className={`p-1.5 rounded-xl border transition-colors cursor-pointer hidden md:flex ${
              isAsideOpen
                ? 'bg-primary-soft border-primary-subtle text-primary shadow-2xs'
                : 'bg-surface-card border-hairline text-muted hover:text-ink hover:border-hairline-strong'
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
