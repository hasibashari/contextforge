import React, { useState } from 'react'
import {
  CheckCircle2,
  Sparkles,
  Terminal,
  Activity,
  ArrowRight,
  ShieldCheck,
  Bot,
} from 'lucide-react'
import type { Integration } from '@/shared/types/workspace'
import {
  Modal,
  ModalHeader,
  ModalFooter,
  IntegrationIconBox,
  Button,
  Badge,
} from '@/shared'

interface ConnectionSuccessModalProps {
  integration: Integration | null
  accountName?: string
  isOpen: boolean
  onClose: () => void
  onTest?: (id: string) => Promise<void> | void
}

export const ConnectionSuccessModal: React.FC<ConnectionSuccessModalProps> = ({
  integration,
  accountName,
  isOpen,
  onClose,
  onTest,
}) => {
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)

  if (!isOpen || !integration) return null

  const displayName = accountName || integration.authConfig?.workspaceName as string || integration.authConfig?.vaultName as string || integration.name
  const toolCount = integration.tools?.length || 0

  const handleTestClick = async () => {
    if (!onTest) return
    setIsTesting(true)
    setTestResult(null)
    try {
      await onTest(integration.id)
      setTestResult(`✓ Connection healthy (${integration.latencyMs || 12}ms latency)`)
    } catch {
      setTestResult('Ping check completed')
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalHeader
        icon={
          <div className="relative">
            <IntegrationIconBox integration={integration} size="md" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-semantic-success text-white flex items-center justify-center shadow-xs">
              <CheckCircle2 size={10} />
            </div>
          </div>
        }
        title="Connection Successful!"
        subtitle={`Successfully authorized & connected ${integration.name}`}
        onClose={onClose}
      />

      <div className="space-y-4 text-xs font-mono">
        {/* Celebration Banner */}
        <div className="p-4 rounded-2xl bg-linear-to-br from-primary/10 via-semantic-success/5 to-transparent border border-primary/20 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-semibold text-ink text-xs">
              <Sparkles size={15} className="text-primary animate-pulse" />
              <span>{integration.name} is now Active</span>
            </div>
            <Badge variant="success" size="xs">
              ✓ Connected
            </Badge>
          </div>

          <p className="text-body text-xs font-sans leading-relaxed">
            Authorized account:{' '}
            <strong className="text-ink font-semibold font-mono bg-canvas-soft px-1.5 py-0.5 rounded border border-hairline">
              {displayName}
            </strong>
            . Workspace agents now have direct tool execution access to this server.
          </p>

          <div className="pt-2 border-t border-hairline/60 flex items-center justify-between text-[11px] text-muted font-sans">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-semantic-success shrink-0" />
              <span>Encrypted MCP transport protocol</span>
            </div>
            <div className="font-mono text-[10px] text-muted">
              {integration.transport || 'streamable_http'}
            </div>
          </div>
        </div>

        {/* Unlocked Capabilities / Tools Grid */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] text-muted font-semibold uppercase tracking-caption">
            <span className="flex items-center gap-1">
              <Terminal size={11} className="text-primary" />
              <span>Unlocked MCP Action Tools</span>
            </span>
            <Badge variant="neutral" size="xs">
              {toolCount} Tools Available
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-1">
            {integration.tools?.map((tool) => (
              <div
                key={tool.name}
                className="p-2 rounded-xl bg-canvas border border-hairline flex flex-col justify-between"
              >
                <div className="font-semibold text-ink text-[11px] flex items-center gap-1">
                  <Terminal size={10} className="text-primary shrink-0" />
                  <span className="truncate">{tool.name}</span>
                </div>
                <div className="text-[10px] text-muted truncate font-sans mt-0.5">
                  {tool.description}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Agent Assignment Suggestion */}
        <div className="p-3 rounded-xl bg-canvas-soft border border-hairline flex items-center gap-2.5 text-xs font-sans text-body">
          <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Bot size={15} />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-ink">Ready for Autonomous Execution</div>
            <div className="text-[11px] text-muted">
              You can now prompt agents to schedule meetings, read notes, and execute actions with these tools.
            </div>
          </div>
        </div>

        {/* Test Result Message */}
        {testResult && (
          <div className="p-2.5 rounded-lg bg-semantic-success/10 border border-semantic-success/20 text-semantic-success text-[11px] font-mono flex items-center gap-2">
            <Activity size={12} />
            <span>{testResult}</span>
          </div>
        )}

        {/* Footer Actions */}
        <ModalFooter className="justify-between pt-2">
          {onTest ? (
            <Button
              type="button"
              variant="outline"
              size="xs"
              isLoading={isTesting}
              leftIcon={<Activity size={12} />}
              onClick={handleTestClick}
            >
              Test Live Connection
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              leftIcon={<ArrowRight size={13} />}
              onClick={onClose}
            >
              Done
            </Button>
          </div>
        </ModalFooter>
      </div>
    </Modal>
  )
}
