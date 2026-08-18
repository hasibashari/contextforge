import {
  Menu,
  PanelRightClose,
  PanelRightOpen,
  Sparkles,
  BookOpen,
  Globe,
  Calendar,
} from 'lucide-react'
import { useWorkspace } from '@/shared/mock'

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
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface-strong text-muted shrink-0">
            <Sparkles size={10} className="text-primary" />
            <span>Autonomous Mode</span>
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Connected Services Pills */}
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full bg-canvas-soft border border-hairline text-[11px] font-mono text-muted">
          <div className="flex items-center gap-1 text-primary">
            <BookOpen size={11} />
            <span>Obsidian</span>
          </div>
          <span className="text-hairline-strong">·</span>
          <div className="flex items-center gap-1 text-semantic-success">
            <Calendar size={11} />
            <span>Calendar</span>
          </div>
          <span className="text-hairline-strong">·</span>
          <div className="flex items-center gap-1 text-[#3b6ea5]">
            <Globe size={11} />
            <span>Web</span>
          </div>
        </div>

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
