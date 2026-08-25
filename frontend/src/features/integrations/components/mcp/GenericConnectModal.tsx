import React, { useState } from 'react'
import { Cpu, Zap } from 'lucide-react'
import type { Integration } from '@/shared/types/workspace'
import {
  Modal,
  ModalHeader,
  ModalFooter,
  IntegrationIconBox,
  Button,
  Input,
  FormField,
} from '@/shared/components'
import { useWorkspace } from '@/shared/context'
import { McpToolsPreview } from './McpToolsPreview'

interface GenericConnectModalProps {
  integration: Integration
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export const GenericConnectModal: React.FC<GenericConnectModalProps> = ({
  integration,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { updateConnectorConfig, discoverTools, refreshIntegrations, showToast } =
    useWorkspace()

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleGenericConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      updateConnectorConfig(integration.id, {
        status: 'connected',
      })

      await discoverTools(integration.id)
      await refreshIntegrations()

      showToast(`✨ Connected ${integration.name}!`, 'success')
      onSuccess?.()
      onClose()
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Connection verification failed'
      showToast(msg, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalHeader
        icon={<IntegrationIconBox integration={integration} size="md" />}
        title={`Connect ${integration.name}`}
        subtitle={`Establish MCP connection with ${integration.name}`}
        onClose={onClose}
      />

      <div className="space-y-4 text-xs font-mono">
        <form onSubmit={handleGenericConnect} className="space-y-4">
          <div className="p-3.5 rounded-xl bg-canvas-soft border border-hairline space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-ink text-xs">
              <Cpu size={14} className="text-primary" />
              <span>MCP Server Connection</span>
            </div>
            <p className="text-muted text-[11px] font-sans leading-relaxed">
              Connect and activate this Model Context Protocol server to expose tools to workspace agents.
            </p>
          </div>

          <FormField label="Endpoint / Command">
            <Input variant="mono" value={integration.endpoint} readOnly disabled />
          </FormField>

          <ModalFooter className="justify-end pt-2">
            <Button type="button" variant="ghost" size="xs" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              leftIcon={<Zap size={13} />}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Connecting...' : `Connect ${integration.name}`}
            </Button>
          </ModalFooter>
        </form>

        <McpToolsPreview tools={integration.tools} />
      </div>
    </Modal>
  )
}
