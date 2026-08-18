import React, { useState } from 'react'
import {
  BookOpen,
  Globe,
  Calendar,
  Sparkles,
  Copy,
  Download,
  FileText,
  Edit3,
  Eye,
  ChevronRight,
  Brain,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  User,
  Image as ImageIcon,
} from 'lucide-react'
import { useWorkspace } from '@/shared/mock'
import { MarkdownRenderer } from '@/shared/components'
import type { Artifact, CalendarEvent, UserMemoryItem } from '@/shared/types/workspace'

export default function DashboardContextAside() {
  const {
    activeArtifact,
    artifacts,
    setActiveArtifact,
    saveArtifactContent,
    showToast,
    calendarEvents,
    addCalendarEvent,
    updateCalendarEventStatus,
    userMemories,
    addUserMemory,
    deleteUserMemory,
  } = useWorkspace()

  const [activeTab, setActiveTab] = useState<'artifact' | 'schedule' | 'memories'>('artifact')
  const [showAddEventModal, setShowAddEventModal] = useState(false)
  const [newEventTitle, setNewEventTitle] = useState('')
  const [newEventTime, setNewEventTime] = useState('02:00 PM')
  const [newEventCategory, setNewEventCategory] = useState<CalendarEvent['category']>('meeting')

  const [showAddMemoryModal, setShowAddMemoryModal] = useState(false)
  const [newMemoryCategory, setNewMemoryCategory] = useState<UserMemoryItem['category']>('preference')
  const [newMemoryKey, setNewMemoryKey] = useState('')
  const [newMemoryValue, setNewMemoryValue] = useState('')

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEventTitle.trim()) return

    addCalendarEvent({
      title: newEventTitle.trim(),
      time: newEventTime,
      date: 'Today',
      duration: '45 mins',
      status: 'upcoming',
      category: newEventCategory,
      location: 'Google Meet / Online',
    })

    setNewEventTitle('')
    setShowAddEventModal(false)
  }

  const handleCreateMemory = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMemoryKey.trim() || !newMemoryValue.trim()) return

    addUserMemory({
      category: newMemoryCategory,
      key: newMemoryKey.trim(),
      value: newMemoryValue.trim(),
    })

    setNewMemoryKey('')
    setNewMemoryValue('')
    setShowAddMemoryModal(false)
  }

  return (
    <div className="flex flex-col h-full bg-canvas-soft border-l border-hairline text-ink font-sans text-xs">
      {/* Top Header & Tab Navigation */}
      <div className="p-3 sm:p-4 border-b border-hairline bg-surface-card space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-primary" />
            <span className="font-semibold text-ink text-sm">Context & Personal Hub</span>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-semantic-success/10 text-semantic-success font-medium">
            Live Sync
          </span>
        </div>

        {/* 3 Tab Buttons */}
        <div className="grid grid-cols-3 gap-1 bg-canvas-soft p-1 rounded-xl border border-hairline text-[11px] font-medium">
          <button
            onClick={() => setActiveTab('artifact')}
            className={`py-1.5 px-1 rounded-lg transition-all text-center truncate cursor-pointer ${
              activeTab === 'artifact'
                ? 'bg-surface-card text-ink shadow-2xs font-semibold'
                : 'text-muted hover:text-ink'
            }`}
            title="Documents & Artifacts"
          >
            Docs ({artifacts.length})
          </button>

          <button
            onClick={() => setActiveTab('schedule')}
            className={`py-1.5 px-1 rounded-lg transition-all text-center truncate cursor-pointer ${
              activeTab === 'schedule'
                ? 'bg-surface-card text-ink shadow-2xs font-semibold'
                : 'text-muted hover:text-ink'
            }`}
            title="Google Calendar Schedule"
          >
            Agenda ({calendarEvents.length})
          </button>

          <button
            onClick={() => setActiveTab('memories')}
            className={`py-1.5 px-1 rounded-lg transition-all text-center truncate cursor-pointer ${
              activeTab === 'memories'
                ? 'bg-surface-card text-ink shadow-2xs font-semibold'
                : 'text-muted hover:text-ink'
            }`}
            title="Personal AI Memory Bank"
          >
            Memory ({userMemories.length})
          </button>
        </div>
      </div>

      {/* Tab Body Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* TAB 1: ARTIFACT & DOCUMENT PREVIEW */}
        {activeTab === 'artifact' && (
          <div className="space-y-4">
            {activeArtifact ? (
              <ArtifactViewerAndEditor
                key={activeArtifact.id}
                artifact={activeArtifact}
                onSave={(newContent) => saveArtifactContent(activeArtifact.id, newContent)}
                showToast={showToast}
                allArtifacts={artifacts}
                onSelectArtifact={setActiveArtifact}
              />
            ) : (
              <div className="p-8 text-center bg-surface-card border border-hairline rounded-xl space-y-2">
                <FileText size={24} className="text-muted mx-auto" />
                <div className="font-semibold text-ink">No Active Document</div>
                <p className="text-[11px] text-muted">
                  Type an instruction in chat (e.g., "Create a note in Obsidian" or "Generate an architecture diagram") and artifacts will appear here.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: INTERACTIVE CALENDAR & SCHEDULE */}
        {activeTab === 'schedule' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-mono uppercase tracking-caption text-muted flex items-center gap-1.5">
                <Calendar size={12} className="text-semantic-success" />
                <span>Today's Synced Agenda ({calendarEvents.length})</span>
              </div>

              <button
                type="button"
                onClick={() => setShowAddEventModal(!showAddEventModal)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-canvas-soft hover:bg-canvas text-ink border border-hairline text-[11px] font-mono transition-colors cursor-pointer"
              >
                <Plus size={11} />
                <span>Add Event</span>
              </button>
            </div>

            {/* Inline Add Event Form */}
            {showAddEventModal && (
              <form
                onSubmit={handleCreateEvent}
                className="p-3 bg-surface-card border border-primary/40 rounded-xl space-y-2.5 shadow-xs"
              >
                <div className="font-semibold text-ink text-xs">New Calendar Event</div>
                <input
                  type="text"
                  placeholder="Event title (e.g. PR Review with Lead)"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-canvas rounded-lg border border-hairline text-ink text-xs focus:outline-none focus:border-primary"
                  required
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Time (e.g. 03:30 PM)"
                    value={newEventTime}
                    onChange={(e) => setNewEventTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-canvas rounded-lg border border-hairline text-ink text-xs font-mono focus:outline-none focus:border-primary"
                  />
                  <select
                    value={newEventCategory}
                    onChange={(e) => setNewEventCategory(e.target.value as CalendarEvent['category'])}
                    className="w-full px-2.5 py-1.5 bg-canvas rounded-lg border border-hairline text-ink text-xs focus:outline-none focus:border-primary"
                  >
                    <option value="meeting">Meeting</option>
                    <option value="review">Review</option>
                    <option value="task">Task</option>
                    <option value="personal">Personal</option>
                  </select>
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddEventModal(false)}
                    className="px-2.5 py-1 rounded text-xs text-muted hover:text-ink cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 rounded bg-primary text-on-primary font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
                  >
                    Save Event
                  </button>
                </div>
              </form>
            )}

            {/* Events Timeline List */}
            <div className="space-y-2">
              {calendarEvents.map((evt) => {
                const isDone = evt.status === 'completed'

                return (
                  <div
                    key={evt.id}
                    className={`p-3 rounded-xl border transition-all shadow-2xs space-y-2 ${
                      isDone
                        ? 'bg-canvas-soft/60 border-hairline opacity-60'
                        : 'bg-surface-card border-hairline hover:border-hairline-strong'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          type="button"
                          onClick={() =>
                            updateCalendarEventStatus(
                              evt.id,
                              isDone ? 'upcoming' : 'completed'
                            )
                          }
                          className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                            isDone
                              ? 'bg-semantic-success border-semantic-success text-white'
                              : 'border-hairline hover:border-primary text-transparent'
                          }`}
                          title={isDone ? 'Mark as Upcoming' : 'Mark as Completed'}
                        >
                          <CheckCircle2 size={12} />
                        </button>

                        <h4
                          className={`font-semibold text-xs text-ink leading-snug truncate ${
                            isDone ? 'line-through text-muted' : ''
                          }`}
                        >
                          {evt.title}
                        </h4>
                      </div>

                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold shrink-0 ${
                          evt.category === 'meeting'
                            ? 'bg-primary/10 text-primary'
                            : evt.category === 'review'
                            ? 'bg-[#3b6ea5]/15 text-[#3b6ea5]'
                            : 'bg-surface-strong text-body'
                        }`}
                      >
                        {evt.category}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-muted pl-6">
                      <div className="flex items-center gap-1.5">
                        <Clock size={11} className="text-muted shrink-0" />
                        <span>{evt.time}</span>
                        <span>•</span>
                        <span>{evt.duration}</span>
                      </div>
                      {evt.location && (
                        <span className="truncate max-w-30">{evt.location}</span>
                      )}
                    </div>

                    {evt.attendees && evt.attendees.length > 0 && (
                      <div className="flex items-center gap-1.5 pl-6 text-[10px] font-mono text-muted">
                        <User size={10} />
                        <span className="truncate">{evt.attendees.join(', ')}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* TAB 3: PERSONAL MEMORY BANK */}
        {activeTab === 'memories' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-mono uppercase tracking-caption text-muted flex items-center gap-1.5">
                <Brain size={12} className="text-primary" />
                <span>AI Long-Term Memory ({userMemories.length})</span>
              </div>

              <button
                type="button"
                onClick={() => setShowAddMemoryModal(!showAddMemoryModal)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-canvas-soft hover:bg-canvas text-ink border border-hairline text-[11px] font-mono transition-colors cursor-pointer"
              >
                <Plus size={11} />
                <span>Add Fact</span>
              </button>
            </div>

            {/* Inline Add Memory Form */}
            {showAddMemoryModal && (
              <form
                onSubmit={handleCreateMemory}
                className="p-3 bg-surface-card border border-primary/40 rounded-xl space-y-2.5 shadow-xs"
              >
                <div className="font-semibold text-ink text-xs">Add Personal Preference / Fact</div>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={newMemoryCategory}
                    onChange={(e) => setNewMemoryCategory(e.target.value as UserMemoryItem['category'])}
                    className="w-full px-2.5 py-1.5 bg-canvas rounded-lg border border-hairline text-ink text-xs focus:outline-none focus:border-primary"
                  >
                    <option value="profile">Profile</option>
                    <option value="preference">Preference</option>
                    <option value="project">Project</option>
                    <option value="workflow">Workflow</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Memory Key"
                    value={newMemoryKey}
                    onChange={(e) => setNewMemoryKey(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-canvas rounded-lg border border-hairline text-ink text-xs focus:outline-none focus:border-primary"
                    required
                  />
                </div>
                <textarea
                  rows={2}
                  placeholder="Value / Context details (e.g. Always generate TypeScript code with strict mode)"
                  value={newMemoryValue}
                  onChange={(e) => setNewMemoryValue(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-canvas rounded-lg border border-hairline text-ink text-xs focus:outline-none focus:border-primary resize-none"
                  required
                />
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddMemoryModal(false)}
                    className="px-2.5 py-1 rounded text-xs text-muted hover:text-ink cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 rounded bg-primary text-on-primary font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
                  >
                    Save to Memory
                  </button>
                </div>
              </form>
            )}

            {/* Memory Items List */}
            <div className="space-y-2">
              {userMemories.map((mem) => (
                <div
                  key={mem.id}
                  className="p-3 rounded-xl bg-surface-card border border-hairline hover:border-hairline-strong space-y-1.5 shadow-2xs group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-primary/10 text-primary font-semibold">
                      {mem.category}
                    </span>

                    <button
                      type="button"
                      onClick={() => deleteUserMemory(mem.id)}
                      className="text-muted hover:text-semantic-error opacity-0 group-hover:opacity-100 transition-opacity p-1 cursor-pointer"
                      title="Forget this memory item"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>

                  <div className="font-semibold text-xs text-ink">{mem.key}</div>
                  <p className="text-[11px] text-body leading-relaxed">{mem.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ArtifactViewerAndEditor({
  artifact,
  onSave,
  showToast,
  allArtifacts,
  onSelectArtifact,
}: {
  artifact: Artifact
  onSave: (content: string) => void
  showToast: (msg: string) => void
  allArtifacts: Artifact[]
  onSelectArtifact: (art: Artifact) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(artifact.content)

  const handleSave = () => {
    onSave(editContent)
    setIsEditing(false)
  }

  const handleCopy = () => {
    navigator.clipboard?.writeText(artifact.content)
    showToast('📋 Document content copied to clipboard')
  }

  const handleDownload = () => {
    const blob = new Blob([artifact.content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${artifact.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`
    a.click()
    URL.revokeObjectURL(url)
    showToast('📥 .md file downloaded successfully')
  }

  const getServiceBadge = (origin?: string) => {
    switch (origin) {
      case 'obsidian':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-primary/10 text-primary font-semibold">
            <BookOpen size={10} />
            <span>Obsidian Vault</span>
          </span>
        )
      case 'web':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-timeline-read/20 text-[#3b6ea5] font-semibold">
            <Globe size={10} />
            <span>Live Web Grounding</span>
          </span>
        )
      case 'calendar':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-semantic-success/15 text-semantic-success font-semibold">
            <Calendar size={10} />
            <span>Google Calendar</span>
          </span>
        )
      case 'imagen':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-[#ff5e00]/15 text-[#ff5e00] font-semibold">
            <ImageIcon size={10} />
            <span>Imagen 3 / Flux</span>
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-surface-strong text-muted">
            <FileText size={10} />
            <span>Document</span>
          </span>
        )
    }
  }

  return (
    <div className="space-y-3">
      {/* Artifact Metadata Card */}
      <div className="p-3.5 bg-surface-card rounded-xl border border-hairline shadow-2xs space-y-2">
        <div className="flex items-start justify-between gap-2">
          {getServiceBadge(artifact.serviceOrigin)}
          <span className="text-[10px] font-mono text-muted">
            {artifact.updatedAt || artifact.createdAt}
          </span>
        </div>

        <h3 className="font-semibold text-ink text-xs sm:text-sm leading-snug">
          {artifact.title}
        </h3>

        {artifact.locationPath && (
          <div className="text-[11px] font-mono text-muted flex items-center gap-1 truncate">
            <span className="text-body font-medium">Path:</span>
            <span className="text-primary truncate">{artifact.locationPath}</span>
          </div>
        )}

        {/* Actions Header Bar */}
        <div className="pt-2 border-t border-hairline flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium border transition-colors cursor-pointer ${
                isEditing
                  ? 'bg-primary text-on-primary border-primary'
                  : 'bg-canvas-soft border-hairline text-ink hover:bg-canvas'
              }`}
            >
              {isEditing ? <Eye size={12} /> : <Edit3 size={12} />}
              <span>{isEditing ? 'Preview' : 'Edit'}</span>
            </button>

            {isEditing && (
              <button
                onClick={handleSave}
                className="px-2.5 py-1 rounded text-[11px] font-medium bg-semantic-success text-white hover:bg-semantic-success/90 transition-colors cursor-pointer"
              >
                Save
              </button>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleCopy}
              className="p-1.5 rounded bg-canvas-soft border border-hairline hover:border-hairline-strong text-muted hover:text-ink transition-colors cursor-pointer"
              title="Copy Markdown"
            >
              <Copy size={13} />
            </button>
            <button
              onClick={handleDownload}
              className="p-1.5 rounded bg-canvas-soft border border-hairline hover:border-hairline-strong text-muted hover:text-ink transition-colors cursor-pointer"
              title="Download File"
            >
              <Download size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Image Preview Banner (If image artifact) */}
      {artifact.imageUrl && (
        <div className="bg-surface-card rounded-xl border border-hairline overflow-hidden p-2 shadow-2xs space-y-2">
          <img
            src={artifact.imageUrl}
            alt={artifact.title}
            className="w-full rounded-lg object-cover"
          />
        </div>
      )}

      {/* Content Viewer / Editor */}
      <div className="bg-surface-card rounded-xl border border-hairline p-4 shadow-2xs">
        {isEditing ? (
          <textarea
            rows={14}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full font-mono text-[11px] bg-canvas p-3 rounded-lg border border-hairline text-ink focus:outline-none focus:border-primary leading-relaxed resize-y"
          />
        ) : (
          <MarkdownRenderer content={artifact.content} />
        )}
      </div>

      {/* Other Available Artifacts */}
      <div className="space-y-2 pt-2">
        <div className="text-[10px] font-mono uppercase tracking-caption text-muted">
          All Documents in this Session:
        </div>
        <div className="space-y-1.5">
          {allArtifacts.map((art) => (
            <button
              key={art.id}
              onClick={() => onSelectArtifact(art)}
              className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-center justify-between gap-2 cursor-pointer ${
                artifact.id === art.id
                  ? 'bg-surface-card border-primary/40 shadow-2xs font-medium text-ink'
                  : 'bg-canvas-soft border-hairline text-muted hover:text-ink hover:bg-surface-card'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <BookOpen size={13} className="text-primary shrink-0" />
                <span className="truncate text-xs">{art.title}</span>
              </div>
              <ChevronRight size={13} className="shrink-0 text-muted" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
