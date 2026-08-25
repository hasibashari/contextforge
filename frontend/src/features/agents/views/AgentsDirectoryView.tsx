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
        a.role.toLowerCase().includes(searchQuery.toLowerCase())
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
          <div className="flex items-center gap-3 bg-canvas-soft border border-hairline rounded-xl px-3.5 py-2 text-ink shadow-2xs whitespace-nowrap">
            <span className="flex items-center gap-1.5">
              <Bot size={14} className="text-primary" />
              <strong className="text-ink font-semibold">{agents.length}</strong>
              <span className="text-muted">Personas</span>
            </span>
            <span className="text-hairline">|</span>
            <span className="flex items-center gap-1.5">
              <Sparkles size={14} className="text-timeline-edit" />
              <strong className="text-ink font-semibold">{activeSkillsCount}</strong>
              <span className="text-muted">Active Skills</span>
            </span>
          </div>
        }
      />

      {/* Tab Navigation: Agents vs Skills */}
      <div className="flex items-center gap-2 border-b border-hairline pb-2 text-xs font-mono font-semibold overflow-x-auto">
        <button
          onClick={() => {
            setActiveTab('agents')
            setSearchQuery('')
            setSelectedCategory('all')
          }}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer shrink-0 ${
            activeTab === 'agents'
              ? 'bg-ink text-canvas shadow-xs'
              : 'text-muted hover:text-ink hover:bg-canvas-soft'
          }`}
        >
          <Bot size={14} />
          <span>Agent Personas ({agents.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('skills')
            setSearchQuery('')
            setSelectedCategory('all')
          }}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer shrink-0 ${
            activeTab === 'skills'
              ? 'bg-ink text-canvas shadow-xs'
              : 'text-muted hover:text-ink hover:bg-canvas-soft'
          }`}
        >
          <Sparkles size={14} />
          <span>Skills Catalog & SOPs ({skills.length})</span>
        </button>
      </div>

      {/* Tab 1: Agent Personas */}
      {activeTab === 'agents' && (
        <div className="space-y-4">
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
                  icon={<AgentIconBox agent={agent} size="sm" />}
                  title={agent.name}
                  subtitle={roleSubtitle}
                  description={agent.description}
                  metaLine={`${skillsCount} Skills · ${toolsCount} Tools · ${agent.model} · ${agent.successRatePct}% Success`}
                  onClick={() => setSelectedAgentId(agent.id)}
                  hideAction={true}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Skills Catalog (SOPs) */}
      {activeTab === 'skills' && (
        <div className="space-y-4">
          {/* Search & Category Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                type="text"
                placeholder="Search standard operating procedures (e.g. obsidian, research, review)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-surface-card border border-hairline rounded-xl text-xs text-ink placeholder:text-muted focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto text-[11px] font-mono">
              {['all', 'research', 'notes', 'obsidian', 'architecture'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer whitespace-nowrap capitalize ${
                    selectedCategory === cat
                      ? 'bg-primary/10 border-primary/30 text-primary font-semibold'
                      : 'bg-surface-card border-hairline text-muted hover:text-ink'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

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
