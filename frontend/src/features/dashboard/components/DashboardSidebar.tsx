import {
  Terminal,
  MessageSquare,
  Bot,
  Cpu,
  Zap,
  Settings,
  ShieldCheck,
  ArrowLeft,
  Sparkles,
  Plus,
  BookOpen,
  Trash2,
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useWorkspace } from '@/shared/context'

interface DashboardSidebarProps {
  isMobileOpen?: boolean
  onCloseMobile?: () => void
}

export default function DashboardSidebar({
  isMobileOpen,
  onCloseMobile,
}: DashboardSidebarProps) {
  const location = useLocation()
  const {
    agents,
    knowledgeSources,
    integrations,
    activeAutomationsCount,
    chatSessions,
    activeSessionId,
    switchChatSession,
    createNewChatSession,
    deleteChatSession,
  } = useWorkspace()

  const NAV_ITEMS = [
    { path: '/dashboard', label: 'Workspace Chat', icon: MessageSquare },
    {
      path: '/agents',
      label: 'Agents & Personas',
      icon: Bot,
      badge: `${agents.length}`,
      badgeColor: 'bg-surface-strong text-body',
    },
    {
      path: '/knowledge',
      label: 'Knowledge Base (RAG)',
      icon: BookOpen,
      badge: `${knowledgeSources.length}`,
      badgeColor: 'bg-surface-strong text-body',
    },
    {
      path: '/integrations',
      label: 'MCP Servers & Skills',
      icon: Cpu,
      badge: `${integrations.length}`,
      badgeColor: 'bg-primary/10 text-primary font-semibold',
    },
    {
      path: '/automation',
      label: 'Automations & Tasks',
      icon: Zap,
      badge: `${activeAutomationsCount}`,
      badgeColor: 'bg-primary/10 text-primary font-semibold',
    },
    { path: '/settings', label: 'Settings & Memory', icon: Settings },
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
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 lg:w-80 bg-canvas border-r border-hairline flex flex-col transition-transform duration-200 lg:static lg:translate-x-0 ${
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
              AI OS
            </span>
          </div>

          {/* New Chat Primary Button */}
          <button
            onClick={() => {
              createNewChatSession()
              onCloseMobile?.()
            }}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary hover:bg-primary-active text-on-primary text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus size={14} />
            <span>New Chat</span>
          </button>
        </div>

        {/* Navigation & Chat Sessions List */}
        <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
          {/* Main Navigation */}
          <div className="space-y-1">
            <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-caption text-muted">
              Workspace Nav
            </div>

            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path

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
          </div>

          {/* Recent Chat History */}
          <div className="space-y-1 pt-2 border-t border-hairline">
            <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-caption text-muted flex items-center justify-between">
              <span>Chat Sessions</span>
              <span className="text-[10px] font-mono text-muted">{chatSessions.length}</span>
            </div>

            <div className="space-y-1">
              {chatSessions.map((session) => {
                const isCurrent =
                  session.id === activeSessionId &&
                  location.pathname === '/dashboard'

                return (
                  <div
                    key={session.id}
                    className={`group relative w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-all flex items-center justify-between gap-1.5 cursor-pointer ${
                      isCurrent
                        ? 'bg-surface-card text-ink font-semibold border border-hairline shadow-2xs'
                        : 'text-muted hover:text-ink hover:bg-surface-card'
                    }`}
                  >
                    <Link
                      to="/dashboard"
                      onClick={() => {
                        switchChatSession(session.id)
                        onCloseMobile?.()
                      }}
                      className="flex items-center gap-2 truncate flex-1 min-w-0 py-0.5"
                    >
                      <MessageSquare
                        size={13}
                        className={`shrink-0 ${
                          isCurrent ? 'text-primary' : 'text-muted'
                        }`}
                      />
                      <span className="truncate">{session.title}</span>
                    </Link>

                    {/* Delete Session Button on Hover */}
                    <button
                      type="button"
                      title="Delete chat session"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        deleteChatSession(session.id)
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted hover:text-semantic-error hover:bg-semantic-error/15 transition-all shrink-0 focus:opacity-100"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Safety & Grounding Badge */}
          <div className="px-2.5 py-2 rounded-lg bg-canvas-soft border border-hairline space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-ink">
              <ShieldCheck size={14} className="text-semantic-success" />
              <span>Multi-Source AI Engine</span>
            </div>
            <p className="text-[11px] text-muted leading-tight">
              Obsidian Vault, Calendar, and Web Search connected seamlessly behind the scenes.
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
            <span>Back to Home</span>
          </Link>

          <div className="flex items-center justify-between pt-2 border-t border-hairline-soft px-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary/15 text-primary flex items-center justify-center font-mono text-xs font-bold">
                CF
              </div>
              <div>
                <div className="text-xs font-medium text-ink">Lead Architect</div>
                <div className="text-[10px] text-muted font-mono">Auto-Agent Pro</div>
              </div>
            </div>
            <Sparkles size={14} className="text-primary" />
          </div>
        </div>
      </aside>
    </>
  )
}
