import {
  Terminal,
  LayoutDashboard,
  CheckSquare,
  Bot,
  Database,
  Cpu,
  Activity,
  Settings,
  ShieldCheck,
  ArrowLeft,
  Sparkles,
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useWorkspace } from '../../../shared/mock'

interface DashboardSidebarProps {
  isMobileOpen?: boolean
  onCloseMobile?: () => void
}

export default function DashboardSidebar({
  isMobileOpen,
  onCloseMobile,
}: DashboardSidebarProps) {
  const location = useLocation()
  const { tasks, agents, knowledgeSources, integrations } = useWorkspace()

  const pendingApprovalCount = tasks.filter((t) => t.status === 'waiting_approval').length

  const NAV_ITEMS = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      path: '/tasks',
      label: 'Tasks',
      icon: CheckSquare,
      badge: pendingApprovalCount > 0 ? `${pendingApprovalCount} Review` : undefined,
      badgeColor: 'bg-primary text-on-primary',
    },
    {
      path: '/agents',
      label: 'Agents',
      icon: Bot,
      badge: `${agents.length}`,
      badgeColor: 'bg-surface-strong text-body',
    },
    {
      path: '/knowledge',
      label: 'Knowledge',
      icon: Database,
      badge: `${knowledgeSources.length}`,
      badgeColor: 'bg-surface-strong text-body',
    },
    {
      path: '/integrations',
      label: 'Integrations',
      icon: Cpu,
      badge: `${integrations.length} MCP`,
      badgeColor: 'bg-surface-strong text-body',
    },
    { path: '/activity', label: 'Activity', icon: Activity },
    { path: '/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-ink/20 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-canvas border-r border-hairline flex flex-col transition-transform duration-200 lg:static lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Workspace Brand & Switcher */}
        <div className="p-4 border-b border-hairline">
          <div className="flex items-center justify-between gap-2 mb-3">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-7 h-7 rounded-md bg-ink flex items-center justify-center text-canvas group-hover:bg-primary transition-colors">
                <Terminal size={15} strokeWidth={2.2} />
              </div>
              <span className="text-sm font-semibold tracking-tight text-ink">
                Context<span className="text-primary">Forge</span>
              </span>
            </Link>
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-surface-strong text-muted">
              Workspace
            </span>
          </div>

          <div className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md bg-surface-card border border-hairline text-left">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-4 h-4 rounded bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold font-mono">
                A
              </div>
              <div className="truncate">
                <div className="text-xs font-medium text-ink truncate">Acme Platform Org</div>
                <div className="text-[10px] text-muted font-mono truncate">production-cluster</div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-caption text-muted">
            Workspace Nav
          </div>

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive =
              location.pathname === item.path ||
              (item.path === '/tasks' && location.pathname.startsWith('/tasks'))

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-ink text-canvas shadow-xs font-semibold'
                    : 'text-body hover:text-ink hover:bg-surface-card'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon size={16} className={isActive ? 'text-primary' : 'text-muted'} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                      isActive ? 'bg-primary text-on-primary' : item.badgeColor
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}

          <div className="pt-4 px-2 py-1 text-[10px] font-mono uppercase tracking-caption text-muted">
            Safety & Guardrails
          </div>

          <div className="px-2.5 py-2 rounded-lg bg-canvas-soft border border-hairline space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-ink">
              <ShieldCheck size={14} className="text-semantic-success" />
              <span>HITL Approval Gate</span>
            </div>
            <p className="text-[11px] text-muted leading-tight">
              Agents require human confirmation before dispatching pull requests.
            </p>
          </div>
        </nav>

        {/* Bottom Bar: Back to Landing Page & User Profile */}
        <div className="p-3 border-t border-hairline space-y-2 bg-canvas-soft">
          <Link
            to="/"
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium text-muted hover:text-ink hover:bg-surface-card transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to Landing Page</span>
          </Link>

          <div className="flex items-center justify-between pt-2 border-t border-hairline-soft px-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary/15 text-primary flex items-center justify-center font-mono text-xs font-bold">
                CF
              </div>
              <div>
                <div className="text-xs font-medium text-ink">Lead Architect</div>
                <div className="text-[10px] text-muted">Enterprise Tier</div>
              </div>
            </div>
            <Sparkles size={14} className="text-primary" />
          </div>
        </div>
      </aside>
    </>
  )
}
