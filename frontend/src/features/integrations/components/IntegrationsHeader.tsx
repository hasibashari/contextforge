import React from 'react'
import { Sparkles, Package, Cpu, Zap } from 'lucide-react'

interface IntegrationsHeaderProps {
  pluginsCount: number
  connectorsCount: number
  activeSkillsCount: number
  onAddConnector: () => void
  onAddSkill: () => void
}

export const IntegrationsHeader: React.FC<IntegrationsHeaderProps> = ({
  pluginsCount,
  connectorsCount,
  activeSkillsCount,
  onAddConnector,
  onAddSkill,
}) => {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface-card border border-hairline p-5 sm:p-6 rounded-xl shadow-xs">
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-caption text-primary mb-1">
          <Sparkles size={13} />
          <span>Ecosystem Hub & Extensibility</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">
          Connectors, Plugins & Skills
        </h1>
        <p className="text-xs sm:text-sm text-body mt-1 max-w-2xl">
          Discover curated tool bundles, connect local or remote MCP servers, and equip autonomous agents with specialized reasoning playbooks.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
        <div className="flex items-center gap-3 bg-canvas-soft border border-hairline rounded-lg px-3 py-1.5 text-ink">
          <span className="flex items-center gap-1">
            <Package size={13} className="text-primary" />
            <strong className="text-ink">{pluginsCount}</strong> Packs
          </span>
          <span className="text-hairline">|</span>
          <span className="flex items-center gap-1">
            <Cpu size={13} className="text-semantic-success" />
            <strong className="text-ink">{connectorsCount}</strong> MCP
          </span>
          <span className="text-hairline">|</span>
          <span className="flex items-center gap-1">
            <Zap size={13} className="text-[#8c52ff]" />
            <strong className="text-ink">{activeSkillsCount}</strong> Active Skills
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onAddConnector}
            className="px-3 py-1.5 bg-canvas-soft hover:bg-canvas text-ink text-xs font-semibold border border-hairline rounded-lg transition-colors cursor-pointer"
          >
            + Add MCP
          </button>
          <button
            onClick={onAddSkill}
            className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-canvas text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            + New Skill
          </button>
        </div>
      </div>
    </div>
  )
}

