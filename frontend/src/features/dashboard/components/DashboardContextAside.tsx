import { FileText, Layers, BookOpen, ChevronRight } from 'lucide-react'
import { useWorkspace } from '@/shared/context'
import { Badge, EmptyState, IconBox } from '@/shared/components'
import { ArtifactViewerAndEditor } from './ArtifactViewerAndEditor'

export default function DashboardContextAside() {
  const {
    artifacts,
    activeArtifact,
    setActiveArtifact,
    deleteArtifact,
    showToast,
  } = useWorkspace()

  return (
    <div className="flex flex-col h-full bg-canvas-soft border-l border-hairline text-ink font-sans text-xs">
      {/* Top Header */}
      <div className="p-3 sm:p-4 border-b border-hairline bg-surface-card flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Layers size={15} className="text-primary" />
          <span className="font-semibold text-ink text-sm">Artifacts & Documents</span>
          <span className="text-[11px] font-mono px-1.5 py-0.5 rounded-md bg-canvas-soft text-body border border-hairline">
            {artifacts.length}
          </span>
        </div>
        <Badge variant="primary" size="xs">
          Document Viewer
        </Badge>
      </div>

      {/* Artifact Viewer Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeArtifact ? (
          <ArtifactViewerAndEditor
            key={activeArtifact.id}
            artifact={activeArtifact}
            onDelete={deleteArtifact}
            showToast={showToast}
            allArtifacts={artifacts}
            onSelectArtifact={setActiveArtifact}
          />
        ) : artifacts.length > 0 ? (
          /* Persistent Document Library List (Visible when no active doc is selected) */
          <div className="space-y-3 animate-in fade-in duration-150">
            <div className="text-[11px] font-mono text-muted flex items-center justify-between">
              <span>Select a document to preview:</span>
              <span>{artifacts.length} available</span>
            </div>
            <div className="space-y-2">
              {artifacts.map((art) => (
                <button
                  key={art.id}
                  onClick={() => setActiveArtifact(art)}
                  className="w-full text-left p-3 rounded-xl bg-surface-card border border-hairline hover:border-primary/40 hover:shadow-2xs transition-all flex items-center justify-between gap-2 cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <BookOpen size={14} className="text-primary shrink-0" />
                    <div className="truncate">
                      <div className="font-semibold text-xs text-ink group-hover:text-primary transition-colors truncate">
                        {art.title}
                      </div>
                      {art.locationPath && (
                        <div className="text-[10px] font-mono text-muted truncate">
                          {art.locationPath}
                        </div>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={13} className="shrink-0 text-muted group-hover:text-ink transition-colors" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Empty State (Only shown when 0 documents exist in workspace) */
          <EmptyState
            compact
            icon={
              <IconBox
                size="md"
                variant="neutral"
                icon={<FileText size={18} className="text-muted" />}
              />
            }
            title="No Documents Created"
            description="Type an instruction in chat (e.g. 'Create note in Obsidian' or 'Generate architecture diagram') to preview and edit artifacts here."
          />
        )}
      </div>
    </div>
  )
}
