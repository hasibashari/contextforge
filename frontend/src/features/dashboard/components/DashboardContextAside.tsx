import { FileText, Layers } from 'lucide-react'
import { useWorkspace } from '@/shared/context'
import { Badge, EmptyState, IconBox } from '@/shared/components'
import { ArtifactViewerAndEditor } from './ArtifactViewerAndEditor'

export default function DashboardContextAside() {
  const {
    artifacts,
    activeArtifact,
    setActiveArtifact,
    saveArtifactContent,
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
        <Badge variant="success" size="xs">
          Live Editor
        </Badge>
      </div>

      {/* Artifact Viewer / Editor Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeArtifact ? (
          <ArtifactViewerAndEditor
            key={activeArtifact.id}
            artifact={activeArtifact}
            onSave={(newContent) =>
              saveArtifactContent(activeArtifact.id, newContent)
            }
            onDelete={deleteArtifact}
            showToast={showToast}
            allArtifacts={artifacts}
            onSelectArtifact={setActiveArtifact}
          />
        ) : (
          <EmptyState
            compact
            icon={
              <IconBox
                size="md"
                variant="neutral"
                icon={<FileText size={18} className="text-muted" />}
              />
            }
            title="No Active Document"
            description="Type an instruction in chat (e.g. 'Create note in Obsidian' or 'Generate architecture diagram') to preview and edit artifacts here."
          />
        )}
      </div>
    </div>
  )
}
