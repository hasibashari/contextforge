import { useState } from 'react'
import { useWorkspace } from '../../../shared/mock'
import { KnowledgeHeader } from '../components/KnowledgeHeader'
import { KnowledgeSourceCard } from '../components/KnowledgeSourceCard'
import { AddSourceModal } from '../components/AddSourceModal'

export default function KnowledgeSourcesView() {
  const { knowledgeSources, toggleKnowledgeSync, showToast } = useWorkspace()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const handleAddSource = () => {
    showToast('✓ Knowledge source connected & chunking scheduled!')
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner Header */}
      <KnowledgeHeader onAddSource={() => setIsAddModalOpen(true)} />

      {/* Sources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {knowledgeSources.map((src) => (
          <KnowledgeSourceCard
            key={src.id}
            source={src}
            onSync={() => toggleKnowledgeSync(src.id)}
          />
        ))}
      </div>

      {/* Connect New Source Modal */}
      <AddSourceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddSource}
      />
    </div>
  )
}
