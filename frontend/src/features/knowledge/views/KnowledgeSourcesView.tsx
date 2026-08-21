import { useState } from 'react'
import { FolderOpen, Sparkles, BookOpen, HardDrive, Plus } from 'lucide-react'
import { useWorkspace } from '@/shared/mock'
import type { KnowledgeSource } from '@/shared/types/workspace'
import {
  KnowledgeSourceCard,
  KnowledgeSourceDetailModal,
  AddSourceModal,
} from '@/features/knowledge'
import { IconBox, EmptyState, PageHeader, Button } from '@/shared/components'

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
      <PageHeader
        eyebrow="Multi-Source Context Ingestion"
        title="Knowledge Grounding Engine"
        description="Connect code repositories, Notion spaces, and OpenAPI specs to give agents deep project grounding with zero hallucination."
        actions={
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus size={15} />}
            onClick={() => setIsAddModalOpen(true)}
          >
            Connect Knowledge Source
          </Button>
        }
      />

      {/* Sources Grid or Clean Empty State */}
      {knowledgeSources.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {knowledgeSources.map((src) => (
            <KnowledgeSourceCard
              key={src.id}
              source={src}
              onOpenDetail={() => setSelectedSourceId(src.id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={
            <IconBox
              size="lg"
              variant="primary"
              icon={<FolderOpen size={24} />}
            />
          }
          title="No Knowledge Bases Connected"
          description="Connect your Obsidian notes, project folders, or upload PDF/code documents to ground AI agent reasoning with 1536-dim vector RAG."
          footerPills={[
            {
              icon: <BookOpen size={12} className="text-[#7c3aed]" />,
              label: 'Obsidian Vaults',
            },
            {
              icon: <HardDrive size={12} className="text-semantic-success" />,
              label: 'Local Folders',
            },
            {
              icon: <Sparkles size={12} className="text-primary" />,
              label: '1536-dim RAG',
            },
          ]}
        />
      )}

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
