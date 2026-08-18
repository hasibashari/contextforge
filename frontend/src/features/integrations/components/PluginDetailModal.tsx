import React from 'react'
import {
  X,
  Package,
  Cpu,
  Sparkles,
  Trash2,
  Terminal,
  CheckCircle2,
  Plus,
  Check,
} from 'lucide-react'
import type { Plugin, Integration, Skill } from '@/shared/types/workspace'

interface PluginDetailModalProps {
  plugin: Plugin | null
  allConnectors: Integration[]
  allSkills: Skill[]
  onClose: () => void
  onInstall: (id: string) => void
  onUninstall: (id: string) => void
}

export const PluginDetailModal: React.FC<PluginDetailModalProps> = ({
  plugin,
  allConnectors,
  allSkills,
  onClose,
  onInstall,
  onUninstall,
}) => {
  if (!plugin) return null

  const bundledConnectors = allConnectors.filter((c) =>
    plugin.bundledConnectorIds.includes(c.id)
  )
  const bundledSkills = allSkills.filter((s) =>
    plugin.bundledSkillIds.includes(s.id)
  )

  const totalTools = bundledConnectors.reduce(
    (acc, curr) => acc + (curr.tools?.length || 0),
    0
  )

  const isInstalled = plugin.installed

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-ink/40 backdrop-blur-xs">
      <div className="bg-surface-card border border-hairline rounded-xl sm:rounded-2xl max-w-2xl w-full p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto overscroll-contain animate-in fade-in zoom-in-95 duration-150">
        {/* Header with Top-Right Install / Uninstall Lifecycle Actions */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-base shadow-2xs shrink-0">
              <Package className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <h2 className="text-sm sm:text-base md:text-lg font-semibold text-ink leading-snug truncate">
                  {plugin.name}
                </h2>
                {plugin.badge && (
                  <span className="text-[9px] sm:text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-primary text-canvas font-semibold shrink-0">
                    {plugin.badge}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-[10px] sm:text-xs font-mono text-muted mt-0.5">
                <span className="truncate">by <strong className="text-body font-medium">{plugin.author}</strong></span>
                <span>·</span>
                <span>{plugin.version}</span>
                <span>·</span>
                <span
                  className={`font-semibold flex items-center gap-1 ${
                    isInstalled ? 'text-semantic-success' : 'text-muted'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isInstalled ? 'bg-semantic-success' : 'bg-muted'
                    }`}
                  />
                  {isInstalled ? 'Installed' : 'Available'}
                </span>
              </div>
            </div>
          </div>

          {/* Top-Right Action Controls (Install / Uninstall + Close) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {isInstalled ? (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] sm:text-[11px] font-mono text-semantic-success font-semibold px-2 py-0.5 sm:py-1 rounded-lg bg-semantic-success/10 border border-semantic-success/20 hidden md:flex items-center gap-1">
                  <CheckCircle2 size={12} />
                  <span>Installed</span>
                </span>
                <button
                  type="button"
                  onClick={() => onUninstall(plugin.id)}
                  className="flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold text-semantic-error hover:bg-semantic-error/10 border border-semantic-error/30 transition-colors cursor-pointer"
                  title="Uninstall plugin pack"
                >
                  <Trash2 size={13} />
                  <span className="hidden xs:inline sm:inline">Uninstall</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onInstall(plugin.id)}
                className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1 sm:py-1.5 bg-primary hover:bg-primary/90 text-canvas text-[11px] sm:text-xs font-semibold rounded-lg sm:rounded-xl shadow-xs transition-colors cursor-pointer"
                title="1-Click Install Plugin Pack"
              >
                <Plus size={14} />
                <span>Install Pack</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-canvas-soft text-muted hover:text-ink cursor-pointer transition-colors"
              title="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Description */}
        <div className="p-3.5 bg-canvas-soft rounded-xl border border-hairline text-xs text-body leading-relaxed">
          {plugin.description}
        </div>

        {/* Summary Metric Stats */}
        <div className="grid grid-cols-3 gap-3 text-xs font-mono">
          <div className="p-3 rounded-xl bg-canvas border border-hairline space-y-1">
            <div className="text-muted text-[10px] uppercase tracking-caption flex items-center gap-1">
              <Cpu size={11} className="text-primary" />
              <span>Connectors</span>
            </div>
            <div className="font-semibold text-ink">
              {bundledConnectors.length} Included
            </div>
          </div>

          <div className="p-3 rounded-xl bg-canvas border border-hairline space-y-1">
            <div className="text-muted text-[10px] uppercase tracking-caption flex items-center gap-1">
              <Sparkles size={11} className="text-[#8c52ff]" />
              <span>Reasoning Skills</span>
            </div>
            <div className="font-semibold text-ink">
              {bundledSkills.length} Equipped
            </div>
          </div>

          <div className="p-3 rounded-xl bg-canvas border border-hairline space-y-1">
            <div className="text-muted text-[10px] uppercase tracking-caption flex items-center gap-1">
              <Terminal size={11} className="text-semantic-success" />
              <span>Total Tools</span>
            </div>
            <div className="font-semibold text-semantic-success">
              {totalTools} Permitted
            </div>
          </div>
        </div>

        {/* Bundled Connectors List */}
        <div className="space-y-2">
          <div className="text-xs font-mono uppercase tracking-caption text-primary flex items-center gap-1.5">
            <Cpu size={13} />
            <span>Bundled MCP Connectors:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
            {bundledConnectors.map((c) => (
              <div
                key={c.id}
                className="p-3 rounded-xl bg-canvas border border-hairline flex items-start justify-between gap-2"
              >
                <div>
                  <div className="font-bold text-ink text-xs">{c.name}</div>
                  <div className="text-[11px] text-body mt-0.5 line-clamp-1">{c.description}</div>
                </div>
                <span className="text-[10px] text-muted shrink-0">
                  {c.tools.length} Tools
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bundled Skills List */}
        <div className="space-y-2">
          <div className="text-xs font-mono uppercase tracking-caption text-[#8c52ff] flex items-center gap-1.5">
            <Sparkles size={13} />
            <span>Bundled Reasoning Skills:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
            {bundledSkills.map((s) => (
              <div
                key={s.id}
                className="p-3 rounded-xl bg-canvas border border-hairline flex items-start justify-between gap-2"
              >
                <div>
                  <div className="font-bold text-ink text-xs">{s.name}</div>
                  <div className="text-[11px] text-muted mt-0.5 line-clamp-1">{s.sopSummary}</div>
                </div>
                <span className="text-[10px] uppercase text-primary shrink-0">
                  {s.category.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-hairline flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-primary hover:bg-primary/90 text-xs font-semibold text-canvas rounded-xl shadow-xs cursor-pointer transition-colors flex items-center gap-1.5"
          >
            <Check size={14} />
            <span>Done</span>
          </button>
        </div>
      </div>
    </div>
  )
}
