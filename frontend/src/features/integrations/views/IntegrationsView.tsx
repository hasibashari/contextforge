import { useState, useMemo, useEffect } from 'react'
import {
  Cpu,
  Search,
  RotateCcw,
} from 'lucide-react'
import { useWorkspace } from '@/shared/context'
import {
  IntegrationCard,
  ConnectorDetailModal,
  ConnectAuthModal,
} from '@/features/integrations'
import {
  EmptyState,
  IconBox,
  PageHeader,
} from '@/shared/components'

export default function IntegrationsView() {
  const {
    integrations,
    testIntegration,
    toggleIntegrationConnect,
    updateConnectorConfig,
    refreshIntegrations,
    showToast,
  } = useWorkspace()

  const [searchQuery, setSearchQuery] = useState('')

  // Modals & Inspection State (ID-based for full reactivity)
  const [selectedConnectorId, setSelectedConnectorId] = useState<string | null>(null)
  const [connectingConnectorId, setConnectingConnectorId] = useState<string | null>(null)

  const selectedConnector = integrations.find((i) => i.id === selectedConnectorId) || null
  const connectingConnector = integrations.find((i) => i.id === connectingConnectorId) || null

  // Testing State
  const [testingId, setTestingId] = useState<string | null>(null)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('oauth') === 'success') {
      showToast('✨ Notion OAuth authorization completed successfully!', 'success')
      refreshIntegrations()
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [refreshIntegrations, showToast])

  const handleTestPing = async (id: string) => {
    setTestingId(id)
    await testIntegration(id)
    setTestingId(null)
  }

  // Filtered Connectors
  const filteredConnectors = useMemo(() => {
    return integrations.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.tools.some((t) => t.name.toLowerCase().includes(searchQuery.toLowerCase()))

      return matchesSearch
    })
  }, [integrations, searchQuery])

  const connectedCount = integrations.filter((i) => i.status === 'connected').length

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
      {/* Top Banner Header */}
      <PageHeader
        eyebrow="Ecosystem & Protocol Extensibility"
        title="Model Context Protocol (MCP) Servers"
        description="Connect external Model Context Protocol (MCP) servers (Obsidian, Notion, GitHub) to empower autonomous agents with active tool execution and file mutation."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                refreshIntegrations()
                showToast('⚡ Live MCP Health Probe refreshed', 'info')
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-ink bg-surface-card hover:bg-surface-strong border border-hairline rounded-xl shadow-2xs transition-colors cursor-pointer"
              title="Run live probe on all MCP servers"
            >
              <RotateCcw size={13} className="text-muted" />
              <span>Probe Status</span>
            </button>

            <div className="flex items-center gap-2 bg-canvas-soft border border-hairline rounded-xl px-3.5 py-2 text-ink shadow-2xs whitespace-nowrap">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  connectedCount > 0
                    ? 'bg-semantic-success animate-pulse'
                    : 'bg-semantic-error'
                }`}
              />
              <span className="text-body font-medium text-xs sm:text-sm">
                <strong className="text-ink font-semibold">
                  {connectedCount}
                </strong>{' '}
                of {integrations.length} Servers Active
              </span>
            </div>
          </div>
        }
      />

      {/* Search Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="text"
            placeholder="Search MCP servers or tools (e.g. obsidian, notion, writer, tasks)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-surface-card border border-hairline rounded-xl text-xs text-ink placeholder:text-muted focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Connectors Grid or Empty State */}
      {filteredConnectors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {filteredConnectors.map((intg) => (
            <IntegrationCard
              key={intg.id}
              integration={intg}
              onOpenDetail={() => setSelectedConnectorId(intg.id)}
              onConnect={() => setConnectingConnectorId(intg.id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<IconBox size="lg" variant="primary" icon={<Cpu size={22} />} />}
          title="No MCP Connectors Found"
          description={
            searchQuery
              ? `No connectors match your search "${searchQuery}".`
              : 'Official Model Context Protocol integrations will appear here.'
          }
          secondaryAction={
            searchQuery
              ? {
                  label: 'Clear Search',
                  onClick: () => setSearchQuery(''),
                  icon: <RotateCcw size={13} />,
                }
              : undefined
          }
        />
      )}

      {/* Modals */}
      <ConnectorDetailModal
        integration={selectedConnector}
        onClose={() => setSelectedConnectorId(null)}
        onTest={handleTestPing}
        onToggleConnect={(id) => {
          toggleIntegrationConnect(id)
        }}
        onSaveConfig={(id, updates) => {
          updateConnectorConfig(id, updates)
        }}
        isTesting={Boolean(selectedConnector && testingId === selectedConnector.id)}
      />

      <ConnectAuthModal
        integration={connectingConnector}
        isOpen={Boolean(connectingConnector)}
        onClose={() => setConnectingConnectorId(null)}
      />
    </div>
  )
}
