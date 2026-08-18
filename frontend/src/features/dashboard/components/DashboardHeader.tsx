import {
  Search,
  Plus,
  Bell,
  Menu,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react'

interface DashboardHeaderProps {
  onOpenMobileMenu: () => void
  onNewTaskClick: () => void
  isAsideOpen?: boolean
  onToggleAside?: () => void
}

export default function DashboardHeader({
  onOpenMobileMenu,
  onNewTaskClick,
  isAsideOpen = true,
  onToggleAside,
}: DashboardHeaderProps) {
  return (
    <header className="h-16 bg-canvas border-b border-hairline px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30 shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-md hover:bg-surface-card border border-hairline text-ink cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu size={18} />
        </button>

        {/* Global Search Bar */}
        <div className="relative hidden sm:block w-72 md:w-96">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search agents, repos, action plans... (⌘K)"
            className="w-full pl-9 pr-4 py-1.5 bg-surface-card border border-hairline rounded-md text-xs text-ink placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5">
        {/* Status indicator */}
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full bg-canvas-soft border border-hairline text-xs font-mono text-ink">
          <span className="w-2 h-2 rounded-full bg-semantic-success animate-pulse" />
          <span className="text-[11px]">Grounded: 99.4%</span>
        </div>

        {/* Notification / Feed toggle */}
        <button className="p-2 rounded-md hover:bg-surface-card border border-hairline text-body hover:text-ink relative transition-colors cursor-pointer">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
        </button>

        {/* Aside Inspector Toggle */}
        {onToggleAside && (
          <button
            onClick={onToggleAside}
            title={isAsideOpen ? 'Hide Context Inspector' : 'Show Context Inspector'}
            className="p-2 rounded-md hover:bg-surface-card border border-hairline text-body hover:text-ink transition-colors cursor-pointer hidden md:flex"
            aria-label="Toggle Context Inspector"
          >
            {isAsideOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
          </button>
        )}

        {/* New Agent Task Action */}
        <button
          onClick={onNewTaskClick}
          className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary-active text-on-primary text-xs font-medium px-3.5 py-2 rounded-md transition-colors shadow-xs cursor-pointer"
        >
          <Plus size={14} />
          <span className="hidden sm:inline">New Task</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>
    </header>
  )
}
