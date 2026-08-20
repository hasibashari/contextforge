import { useState } from 'react'
import { useWorkspace } from '@/shared/mock'
import type { KnowledgeSource } from '@/shared/types/workspace'
import {
  KnowledgeHeader,
  KnowledgeSourceCard,
  KnowledgeSourceDetailModal,
  AddSourceModal,
} from '@/features/knowledge'

export default function KnowledgeSourcesView() {
  const {
    knowledgeSources,
    toggleKnowledgeSync,
    toggleKnowledgeSourceConnect,
    addKnowledgeSource,
    uploadKnowledgeFiles,
    deleteKnowledgeSource,
  } = useWorkspace()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null)

  const selectedSource =
    knowledgeSources.find((s) => s.id === selectedSourceId) || null

  const handleAddSource = (data: {
    name: string
    type: KnowledgeSource['type']
    location: string
  }) => {
    addKnowledgeSource(data)
  }

  const handleUploadFiles = async (
    files: File[],
    name: string,
    sourceId?: string,
  ) => {
    return uploadKnowledgeFiles(files, name, sourceId)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
      {/* Top Banner Header */}
      <KnowledgeHeader onAddSource={() => setIsAddModalOpen(true)} />

      {/* Sources Grid in 2 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {knowledgeSources.map((src) => (
          <KnowledgeSourceCard
            key={src.id}
            source={src}
            onOpenDetail={() => setSelectedSourceId(src.id)}
          />
        ))}
      </div>

      {/* Grounding Source Detail & Vector Modal */}
      <KnowledgeSourceDetailModal
        source={selectedSource}
        onClose={() => setSelectedSourceId(null)}
        onSync={(id) => toggleKnowledgeSync(id)}
        onToggleConnect={(id) => toggleKnowledgeSourceConnect(id)}
        onDelete={(id) => deleteKnowledgeSource(id)}
        onUploadMore={handleUploadFiles}
      />

      {/* Connect New Source Modal */}
      <AddSourceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddSource}
        onUpload={handleUploadFiles}
      />
    </div>
  )
}
