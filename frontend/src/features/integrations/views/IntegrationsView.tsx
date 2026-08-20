import { useState, useMemo, useEffect } from 'react'
import {
  Cpu,
  Sparkles,
  Search,
  Plus,
  RotateCcw,
} from 'lucide-react'
import { useWorkspace } from '@/shared/mock'
import type { Skill, Integration } from '@/shared/types/workspace'
import {
  IntegrationsHeader,
  IntegrationCard,
  SkillCard,
  SkillDetailDrawer,
  ConnectorDetailModal,
  ConnectAuthModal,
  AddSkillModal,
} from '@/features/integrations'
import { EmptyState, IconBox } from '@/shared/components'

type TabType = 'connectors' | 'skills'

export default function IntegrationsView() {
  const {
    integrations,
    skills,
    testIntegration,
    toggleSkill,
    toggleIntegrationConnect,
    updateConnectorConfig,
    addCustomSkill,
    refreshIntegrations,
    showToast,
  } = useWorkspace()

  const [activeTab, setActiveTab] = useState<TabType>('connectors')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Modals & Inspection State
  const [isAddSkillOpen, setIsAddSkillOpen] = useState(false)
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
        (selectedCategory === 'disconnected' && c.status !== 'connected') ||
        (c.transport || 'stdio') === selectedCategory ||
        (selectedCategory === 'streamable_http' && c.transport === 'streamable_http')

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
      <IntegrationsHeader
        connectorsCount={integrations.length}
        activeSkillsCount={activeSkillsCount}
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
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
          <input
            type="text"
            placeholder={`Search ${activeTab === 'connectors' ? 'MCP servers & tools' : 'skill SOPs'}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-canvas border border-hairline rounded-lg text-xs font-mono text-ink placeholder:text-muted focus:outline-none focus:border-primary"
          />
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
                { id: 'stdio', label: 'stdio (Local)' },
                { id: 'streamable_http', label: 'Streamable HTTP' },
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
              Showing <strong>{filteredSkills.length}</strong> Skills
            </span>
            <button
              onClick={() => setIsAddSkillOpen(true)}
              className="text-primary hover:underline flex items-center gap-1 cursor-pointer font-semibold"
            >
              <Plus size={13} />
              <span>Author New Skill SOP</span>
            </button>
          </div>

          {filteredSkills.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              {filteredSkills.map((skill) => (
                <SkillCard
                  key={skill.id}
                  skill={skill}
                  onToggle={() => toggleSkill(skill.id)}
                  onInspect={() => setInspectedSkill(skill)}
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
                  : 'Author a custom procedural playbook to teach agents standard operating procedures.'
              }
              action={{
                label: 'Author New Skill SOP',
                onClick: () => setIsAddSkillOpen(true),
                icon: <Plus size={14} />,
              }}
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

      <SkillDetailDrawer
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

      <AddSkillModal
        isOpen={isAddSkillOpen}
        onClose={() => setIsAddSkillOpen(false)}
        onAdd={addCustomSkill}
      />
    </div>
  )
}
