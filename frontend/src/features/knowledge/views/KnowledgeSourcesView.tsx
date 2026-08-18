import { useState } from 'react'
import { useWorkspace } from '../../../shared/mock'
import type { KnowledgeSource } from '../../../shared/types/workspace'
import { KnowledgeHeader } from '../components/KnowledgeHeader'
import { KnowledgeSourceCard } from '../components/KnowledgeSourceCard'
import { KnowledgeSourceDetailModal } from '../components/KnowledgeSourceDetailModal'
import { AddSourceModal } from '../components/AddSourceModal'

export default function KnowledgeSourcesView() {
  const {
    knowledgeSources,
    toggleKnowledgeSync,
    toggleKnowledgeSourceConnect,
    showToast,
  } = useWorkspace()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedSource, setSelectedSource] = useState<KnowledgeSource | null>(null)

  const handleAddSource = () => {
    showToast('✓ Knowledge source connected & chunking scheduled!')
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner Header */}
      <KnowledgeHeader onAddSource={() => setIsAddModalOpen(true)} />

      {/* Sources Grid in 2 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {knowledgeSources.map((src) => (
          <KnowledgeSourceCard
            key={src.id}
            source={src}
            onOpenDetail={() => setSelectedSource(src)}
          />
        ))}
      </div>

      {/* Grounding Source Detail & Vector Modal */}
      <KnowledgeSourceDetailModal
        source={selectedSource}
        onClose={() => setSelectedSource(null)}
        onSync={(id) => {
          toggleKnowledgeSync(id)
          setSelectedSource((prev) =>
            prev
              ? {
                  ...prev,
                  status: prev.status === 'synced' ? 'syncing' : 'synced',
                }
              : null
          )
        }}
        onToggleConnect={(id) => {
          toggleKnowledgeSourceConnect(id)
          setSelectedSource((prev) =>
            prev
              ? {
                  ...prev,
                  status: prev.status === 'synced' ? 'error' : 'synced',
                }
              : null
          )
        }}
      />

      {/* Connect New Source Modal */}
      <AddSourceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddSource}
      />
    </div>
  )
}
