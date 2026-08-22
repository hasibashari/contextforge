import { useState } from 'react'
import { Sparkles, FileText } from 'lucide-react'
import { useWorkspace } from '@/shared/context'
import { SegmentedTabs, Badge, EmptyState, IconBox } from '@/shared/components'
import { ArtifactViewerAndEditor } from './ArtifactViewerAndEditor'
import { MemoryTab } from './MemoryTab'

export default function DashboardContextAside() {
  const {
    artifacts,
    activeArtifact,
    setActiveArtifact,
    saveArtifactContent,
    showToast,
    userMemories,
  } = useWorkspace()
  const [activeTab, setActiveTab] = useState<'artifact' | 'memories'>('artifact')

  return (
    <div className="flex flex-col h-full bg-canvas-soft border-l border-hairline text-ink font-sans text-xs">
      {/* Top Header & Tab Navigation */}
      <div className="p-3 sm:p-4 border-b border-hairline bg-surface-card space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-primary" />
            <span className="font-semibold text-ink text-sm">Context & Personal Hub</span>
          </div>
          <Badge variant="success" size="xs">Live Sync</Badge>
        </div>

        {/* 2 Segmented Tab Buttons: Docs & Memory */}
        <SegmentedTabs
          value={activeTab}
          onChange={(val) => setActiveTab(val as 'artifact' | 'memories')}
          tabs={[
            {
              id: 'artifact',
              label: 'Docs',
              count: artifacts.length,
              title: 'Documents & Artifacts',
            },
            {
              id: 'memories',
              label: 'Memory',
              count: userMemories.length,
              title: 'Personal AI Memory Bank',
            },
          ]}
        />
      </div>

      {/* Tab Body Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'artifact' &&
          (activeArtifact ? (
            <ArtifactViewerAndEditor
              key={activeArtifact.id}
              artifact={activeArtifact}
              onSave={(newContent) => saveArtifactContent(activeArtifact.id, newContent)}
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
              description="Type an instruction in chat (e.g. 'Create note in Obsidian' or 'Generate diagram') to preview artifacts here."
            />
          ))}
        {activeTab === 'memories' && <MemoryTab />}
      </div>
    </div>
  )
}

