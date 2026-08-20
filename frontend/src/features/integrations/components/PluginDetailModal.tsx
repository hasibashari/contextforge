import React from 'react'
import {
  Package,
  Cpu,
  Sparkles,
  Trash2,
  Terminal,
  Plus,
  Check,
} from 'lucide-react'
import type { Plugin, Integration, Skill } from '@/shared/types/workspace'
import { Modal, ModalHeader, ModalFooter } from '@/shared/components/ui/Modal'
import { StatusPill } from '@/shared/components/ui/StatusPill'
import { IconBox } from '@/shared/components/ui/IconBox'

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

  const renderSubtitle = () => (
    <>
      <span className="truncate">by <strong className="text-body font-medium">{plugin.author}</strong></span>
      <span>·</span>
      <span>{plugin.version}</span>
      <span>·</span>
      <StatusPill status={isInstalled ? 'installed' : 'available'} />
    </>
  )

  const renderActions = () => (
    <div className="flex items-center gap-1.5">
      {isInstalled ? (
        <button
          type="button"
          onClick={() => onUninstall(plugin.id)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-semantic-error hover:bg-semantic-error/10 border border-semantic-error/30 transition-colors cursor-pointer"
          title="Uninstall plugin pack"
        >
          <Trash2 size={13} />
          <span>Uninstall</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => onInstall(plugin.id)}
          className="flex items-center gap-1 px-3 py-1.5 bg-primary hover:bg-primary/90 text-canvas text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          title="1-Click Install Plugin Pack"
        >
          <Plus size={13} />
          <span>Install Pack</span>
        </button>
      )}
    </div>
  )

  return (
    <Modal isOpen={Boolean(plugin)} onClose={onClose} size="2xl">
      <ModalHeader
        icon={<IconBox size="md" variant="primary" icon={<Package size={19} />} />}
        title={plugin.name}
        badge={
          plugin.badge ? (
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-surface-strong text-ink border border-hairline font-semibold">
              {plugin.badge}
            </span>
          ) : undefined
        }
        subtitle={renderSubtitle()}
        onClose={onClose}
        actions={renderActions()}
      />

      <div className="space-y-4 text-xs">
        {/* Description */}
        <p className="text-body leading-relaxed text-xs">
          {plugin.description}
        </p>

        {/* Summary Metric Stats */}
        <div className="grid grid-cols-3 gap-2.5 font-mono">
          <div className="p-2.5 rounded-xl bg-canvas border border-hairline space-y-0.5">
            <div className="text-muted text-[10px] uppercase tracking-caption flex items-center gap-1">
              <Cpu size={11} className="text-primary" />
              <span>Connectors</span>
            </div>
            <div className="font-semibold text-ink">
              {bundledConnectors.length} Included
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-canvas border border-hairline space-y-0.5">
            <div className="text-muted text-[10px] uppercase tracking-caption flex items-center gap-1">
              <Sparkles size={11} className="text-[#8c52ff]" />
              <span>Reasoning Skills</span>
            </div>
            <div className="font-semibold text-ink">
              {bundledSkills.length} Equipped
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-canvas border border-hairline space-y-0.5">
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
        <div className="space-y-1.5">
          <div className="text-[11px] font-mono uppercase tracking-caption text-primary flex items-center gap-1.5">
            <Cpu size={12} />
            <span>Bundled MCP Connectors:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono">
            {bundledConnectors.map((c) => (
              <div
                key={c.id}
                className="p-2.5 rounded-lg bg-canvas border border-hairline flex items-start justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="font-bold text-ink text-xs truncate">{c.name}</div>
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
        <div className="space-y-1.5">
          <div className="text-[11px] font-mono uppercase tracking-caption text-[#8c52ff] flex items-center gap-1.5">
            <Sparkles size={12} />
            <span>Bundled Reasoning Skills:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono">
            {bundledSkills.map((s) => (
              <div
                key={s.id}
                className="p-2.5 rounded-lg bg-canvas border border-hairline flex items-start justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="font-bold text-ink text-xs truncate">{s.name}</div>
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
        <ModalFooter className="justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-primary hover:bg-primary/90 text-xs font-semibold text-canvas rounded-lg shadow-xs cursor-pointer transition-colors flex items-center gap-1"
          >
            <Check size={13} />
            <span>Done</span>
          </button>
        </ModalFooter>
      </div>
    </Modal>
  )
}
