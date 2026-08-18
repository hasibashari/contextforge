import { useState } from 'react'
import { useWorkspace } from '../../../shared/mock'
import { IntegrationsHeader } from '../components/IntegrationsHeader'
import { IntegrationCard } from '../components/IntegrationCard'

export default function IntegrationsView() {
  const { integrations, testIntegration } = useWorkspace()
  const [testingId, setTestingId] = useState<string | null>(null)
  const [expandedIntegrationId, setExpandedIntegrationId] = useState<string | null>(
    integrations[0]?.id || null
  )

  const handleTestPing = async (id: string) => {
    setTestingId(id)
    await testIntegration(id)
    setTestingId(null)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner Header */}
      <IntegrationsHeader />

      {/* Integrations Grid */}
      <div className="space-y-4">
        {integrations.map((intg) => (
          <IntegrationCard
            key={intg.id}
            integration={intg}
            isExpanded={expandedIntegrationId === intg.id}
            isTesting={testingId === intg.id}
            onToggleExpand={() =>
              setExpandedIntegrationId(
                expandedIntegrationId === intg.id ? null : intg.id
              )
            }
            onTest={() => handleTestPing(intg.id)}
          />
        ))}
      </div>
    </div>
  )
}
