import { useState, useMemo } from 'react'
import {
  Package,
  Cpu,
  Zap,
  Search,
  Plus,
} from 'lucide-react'
import { useWorkspace } from '@/shared/mock'
import type { Skill, Integration, Plugin } from '@/shared/types/workspace'
import {
  IntegrationsHeader,
  IntegrationCard,
  PluginCard,
  SkillCard,
  SkillDetailDrawer,
  ConnectorDetailModal,
  PluginDetailModal,
  AddConnectorModal,
  AddSkillModal,
} from '@/features/integrations'

type TabType = 'plugins' | 'connectors' | 'skills'

export default function IntegrationsView() {
  const {
    integrations,
    skills,
    plugins,
    testIntegration,
    toggleSkill,
    installPlugin,
    uninstallPlugin,
    toggleIntegrationConnect,
    updateConnectorConfig,
    addCustomConnector,
    addCustomSkill,
  } = useWorkspace()

  const [activeTab, setActiveTab] = useState<TabType>('plugins')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Modals & Inspection State
  const [isAddConnectorOpen, setIsAddConnectorOpen] = useState(false)
  const [isAddSkillOpen, setIsAddSkillOpen] = useState(false)
  const [inspectedSkill, setInspectedSkill] = useState<Skill | null>(null)
  const [selectedConnector, setSelectedConnector] = useState<Integration | null>(null)
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null)

  // Testing State
  const [testingId, setTestingId] = useState<string | null>(null)

  const handleTestPing = async (id: string) => {
    setTestingId(id)
    await testIntegration(id)
    setTestingId(null)
  }

  // Filtered Lists
  const filteredPlugins = useMemo(() => {
    return plugins.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCat =
        selectedCategory === 'all' || p.category === selectedCategory
      return matchesSearch && matchesCat
    })
  }, [plugins, searchQuery, selectedCategory])

  const filteredConnectors = useMemo(() => {
    return integrations.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.tools.some((t) => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesCat =
        selectedCategory === 'all' || c.category === selectedCategory
      return matchesSearch && matchesCat
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
        pluginsCount={plugins.length}
        connectorsCount={integrations.length}
        activeSkillsCount={activeSkillsCount}
      />

      {/* Tabs Navigation & Search Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-hairline pb-4 min-w-0">
        {/* 3 Main Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-canvas-soft border border-hairline rounded-xl w-full sm:w-fit overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('plugins')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'plugins'
                ? 'bg-primary text-canvas shadow-xs'
                : 'text-muted hover:text-ink'
            }`}
          >
            <Package size={14} />
            <span>Plugins</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                activeTab === 'plugins'
                  ? 'bg-canvas text-ink font-bold'
                  : 'bg-surface-strong text-muted'
              }`}
            >
              {plugins.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('connectors')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'connectors'
                ? 'bg-primary text-canvas shadow-xs'
                : 'text-muted hover:text-ink'
            }`}
          >
            <Cpu size={14} />
            <span>Connectors</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                activeTab === 'connectors'
                  ? 'bg-canvas text-ink font-bold'
                  : 'bg-surface-strong text-muted'
              }`}
            >
              {integrations.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('skills')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'skills'
                ? 'bg-primary text-canvas shadow-xs'
                : 'text-muted hover:text-ink'
            }`}
          >
            <Zap size={14} />
            <span>Skills</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                activeTab === 'skills'
                  ? 'bg-canvas text-ink font-bold'
                  : 'bg-surface-strong text-muted'
              }`}
            >
              {activeSkillsCount}/{skills.length}
            </span>
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto min-w-0">
          <div className="relative flex-1 sm:w-56 md:w-64 min-w-0">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8.5 pr-3 py-1.5 bg-surface-card border border-hairline rounded-lg text-xs text-ink placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 bg-surface-card border border-hairline rounded-lg text-xs text-ink focus:outline-none focus:border-primary cursor-pointer font-mono shrink-0"
          >
            <option value="all">All Categories</option>
            <option value="devops">DevOps / Git</option>
            <option value="qa_testing">QA & Testing</option>
            <option value="security">Security & CVE</option>
            <option value="knowledge">Knowledge & Vault</option>
            <option value="database">Database & Schema</option>
            <option value="productivity">Productivity</option>
          </select>
        </div>
      </div>

      {/* Tab 1: Plugins */}
      {activeTab === 'plugins' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-muted">
            <span>
              Showing <strong>{filteredPlugins.length}</strong> Plugins
            </span>
            <span className="text-[11px] text-primary">
              1-Click activates both Connectors & Skills
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {filteredPlugins.map((plugin) => (
              <PluginCard
                key={plugin.id}
                plugin={plugin}
                allConnectors={integrations}
                allSkills={skills}
                onOpenDetail={() => setSelectedPlugin(plugin)}
                onToggleInstall={() =>
                  plugin.installed
                    ? uninstallPlugin(plugin.id)
                    : installPlugin(plugin.id)
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Connectors */}
      {activeTab === 'connectors' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-muted">
            <span>
              Showing <strong>{filteredConnectors.length}</strong> Connectors
            </span>
            <button
              onClick={() => setIsAddConnectorOpen(true)}
              className="text-primary hover:underline flex items-center gap-1 cursor-pointer font-semibold"
            >
              <Plus size={13} />
              <span>Register MCP Server</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {filteredConnectors.map((intg) => (
              <IntegrationCard
                key={intg.id}
                integration={intg}
                onOpenDetail={() => setSelectedConnector(intg)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Skills */}
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
        </div>
      )}

      {/* Modals & Drawers */}
      <PluginDetailModal
        plugin={selectedPlugin}
        allConnectors={integrations}
        allSkills={skills}
        onClose={() => setSelectedPlugin(null)}
        onInstall={(id) => {
          installPlugin(id)
          setSelectedPlugin((prev) => (prev ? { ...prev, installed: true } : null))
        }}
        onUninstall={(id) => {
          uninstallPlugin(id)
          setSelectedPlugin((prev) => (prev ? { ...prev, installed: false } : null))
        }}
      />

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

      <AddConnectorModal
        isOpen={isAddConnectorOpen}
        onClose={() => setIsAddConnectorOpen(false)}
        onAdd={addCustomConnector}
      />

      <AddSkillModal
        isOpen={isAddSkillOpen}
        onClose={() => setIsAddSkillOpen(false)}
        onAdd={addCustomSkill}
      />
    </div>
  )
}
