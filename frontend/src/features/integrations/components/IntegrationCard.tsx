import React from 'react'
import { Settings, Plus } from 'lucide-react'
import type { Integration } from '@/shared/types/workspace'
import { EcosystemCard } from '@/shared/components/EcosystemCard'
import { IntegrationIconBox } from '@/shared/components/ui/IconBox'

interface IntegrationCardProps {
  integration: Integration
  onOpenDetail: () => void
}

export const IntegrationCard: React.FC<IntegrationCardProps> = ({
  integration,
  onOpenDetail,
}) => {
  const isConnected = integration.status === 'connected'

  return (
    <EcosystemCard
      icon={<IntegrationIconBox integration={integration} size="sm" />}
      title={integration.name}
      description={integration.description}
      metaLine={`${integration.tools.length} Tools Ready · ${integration.latencyMs}ms · ${integration.version}`}
      actionIcon={isConnected ? <Settings size={16} /> : <Plus size={16} />}
      onClick={onOpenDetail}
      onActionClick={onOpenDetail}
      actionTooltip={
        isConnected
          ? 'Connected: Configure & test connector'
          : 'Connect MCP server'
      }
    />
  )
}
