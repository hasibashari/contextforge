import {
  Terminal,
  LayoutDashboard,
  Bot,
  FileCheck2,
  Database,
  Cpu,
  Settings,
  ChevronDown,
  ShieldCheck,
  ArrowLeft,
  Sparkles,
} from 'lucide-react'
import { Link } from 'react-router-dom'

export type DashboardTab = 'overview' | 'agents' | 'action-plans' | 'sources' | 'mcp' | 'settings'

interface DashboardSidebarProps {
  activeTab: DashboardTab
  onTabChange: (tab: DashboardTab) => void
  isMobileOpen?: boolean
  onCloseMobile?: () => void
}

const NAV_ITEMS: { id: DashboardTab; label: string; icon: typeof LayoutDashboard; badge?: string }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'agents', label: 'Agent Runs', icon: Bot, badge: '2 Active' },
  { id: 'action-plans', label: 'Action Plans', icon: FileCheck2, badge: '3 Ready' },
  { id: 'sources', label: 'Context Sources', icon: Database },
  { id: 'mcp', label: 'MCP & Tools', icon: Cpu },
  { id: 'settings', label: 'Settings & Models', icon: Settings },
]

export default function DashboardSidebar({
  activeTab,
  onTabChange,
  isMobileOpen,
  onCloseMobile,
}: DashboardSidebarProps) {
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
              App
            </span>
          </div>

          <button className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md bg-surface-card border border-hairline hover:border-hairline-strong transition-colors text-left cursor-pointer">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-4 h-4 rounded bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                A
              </div>
              <div className="truncate">
                <div className="text-xs font-medium text-ink truncate">Acme Platform Org</div>
                <div className="text-[10px] text-muted truncate">production-cluster</div>
              </div>
            </div>
            <ChevronDown size={14} className="text-muted shrink-0" />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-caption text-muted">
            Workspace
          </div>

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id

            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id)
                  if (onCloseMobile) onCloseMobile()
                }}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-xs font-medium transition-all cursor-pointer ${
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
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      isActive
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-strong text-body'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}

          <div className="pt-4 px-2 py-1 text-[10px] font-mono uppercase tracking-caption text-muted">
            Safety & System
          </div>

          <div className="px-2.5 py-2 rounded-md bg-canvas-soft border border-hairline space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-ink">
              <ShieldCheck size={14} className="text-semantic-success" />
              <span>HITL Approval Gate</span>
            </div>
            <p className="text-[11px] text-muted leading-tight">
              Agent cannot push code or merge PRs without human confirmation.
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
