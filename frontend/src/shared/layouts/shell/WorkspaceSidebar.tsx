import { useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Terminal,
  MessageSquare,
  Bot,
  Target,
  Cpu,
  Zap,
  Settings,
  ShieldCheck,
  ArrowLeft,
  Sparkles,
  Plus,
  BookOpen,
  Trash2,
  MoreVertical,
  Edit2,
  Check,
  X,
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useWorkspace } from '@/shared'

interface WorkspaceSidebarProps {
  isMobileOpen?: boolean
  onCloseMobile?: () => void
}

export default function WorkspaceSidebar({
  isMobileOpen,
  onCloseMobile,
}: WorkspaceSidebarProps) {
  const location = useLocation()
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [menuAnchor, setMenuAnchor] = useState<{
    top: number
    right: number
    sessionId: string
    sessionTitle: string
  } | null>(null)

  const {
    agents,
    knowledgeSources,
    integrations,
    activeAutomationsCount,
    chatSessions,
    activeSessionId,
    switchChatSession,
    createNewChatSession,
    renameChatSession,
    deleteChatSession,
  } = useWorkspace()

  const NAV_ITEMS = [
    { path: '/dashboard', label: 'Workspace Chat', icon: MessageSquare },
    {
      path: '/goals',
      label: 'Goals & Habits',
      icon: Target,
      badge: 'Active',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20',
    },
    {
      path: '/agents',
      label: 'Agents & Skills',
      icon: Bot,
      badge: `${agents.length}`,
      badgeColor: 'bg-canvas-soft text-muted border border-hairline',
    },
    {
      path: '/knowledge',
      label: 'Knowledge Base (RAG)',
      icon: BookOpen,
      badge: `${knowledgeSources.length}`,
      badgeColor: 'bg-canvas-soft text-muted border border-hairline',
    },
    {
      path: '/integrations',
      label: 'MCP Protocol Servers',
      icon: Cpu,
      badge: `${integrations.length}`,
      badgeColor: 'bg-primary-soft text-primary font-semibold border border-primary-subtle',
    },
    {
      path: '/automation',
      label: 'Automations & Tasks',
      icon: Zap,
      badge: `${activeAutomationsCount}`,
      badgeColor: 'bg-primary-soft text-primary font-semibold border border-primary-subtle',
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
            <Link to="/" className="flex items-center gap-2 group cursor-pointer">
              <div className="w-7 h-7 rounded-md bg-ink flex items-center justify-center text-canvas group-hover:bg-primary transition-colors">
                <Terminal size={15} strokeWidth={2.2} />
              </div>
              <span className="text-sm font-semibold tracking-tight text-ink font-sans">
                Context<span className="text-primary">Forge</span>
              </span>
            </Link>
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-surface-card text-muted border border-hairline">
              AI OS
            </span>
          </div>

          {/* New Chat Primary Button */}
          <button
            type="button"
            onClick={() => {
              createNewChatSession()
              onCloseMobile?.()
            }}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-primary hover:bg-primary-active text-on-primary text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus size={14} />
            <span>New Chat</span>
          </button>
        </div>

        {/* Navigation & Chat Sessions List */}
        <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
          {/* Main Navigation */}
          <div className="space-y-1">
            <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-caption text-muted font-semibold">
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
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                    isActive
                      ? 'bg-primary-soft text-primary shadow-2xs font-semibold border border-primary-subtle'
                      : 'text-body hover:text-ink hover:bg-surface-card border border-transparent font-medium'
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
            <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-caption text-muted font-semibold">
              Chat Sessions
            </div>

            <div className="space-y-1 max-h-52 overflow-y-auto pr-0.5">
              {chatSessions.map((session) => {
                const isCurrent =
                  session.id === activeSessionId &&
                  (location.pathname === '/dashboard' || location.pathname === '/chat')
                const isEditing = editingSessionId === session.id

                return (
                  <div
                    key={session.id}
                    className={`group relative flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                      isCurrent
                        ? 'bg-surface-strong text-ink font-medium border border-hairline'
                        : 'text-muted hover:text-ink hover:bg-surface-card'
                    }`}
                  >
                    {isEditing ? (
                      <div className="flex items-center gap-1 flex-1 min-w-0">
                        <input
                          type="text"
                          autoFocus
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              if (editingTitle.trim()) {
                                renameChatSession(session.id, editingTitle.trim())
                              }
                              setEditingSessionId(null)
                            }
                            if (e.key === 'Escape') setEditingSessionId(null)
                          }}
                          className="flex-1 min-w-0 bg-canvas border border-primary px-2 py-0.5 rounded text-xs text-ink focus:outline-hidden font-sans"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (editingTitle.trim()) {
                              renameChatSession(session.id, editingTitle.trim())
                            }
                            setEditingSessionId(null)
                          }}
                          className="p-1 rounded text-semantic-success hover:bg-semantic-success/15 transition-colors cursor-pointer"
                          title="Save title (Enter)"
                        >
                          <Check size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingSessionId(null)}
                          className="p-1 rounded text-muted hover:text-ink transition-colors cursor-pointer"
                          title="Cancel (Esc)"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Link
                          to="/dashboard"
                          onClick={() => {
                            switchChatSession(session.id)
                            onCloseMobile?.()
                          }}
                          className="flex items-center gap-2 truncate flex-1 min-w-0 py-0.5 cursor-pointer"
                        >
                          <MessageSquare
                            size={13}
                            className={`shrink-0 ${
                              isCurrent ? 'text-primary' : 'text-muted'
                            }`}
                          />
                          <span className="truncate">{session.title || 'Untitled Chat'}</span>
                        </Link>

                        {/* Context Menu Button (Three Dots) */}
                        <div className="relative shrink-0">
                          <button
                            type="button"
                            title="Chat options (Rename, Delete)"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              if (menuAnchor?.sessionId === session.id) {
                                setMenuAnchor(null)
                              } else {
                                const rect = e.currentTarget.getBoundingClientRect()
                                setMenuAnchor({
                                  top: rect.bottom + 4,
                                  right: window.innerWidth - rect.right,
                                  sessionId: session.id,
                                  sessionTitle: session.title,
                                })
                              }
                            }}
                            className={`p-1 rounded-md transition-all cursor-pointer ${
                              menuAnchor?.sessionId === session.id
                                ? 'opacity-100 bg-surface-strong text-ink shadow-2xs'
                                : isCurrent
                                  ? 'opacity-80 hover:opacity-100 text-ink hover:bg-surface-card'
                                  : 'opacity-40 hover:opacity-100 group-hover:opacity-80 text-muted hover:text-ink hover:bg-surface-strong'
                            }`}
                            aria-label="Chat session options"
                          >
                            <MoreVertical size={13} />
                          </button>
                        </div>
                      </>
                    )}
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
              Obsidian Vault, Calendar, Android MCP, and Web Search connected seamlessly behind the scenes.
            </p>
          </div>
        </nav>

        {/* Bottom Bar: Back to Landing Page & User Profile */}
        <div className="p-3 border-t border-hairline space-y-2 bg-canvas-soft">
          <Link
            to="/"
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium text-muted hover:text-ink hover:bg-surface-card transition-colors cursor-pointer"
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

      {/* Global Three-Dots Floating Dropdown Portal (Guaranteed No Clipping) */}
      {menuAnchor &&
        typeof document !== 'undefined' &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-9998 bg-transparent"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setMenuAnchor(null)
              }}
            />
            <div
              style={{
                position: 'fixed',
                top: `${menuAnchor.top}px`,
                right: `${menuAnchor.right}px`,
              }}
              className="w-36 rounded-lg bg-surface-card border border-hairline shadow-2xl py-1 z-9999 space-y-0.5 animate-in fade-in zoom-in-95 duration-100 backdrop-blur-md"
            >
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setEditingSessionId(menuAnchor.sessionId)
                  setEditingTitle(menuAnchor.sessionTitle)
                  setMenuAnchor(null)
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-ink hover:bg-surface-strong text-left cursor-pointer transition-colors"
              >
                <Edit2 size={12} className="text-muted" />
                <span>Rename</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  const targetId = menuAnchor.sessionId
                  setMenuAnchor(null)
                  void deleteChatSession(targetId)
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-semantic-error hover:bg-semantic-error/15 text-left cursor-pointer transition-colors"
              >
                <Trash2 size={12} />
                <span>Delete</span>
              </button>
            </div>
          </>,
          document.body,
        )}
    </>
  )
}
