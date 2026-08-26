import { useState, useMemo } from 'react'
import { Bot, Sparkles, Search, RotateCcw, Settings, Plus } from 'lucide-react'
import { useWorkspace } from '@/shared'
import {
  PageHeader,
  EcosystemCard,
  AgentIconBox,
  SkillIconBox,
  EmptyState,
  IconBox,
} from '@/shared'
import { AgentInspectorModal } from '@/features/agents'
import { SkillDetailModal } from '@/features/integrations'

type TabType = 'agents' | 'skills'

export default function AgentsDirectoryView() {
  const { agents, skills, toggleSkill } = useWorkspace()
  const [activeTab, setActiveTab] = useState<TabType>('agents')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Modals state
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
  const [inspectedSkillId, setInspectedSkillId] = useState<string | null>(null)

  const selectedAgent = agents.find((a) => a.id === selectedAgentId) || null
  const inspectedSkill = skills.find((s) => s.id === inspectedSkillId) || null

  const activeSkillsCount = skills.filter((s) => s.enabled).length

  // Filtered skills list
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

  // Filtered agents list
  const filteredAgents = useMemo(() => {
    return agents.filter((a) => {
      const matchesSearch =
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.model.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesSearch
    })
  }, [agents, searchQuery])

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
      {/* Top Banner Header */}
      <PageHeader
        eyebrow="Agent Personas & Skills Catalog"
        title="Agents & SOP Playbooks"
        description="Autonomous AI agent personas equipped with specialized toolchains, and Standard Operating Procedures (Skills) defined in docs/SKILL/."
        actions={
          <div className="flex items-center gap-3 bg-surface-card border border-hairline rounded-xl px-3.5 py-1.5 text-ink shadow-2xs whitespace-nowrap text-xs font-mono">
            <span className="flex items-center gap-1.5">
              <Bot size={14} className="text-primary" />
              <strong className="text-ink font-semibold">{agents.length}</strong>
              <span className="text-muted">Personas</span>
            </span>
            <span className="text-hairline">|</span>
            <span className="flex items-center gap-1.5">
              <Sparkles size={14} className="text-purple-600 dark:text-purple-400" />
              <strong className="text-ink font-semibold">{activeSkillsCount}</strong>
              <span className="text-muted">Active SOPs</span>
            </span>
          </div>
        }
      />

      {/* Segmented Tab Navigation: Agents vs Skills */}
      <div className="flex items-center justify-between gap-3 border-b border-hairline pb-3 flex-wrap">
        <div className="flex items-center gap-1 p-1 bg-canvas-soft border border-hairline rounded-xl w-fit text-xs font-sans">
          <button
            type="button"
            onClick={() => {
              setActiveTab('agents')
              setSearchQuery('')
              setSelectedCategory('all')
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer font-medium ${
              activeTab === 'agents'
                ? 'bg-surface-card text-ink shadow-2xs font-semibold border border-hairline'
                : 'text-muted hover:text-ink hover:bg-canvas'
            }`}
          >
            <Bot size={14} className={activeTab === 'agents' ? 'text-primary' : 'text-muted'} />
            <span>Agent Personas</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${activeTab === 'agents' ? 'bg-primary-soft text-primary font-semibold' : 'bg-canvas text-muted'}`}>
              {agents.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('skills')
              setSearchQuery('')
              setSelectedCategory('all')
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer font-medium ${
              activeTab === 'skills'
                ? 'bg-surface-card text-ink shadow-2xs font-semibold border border-hairline'
                : 'text-muted hover:text-ink hover:bg-canvas'
            }`}
          >
            <Sparkles size={14} className={activeTab === 'skills' ? 'text-purple-600 dark:text-purple-400' : 'text-muted'} />
            <span>Skills & SOPs</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${activeTab === 'skills' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold' : 'bg-canvas text-muted'}`}>
              {skills.length}
            </span>
          </button>
        </div>

        {/* Global Toolbar: Search & Category Chips */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 flex-1 sm:justify-end min-w-70">
          <div className="relative w-full sm:w-64">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              type="text"
              placeholder={
                activeTab === 'agents'
                  ? 'Search personas (e.g. planner, coder)...'
                  : 'Search SOPs (e.g. obsidian, research)...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8.5 pr-3 py-1.5 bg-surface-card border border-hairline rounded-xl text-xs text-ink placeholder:text-muted focus:outline-none focus:border-primary font-sans"
            />
          </div>

          {activeTab === 'skills' && (
            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto text-[11px] font-sans">
              {['all', 'research', 'notes', 'obsidian', 'architecture'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer whitespace-nowrap capitalize text-xs ${
                    selectedCategory === cat
                      ? 'bg-primary-soft border-primary-subtle text-primary font-semibold shadow-2xs'
                      : 'bg-surface-card border-hairline text-muted hover:text-ink hover:border-hairline-strong'
                  }`}
                >
                  {cat === 'all' ? 'All' : cat}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tab 1: Agent Personas */}
      {activeTab === 'agents' && (
        <div className="space-y-4">
          {filteredAgents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              {filteredAgents.map((agent) => {
                const skillsCount = agent.assignedSkills?.length || 0
                const toolsCount = agent.assignedTools?.length || 0
                const roleSubtitle = agent.role
                  .replace(/^Side Agent:\s*/i, '')
                  .replace(/^Main\s*/i, '')

                return (
                  <EcosystemCard
                    key={agent.id}
                    icon={<AgentIconBox agent={agent} size="md" />}
                    title={agent.name}
                    subtitle={roleSubtitle}
                    description={agent.description}
                    badge={agent.model}
                    badgeVariant="primary"
                    metaLine={
                      <div className="flex items-center justify-between w-full text-[11px] font-mono">
                        <span className="flex items-center gap-2">
                          <span className="font-semibold text-ink">{skillsCount} Skills</span>
                          <span>·</span>
                          <span className="text-muted">{toolsCount} Tools</span>
                        </span>
                        <span className="text-semantic-success font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-semantic-success animate-pulse" />
                          <span>{agent.successRatePct}% Success</span>
                        </span>
                      </div>
                    }
                    onClick={() => setSelectedAgentId(agent.id)}
                    hideAction={true}
                  />
                )
              })}
            </div>
          ) : (
            <EmptyState
              icon={<IconBox size="lg" variant="primary" icon={<Bot size={22} />} />}
              title="No Agent Personas Found"
              description={`No agent personas match your query "${searchQuery}".`}
              secondaryAction={{
                label: 'Clear Search',
                onClick: () => setSearchQuery(''),
                icon: <RotateCcw size={13} />,
              }}
            />
          )}
        </div>
      )}

      {/* Tab 2: Skills Catalog (SOPs) */}
      {activeTab === 'skills' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-muted">
            <span>
              Showing <strong>{filteredSkills.length}</strong> Built-in SOP Skills
            </span>
            <span className="text-[11px] text-muted flex items-center gap-1.5 bg-canvas-soft px-2.5 py-1 rounded-md border border-hairline">
              <Sparkles size={12} className="text-purple-600 dark:text-purple-400" />
              <span>Synced from docs/SKILL/</span>
            </span>
          </div>

          {filteredSkills.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              {filteredSkills.map((skill) => (
                <EcosystemCard
                  key={skill.id}
                  icon={<SkillIconBox skill={skill} category={skill.category} size="md" />}
                  title={skill.name}
                  description={skill.description}
                  badge={skill.isCustom ? 'Custom' : skill.category.replace('_', ' ')}
                  badgeVariant={skill.enabled ? 'success' : 'neutral'}
                  metaLine={
                    <div className="flex items-center justify-between w-full text-[11px] font-mono">
                      <span>{skill.assignedTools.length} Authorized Tools</span>
                      <span className={skill.enabled ? 'text-semantic-success font-semibold' : 'text-muted'}>
                        {skill.enabled ? '● Active in Workspace' : '○ Inactive SOP'}
                      </span>
                    </div>
                  }
                  actionIcon={skill.enabled ? <Settings size={15} /> : <Plus size={15} />}
                  onClick={() => setInspectedSkillId(skill.id)}
                  onActionClick={() => setInspectedSkillId(skill.id)}
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
                  ? `No skill SOPs match your filter "${searchQuery || selectedCategory}".`
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

      {/* Detail Inspector Modals */}
      <AgentInspectorModal
        agent={selectedAgent}
        onClose={() => setSelectedAgentId(null)}
      />

      <SkillDetailModal
        skill={inspectedSkill}
        onClose={() => setInspectedSkillId(null)}
        onToggle={() => {
          if (inspectedSkill) {
            toggleSkill(inspectedSkill.id)
          }
        }}
      />
    </div>
  )
}
