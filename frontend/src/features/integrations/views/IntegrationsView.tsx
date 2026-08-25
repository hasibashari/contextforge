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
  ConnectionSuccessModal,
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
  const [successModalData, setSuccessModalData] = useState<{
    integrationId: string
    accountName?: string
  } | null>(null)

  const selectedConnector = integrations.find((i) => i.id === selectedConnectorId) || null
  const connectingConnector = integrations.find((i) => i.id === connectingConnectorId) || null
  const successIntegration = integrations.find((i) => i.id === successModalData?.integrationId) || null

  // Testing State
  const [testingId, setTestingId] = useState<string | null>(null)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const oauthStatus = urlParams.get('oauth')
    if (oauthStatus === 'success') {
      showToast('✨ Notion OAuth authorization completed successfully!', 'success')
      refreshIntegrations()
      window.history.replaceState({}, document.title, window.location.pathname)
      const timer = setTimeout(() => {
        setSuccessModalData({
          integrationId: 'int-notion-mcp',
          accountName: 'Notion Workspace',
        })
      }, 100)
      return () => clearTimeout(timer)
    } else if (oauthStatus === 'gcal_success') {
      showToast('✨ Google Calendar connected successfully!', 'success')
      refreshIntegrations()
      window.history.replaceState({}, document.title, window.location.pathname)
      const timer = setTimeout(() => {
        setSuccessModalData({
          integrationId: 'int-google-calendar-mcp',
          accountName: 'Google Calendar Account',
        })
      }, 100)
      return () => clearTimeout(timer)
    }

    // Popup window postMessage listener
    const handleAuthMessage = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== 'object') return

      if (event.data.type === 'MCP_AUTH_SUCCESS') {
        const provider = (event.data.provider as string) || 'google-calendar'
        const account = (event.data.account as string) || 'Connected Account'
        const targetId = provider.includes('calendar') || provider.includes('google')
          ? 'int-google-calendar-mcp'
          : provider.includes('notion')
          ? 'int-notion-mcp'
          : 'int-obsidian-vault-mcp'

        showToast(`✨ ${account} connected successfully!`, 'success')
        refreshIntegrations()
        setConnectingConnectorId(null)
        setSuccessModalData({
          integrationId: targetId,
          accountName: account,
        })
      } else if (event.data.type === 'GOOGLE_CALENDAR_AUTH_SUCCESS') {
        const account = event.data.account?.workspaceName || 'Google Account'
        showToast(`✨ Google Calendar (${account}) connected successfully!`, 'success')
        refreshIntegrations()
        setConnectingConnectorId(null)
        setSuccessModalData({
          integrationId: 'int-google-calendar-mcp',
          accountName: account,
        })
      } else if (event.data.type === 'GOOGLE_CALENDAR_AUTH_ERROR') {
        showToast(`⚠️ Google Calendar authorization failed: ${event.data.error || 'Unknown error'}`, 'error')
      } else if (event.data.type === 'NOTION_AUTH_SUCCESS') {
        const account = event.data.workspace?.workspaceName || 'Notion Workspace'
        showToast('✨ Notion workspace connected successfully!', 'success')
        refreshIntegrations()
        setConnectingConnectorId(null)
        setSuccessModalData({
          integrationId: 'int-notion-mcp',
          accountName: account,
        })
      }
    }

    window.addEventListener('message', handleAuthMessage)
    return () => window.removeEventListener('message', handleAuthMessage)
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
        description="Connect external Model Context Protocol (MCP) servers (Obsidian, Notion, Google Calendar) to empower autonomous agents with active tool execution and file mutation."
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-card border border-hairline shadow-2xs font-mono text-xs">
              <span
                className={`w-2 h-2 rounded-full ${
                  connectedCount > 0
                    ? 'bg-semantic-success animate-pulse'
                    : 'bg-semantic-error'
                }`}
              />
              <span className="text-body font-medium text-xs">
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
            placeholder="Search MCP servers or tools (e.g. obsidian, notion, calendar, tasks)..."
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
        onSuccess={() => {
          if (connectingConnector) {
            setSuccessModalData({
              integrationId: connectingConnector.id,
              accountName: connectingConnector.name,
            })
          }
        }}
      />

      <ConnectionSuccessModal
        integration={successIntegration}
        accountName={successModalData?.accountName}
        isOpen={Boolean(successModalData && successIntegration)}
        onClose={() => setSuccessModalData(null)}
        onTest={handleTestPing}
      />
    </div>
  )
}
