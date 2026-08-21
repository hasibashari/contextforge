import { useState, useMemo, useEffect } from 'react'
import {
  Cpu,
  Sparkles,
  Search,
  Plus,
  RotateCcw,
  Settings,
} from 'lucide-react'
import { useWorkspace } from '@/shared/mock'
import type { Skill, Integration } from '@/shared/types/workspace'
import {
  IntegrationCard,
  SkillDetailModal,
  ConnectorDetailModal,
  ConnectAuthModal,
} from '@/features/integrations'
import {
  EmptyState,
  IconBox,
  SkillIconBox,
  PageHeader,
  EcosystemCard,
} from '@/shared/components'

type TabType = 'connectors' | 'skills'

export default function IntegrationsView() {
  const {
    integrations,
    skills,
    testIntegration,
    toggleSkill,
    toggleIntegrationConnect,
    updateConnectorConfig,
    refreshIntegrations,
    showToast,
  } = useWorkspace()

  const [activeTab, setActiveTab] = useState<TabType>('connectors')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Modals & Inspection State
  const [inspectedSkill, setInspectedSkill] = useState<Skill | null>(null)
  const [selectedConnector, setSelectedConnector] = useState<Integration | null>(null)
  const [connectingConnector, setConnectingConnector] = useState<Integration | null>(null)

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

  // Filtered Lists
  const filteredConnectors = useMemo(() => {
    return integrations.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.tools.some((t) => t.name.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesFilter =
        selectedCategory === 'all' ||
        (selectedCategory === 'connected' && c.status === 'connected') ||
        (selectedCategory === 'disconnected' && c.status !== 'connected')

      return matchesSearch && matchesFilter
    })
  }, [integrations, searchQuery, selectedCategory])

  const filteredSkills = useMemo(() => {
    return skills.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.sopSummary.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCat =
        selectedCategory === 'all' || s.category === selectedCategory
      return matchesSearch && matchesCat
    })
  }, [skills, searchQuery, selectedCategory])

  const activeSkillsCount = skills.filter((s) => s.enabled).length

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
      {/* Top Banner Header */}
      <PageHeader
        eyebrow="Extensibility & Agentic Tools"
        title="MCP Tools & Reasoning Skills"
        description="Connect Model Context Protocol (MCP) servers to give agents tool execution capabilities, and configure reasoning SOP playbooks (Skills) to guide problem-solving workflows."
        actions={
          <div className="flex items-center gap-3 bg-canvas-soft border border-hairline rounded-xl px-3.5 py-2 text-ink shadow-2xs whitespace-nowrap">
            <span className="flex items-center gap-1.5">
              <Cpu size={13} className="text-primary" />
              <strong className="text-ink font-semibold">{integrations.length}</strong>
              <span className="text-muted">MCP Tools</span>
            </span>
            <span className="text-hairline">|</span>
            <span className="flex items-center gap-1.5">
              <Sparkles size={13} className="text-timeline-edit" />
              <strong className="text-ink font-semibold">{activeSkillsCount}</strong>
              <span className="text-muted">Active Skills</span>
            </span>
          </div>
        }
      />

      {/* Tab Navigation (2 Clean Pillars: MCP Tools & Skills SOP) */}
      <div className="flex items-center gap-2 border-b border-hairline pb-2 text-xs font-mono font-semibold overflow-x-auto">
        <button
          onClick={() => {
            setActiveTab('connectors')
            setSelectedCategory('all')
          }}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer shrink-0 ${
            activeTab === 'connectors'
              ? 'bg-ink text-canvas shadow-xs'
              : 'text-muted hover:text-ink hover:bg-canvas-soft'
          }`}
        >
          <Cpu size={14} />
          <span>MCP Catalog ({integrations.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('skills')
            setSelectedCategory('all')
          }}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer shrink-0 ${
            activeTab === 'skills'
              ? 'bg-ink text-canvas shadow-xs'
              : 'text-muted hover:text-ink hover:bg-canvas-soft'
          }`}
        >
          <Sparkles size={14} />
          <span>Reasoning Skills SOP ({skills.length})</span>
        </button>
      </div>

      {/* Global Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-surface-card p-3 rounded-xl border border-hairline shadow-2xs">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted pointer-events-none" />
          <input
            type="text"
            placeholder={`Search ${activeTab === 'connectors' ? 'MCP servers & tools' : 'skill SOPs'}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-canvas border border-hairline rounded-lg text-xs font-mono text-ink placeholder:text-muted focus:outline-none focus:border-primary shadow-2xs transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink text-xs cursor-pointer p-0.5"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 text-xs font-mono">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-lg text-xs transition-colors cursor-pointer shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-ink text-canvas font-semibold shadow-2xs'
                : 'bg-canvas-soft text-body hover:text-ink border border-hairline'
            }`}
          >
            All
          </button>
          {activeTab === 'connectors'
            ? [
                { id: 'connected', label: 'Connected' },
                { id: 'disconnected', label: 'Ready to Connect' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedCategory(p.id)}
                  className={`px-3 py-1 rounded-lg text-xs transition-colors cursor-pointer shrink-0 ${
                    selectedCategory === p.id
                      ? 'bg-ink text-canvas font-semibold shadow-2xs'
                      : 'bg-canvas-soft text-body hover:text-ink border border-hairline'
                  }`}
                >
                  {p.label}
                </button>
              ))
            : ['engineering', 'security', 'knowledge', 'productivity'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-xs capitalize transition-colors cursor-pointer shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-ink text-canvas font-semibold shadow-2xs'
                      : 'bg-canvas-soft text-body hover:text-ink border border-hairline'
                  }`}
                >
                  {cat}
                </button>
              ))}
        </div>
      </div>

      {/* Tab 1: Connectors (MCP Tools Catalog) */}
      {activeTab === 'connectors' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-muted">
            <span>
              Showing <strong>{filteredConnectors.length}</strong> Official MCP Servers
            </span>
          </div>

          {filteredConnectors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              {filteredConnectors.map((intg) => (
                <IntegrationCard
                  key={intg.id}
                  integration={intg}
                  onOpenDetail={() => setSelectedConnector(intg)}
                  onConnect={() => setConnectingConnector(intg)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<IconBox size="lg" variant="primary" icon={<Cpu size={22} />} />}
              title="No MCP Connectors Found"
              description={
                searchQuery || selectedCategory !== 'all'
                  ? `No connectors match your search "${searchQuery}" or filter.`
                  : 'Official Model Context Protocol integrations will appear here.'
              }
              secondaryAction={
                searchQuery || selectedCategory !== 'all'
                  ? {
                      label: 'Reset Filters',
                      onClick: () => {
                        setSearchQuery('')
                        setSelectedCategory('all')
                      },
                      icon: <RotateCcw size={13} />,
                    }
                  : undefined
              }
            />
          )}
        </div>
      )}

      {/* Tab 2: Skills (SOPs) */}
      {activeTab === 'skills' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-muted">
            <span>
              Showing <strong>{filteredSkills.length}</strong> Built-in SOP Skills
            </span>
            <span className="text-[11px] text-muted flex items-center gap-1.5 bg-canvas-soft px-2.5 py-1 rounded-md border border-hairline">
              <Sparkles size={12} className="text-primary" />
              <span>Synced from docs/SKILL/</span>
            </span>
          </div>

          {filteredSkills.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              {filteredSkills.map((skill) => (
                <EcosystemCard
                  key={skill.id}
                  icon={<SkillIconBox skill={skill} category={skill.category} size="sm" />}
                  title={skill.name}
                  description={skill.description}
                  badge={skill.isCustom ? 'Custom' : skill.category.replace('_', ' ')}
                  metaLine={`${skill.assignedTools.length} Authorized Tools · ${
                    skill.enabled ? 'Active in Workspace' : 'Inactive SOP'
                  }`}
                  actionIcon={skill.enabled ? <Settings size={16} /> : <Plus size={16} />}
                  onClick={() => setInspectedSkill(skill)}
                  onActionClick={() => setInspectedSkill(skill)}
                  actionTooltip={
                    skill.enabled
                      ? 'Active SOP: Click to inspect & configure'
                      : 'Enable reasoning skill SOP'
                  }
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<IconBox size="lg" variant="purple" icon={<Sparkles size={22} />} />}
              title="No Reasoning Skills Found"
              description={
                searchQuery || selectedCategory !== 'all'
                  ? `No skill SOPs match your search "${searchQuery}".`
                  : 'All reasoning skill playbooks are loaded from docs/SKILL/.'
              }
              secondaryAction={
                searchQuery || selectedCategory !== 'all'
                  ? {
                      label: 'Reset Filters',
                      onClick: () => {
                        setSearchQuery('')
                        setSelectedCategory('all')
                      },
                      icon: <RotateCcw size={13} />,
                    }
                  : undefined
              }
            />
          )}
        </div>
      )}

      {/* Modals & Drawers */}
      <ConnectorDetailModal
        integration={selectedConnector}
        onClose={() => setSelectedConnector(null)}
        onTest={handleTestPing}
        onToggleConnect={(id) => {
          toggleIntegrationConnect(id)
          setSelectedConnector((prev) =>
            prev
              ? {
                  ...prev,
                  status: prev.status === 'connected' ? 'disconnected' : 'connected',
                }
              : null
          )
        }}
        onSaveConfig={(id, updates) => {
          updateConnectorConfig(id, updates)
          setSelectedConnector((prev) => (prev ? { ...prev, ...updates } : null))
        }}
        isTesting={Boolean(selectedConnector && testingId === selectedConnector.id)}
      />

      <ConnectAuthModal
        integration={connectingConnector}
        isOpen={Boolean(connectingConnector)}
        onClose={() => setConnectingConnector(null)}
      />

      <SkillDetailModal
        skill={inspectedSkill}
        onClose={() => setInspectedSkill(null)}
        onToggle={() => {
          if (inspectedSkill) {
            toggleSkill(inspectedSkill.id)
            setInspectedSkill({
              ...inspectedSkill,
              enabled: !inspectedSkill.enabled,
            })
          }
        }}
      />
    </div>
  )
}
