import { useState } from 'react'
import {
  MessageSquare,
  Bot,
  Cpu,
  Zap,
  Settings,
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
  const [openMenuSessionId, setOpenMenuSessionId] = useState<string | null>(null)

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
      path: '/agents',
      label: 'Agents & Skills',
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
      label: 'MCP Protocol Servers',
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
        {/* Workspace Brand & Header */}
        <div className="p-4 border-b border-hairline">
          <div className="flex items-center justify-between gap-2 mb-3">
            <Link
              to="/"
              className="flex items-center gap-2.5 group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-primary-contrast shadow-sm shadow-primary/20 group-hover:scale-105 transition-transform">
                <Sparkles size={16} />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm text-ink tracking-tight font-sans">
                  ContextForge
                </span>
                <span className="text-[10px] font-mono text-muted">
                  Agentic IDE v2.5
                </span>
              </div>
            </Link>

            <button
              onClick={() => {
                createNewChatSession()
                onCloseMobile?.()
              }}
              title="New Chat Session"
              className="p-1.5 rounded-lg bg-surface-card border border-hairline hover:border-primary/40 text-muted hover:text-ink transition-colors cursor-pointer"
            >
              <Plus size={15} />
            </button>
          </div>

          {/* Quick Chat Sessions Accordion */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-mono text-muted px-1">
              <span>ACTIVE THREADS</span>
              <span>{chatSessions.length}</span>
            </div>

            <div className="max-h-36 overflow-y-auto space-y-0.5 pr-1 font-sans">
              {chatSessions.map((session) => {
                const isActive = session.id === activeSessionId
                const isEditing = editingSessionId === session.id

                return (
                  <div
                    key={session.id}
                    className={`group relative flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary font-medium border border-primary/20'
                        : 'text-muted hover:text-ink hover:bg-surface-card'
                    }`}
                  >
                    {isEditing ? (
                      <div className="flex items-center gap-1 flex-1 min-w-0">
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              renameChatSession(session.id, editingTitle)
                              setEditingSessionId(null)
                            } else if (e.key === 'Escape') {
                              setEditingSessionId(null)
                            }
                          }}
                          autoFocus
                          className="w-full bg-canvas px-1.5 py-0.5 text-xs rounded border border-primary focus:outline-hidden text-ink font-sans"
                        />
                        <button
                          onClick={() => {
                            renameChatSession(session.id, editingTitle)
                            setEditingSessionId(null)
                          }}
                          className="p-1 text-emerald-500 hover:text-emerald-600"
                        >
                          <Check size={12} />
                        </button>
                        <button
                          onClick={() => setEditingSessionId(null)}
                          className="p-1 text-muted hover:text-ink"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            switchChatSession(session.id)
                            onCloseMobile?.()
                          }}
                          className="flex-1 text-left truncate cursor-pointer"
                        >
                          <span className="truncate block">
                            {session.title || 'Untitled Session'}
                          </span>
                        </button>

                        {/* Session Actions Menu */}
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setOpenMenuSessionId(
                                openMenuSessionId === session.id
                                  ? null
                                  : session.id,
                              )
                            }}
                            className="opacity-0 group-hover:opacity-100 p-0.5 text-muted hover:text-ink rounded transition-opacity cursor-pointer"
                          >
                            <MoreVertical size={13} />
                          </button>

                          {openMenuSessionId === session.id && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 top-6 z-50 w-28 bg-canvas border border-hairline rounded-lg shadow-lg py-1 text-xs"
                            >
                              <button
                                onClick={() => {
                                  setEditingSessionId(session.id)
                                  setEditingTitle(session.title)
                                  setOpenMenuSessionId(null)
                                }}
                                className="w-full px-2.5 py-1 text-left hover:bg-surface-card flex items-center gap-1.5 text-muted hover:text-ink cursor-pointer"
                              >
                                <Edit2 size={11} />
                                <span>Rename</span>
                              </button>
                              <button
                                onClick={() => {
                                  deleteChatSession(session.id)
                                  setOpenMenuSessionId(null)
                                }}
                                className="w-full px-2.5 py-1 text-left hover:bg-semantic-error/10 text-semantic-error flex items-center gap-1.5 cursor-pointer"
                              >
                                <Trash2 size={11} />
                                <span>Delete</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Primary Navigation Items */}
        <div className="flex-1 p-3 space-y-1 overflow-y-auto font-sans">
          <div className="text-[11px] font-mono text-muted px-2 py-1">
            WORKSPACE NAVIGATION
          </div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors group cursor-pointer ${
                  isActive
                    ? 'bg-primary/10 text-primary font-medium border border-primary/20 shadow-2xs'
                    : 'text-muted hover:text-ink hover:bg-surface-card border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    size={16}
                    className={
                      isActive
                        ? 'text-primary'
                        : 'text-muted group-hover:text-ink transition-colors'
                    }
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full border border-hairline/60 ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </div>

        {/* User / Workspace Footer */}
        <div className="p-3 border-t border-hairline bg-canvas-soft flex items-center justify-between text-xs text-muted font-sans">
          <div className="flex items-center gap-2 truncate">
            <div className="w-6 h-6 rounded-full bg-surface-card border border-hairline flex items-center justify-center font-bold text-[10px] text-primary">
              AI
            </div>
            <div className="truncate">
              <div className="font-semibold text-ink truncate text-[11px]">
                Developer Workspace
              </div>
              <div className="text-[9px] font-mono text-muted truncate">
                Local Active Environment
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
