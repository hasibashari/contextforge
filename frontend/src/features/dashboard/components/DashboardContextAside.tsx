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
  Database,
  Terminal,
} from 'lucide-react'
import { useWorkspace } from '../../../shared/mock'
import type { Artifact } from '../../../shared/types/workspace'

export default function DashboardContextAside() {
  const {
    activeArtifact,
    artifacts,
    setActiveArtifact,
    saveArtifactContent,
    knowledgeSources,
    integrations,
    activities,
    showToast,
    activeSourceFilters,
    toggleSourceFilter,
  } = useWorkspace()

  const [activeTab, setActiveTab] = useState<'artifact' | 'grounding' | 'history'>('artifact')

  return (
    <div className="flex flex-col h-full bg-canvas-soft border-l border-hairline text-ink font-sans text-xs">
      {/* Top Header & Tab Navigation */}
      <div className="p-3 sm:p-4 border-b border-hairline bg-surface-card space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-primary" />
            <span className="font-semibold text-ink text-sm">Artifact & Context Canvas</span>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-semantic-success/10 text-semantic-success font-medium">
            Live Sync
          </span>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center bg-canvas-soft p-1 rounded-lg border border-hairline text-[11px] font-medium">
          <button
            onClick={() => setActiveTab('artifact')}
            className={`flex-1 py-1.5 px-2 rounded-md transition-all text-center cursor-pointer ${
              activeTab === 'artifact'
                ? 'bg-surface-card text-ink shadow-2xs font-semibold'
                : 'text-muted hover:text-ink'
            }`}
          >
            Documents ({artifacts.length})
          </button>

          <button
            onClick={() => setActiveTab('grounding')}
            className={`flex-1 py-1.5 px-2 rounded-md transition-all text-center cursor-pointer ${
              activeTab === 'grounding'
                ? 'bg-surface-card text-ink shadow-2xs font-semibold'
                : 'text-muted hover:text-ink'
            }`}
          >
            Services & MCP
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-1.5 px-2 rounded-md transition-all text-center cursor-pointer ${
              activeTab === 'history'
                ? 'bg-surface-card text-ink shadow-2xs font-semibold'
                : 'text-muted hover:text-ink'
            }`}
          >
            Action Log
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
                  Type an instruction in chat (e.g., "Create a note in Obsidian") and documents will automatically appear here.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ACTIVE SERVICES & MCP */}
        {activeTab === 'grounding' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="text-[10px] font-mono uppercase tracking-caption text-muted flex items-center justify-between">
                <span>Connected Knowledge Bases</span>
                <span className="text-primary font-bold">{knowledgeSources.length} Active</span>
              </div>

              <div className="space-y-2">
                {knowledgeSources.map((src) => {
                  const isFiltered = activeSourceFilters.includes(src.id)
                  return (
                    <div
                      key={src.id}
                      className="p-3 rounded-lg bg-surface-card border border-hairline space-y-1.5 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-medium text-ink truncate">
                          {src.type === 'obsidian_vault' && (
                            <BookOpen size={13} className="text-primary shrink-0" />
                          )}
                          {src.type === 'web_search' && (
                            <Globe size={13} className="text-[#3b6ea5] shrink-0" />
                          )}
                          {src.type === 'github_repo' && (
                            <Terminal size={13} className="text-ink shrink-0" />
                          )}
                          {src.type === 'database_schema' && (
                            <Database size={13} className="text-semantic-success shrink-0" />
                          )}
                          <span className="truncate">{src.name}</span>
                        </div>

                        <button
                          onClick={() => toggleSourceFilter(src.id)}
                          className={`text-[10px] font-mono px-2 py-0.5 rounded cursor-pointer transition-colors ${
                            isFiltered
                              ? 'bg-semantic-success/15 text-semantic-success font-semibold'
                              : 'bg-surface-strong text-muted'
                          }`}
                        >
                          {isFiltered ? '✓ Active' : 'Off'}
                        </button>
                      </div>
                      <p className="text-[11px] text-muted line-clamp-1">{src.description}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* MCP Integrations Health */}
            <div className="space-y-2 pt-2 border-t border-hairline">
              <div className="text-[10px] font-mono uppercase tracking-caption text-muted">
                Connectors & MCP Gateway:
              </div>

              <div className="space-y-2">
                {integrations.map((int) => (
                  <div
                    key={int.id}
                    className="p-2.5 rounded-lg bg-surface-card border border-hairline flex items-center justify-between text-[11px]"
                  >
                    <div className="space-y-0.5 truncate">
                      <div className="font-medium text-ink truncate">{int.name}</div>
                      <div className="text-[10px] text-muted font-mono">{int.endpoint}</div>
                    </div>
                    <span className="text-[10px] font-mono text-semantic-success font-semibold shrink-0 ml-2">
                      {int.latencyMs}ms
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ACTION HISTORY AUDIT */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            <div className="text-[10px] font-mono uppercase tracking-caption text-muted">
              Recent Action Execution Audit:
            </div>

            <div className="space-y-2">
              {activities.map((act) => (
                <div
                  key={act.id}
                  className="p-3 rounded-lg bg-surface-card border border-hairline space-y-1 shadow-2xs"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-primary font-semibold uppercase">
                      {act.actionType.replace(/_/g, ' ')}
                    </span>
                    <span className="text-muted">{act.timestamp}</span>
                  </div>
                  <p className="text-body text-[11px] leading-relaxed">{act.summary}</p>
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
              title="Download .md"
            >
              <Download size={13} />
            </button>
          </div>
        </div>
      </div>

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
          <div className="prose prose-sm max-w-none text-xs leading-relaxed space-y-2.5 text-body whitespace-pre-wrap font-sans">
            {artifact.content}
          </div>
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
