import React, { useState } from 'react'
import {
  Package,
  Cpu,
  Sparkles,
  Trash2,
  Terminal,
  Plus,
  Check,
  Folder,
  BookOpen,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react'
import type { Plugin, Integration, Skill } from '@/shared/types/workspace'
import { useWorkspace } from '@/shared/mock'
import { obsidianBridgeService } from '@/shared/services/obsidianBridge.service'
import { Modal, ModalHeader, ModalFooter } from '@/shared/components/ui/Modal'
import { StatusPill } from '@/shared/components/ui/StatusPill'
import { IconBox } from '@/shared/components/ui/IconBox'
import { ConfirmDeleteModal } from '@/shared/components/ui/ConfirmDeleteModal'

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
  const { knowledgeSources } = useWorkspace()
  const [showUninstallModal, setShowUninstallModal] = useState(false)
  const [selectedSourceId, setSelectedSourceId] = useState<string>(
    knowledgeSources[0]?.id || ''
  )

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
  const selectedSource =
    knowledgeSources.find((s) => s.id === selectedSourceId) ||
    knowledgeSources[0] ||
    null

  const isKnowledgeRelated =
    plugin.category === 'knowledge' ||
    plugin.id.includes('obsidian') ||
    plugin.bundledConnectorIds.some((id) => id.includes('filesystem') || id.includes('obsidian'))

  const handleConfirmUninstall = () => {
    onUninstall(plugin.id)
    setShowUninstallModal(false)
    onClose()
  }

  const renderSubtitle = () => (
    <>
      <span className="truncate">
        by <strong className="text-body font-medium">{plugin.author}</strong>
      </span>
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
          onClick={() => setShowUninstallModal(true)}
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
    <>
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

        <div className="space-y-3.5 text-xs font-sans">
          {/* Description */}
          <p className="text-body leading-relaxed text-xs font-sans">
            {plugin.description}
          </p>

          {/* Compact Stats Bar */}
          <div className="grid grid-cols-3 gap-2 p-2.5 bg-canvas-soft rounded-lg border border-hairline font-mono text-[11px]">
            <div className="flex items-center gap-1.5 text-ink truncate">
              <Cpu size={12} className="text-primary shrink-0" />
              <span>{bundledConnectors.length} Connectors</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#8c52ff] truncate">
              <Sparkles size={12} className="shrink-0" />
              <span>{bundledSkills.length} Skills</span>
            </div>
            <div className="flex items-center gap-1.5 text-semantic-success truncate">
              <Terminal size={12} className="shrink-0" />
              <span>{totalTools} Tools</span>
            </div>
          </div>

          {/* Target Knowledge Source Binding (Dynamic Web Mount Linkage) */}
          {isKnowledgeRelated && (
            <div className="p-3 bg-canvas-soft rounded-xl border border-hairline space-y-2 font-sans">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-mono uppercase tracking-caption text-primary flex items-center gap-1.5">
                  <BookOpen size={12} />
                  <span>Target Knowledge Base Binding:</span>
                </div>
                <span className="text-[10px] font-mono text-semantic-success flex items-center gap-1">
                  <ShieldCheck size={11} />
                  <span>Mounted via Web</span>
                </span>
              </div>

              {knowledgeSources.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedSourceId || (selectedSource?.id ?? '')}
                      onChange={(e) => setSelectedSourceId(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-canvas border border-hairline rounded-lg text-ink focus:outline-none focus:border-primary text-xs font-mono cursor-pointer"
                    >
                      {knowledgeSources.map((ks) => (
                        <option key={ks.id} value={ks.id}>
                          📚 {ks.name} ({ks.filesCount} files) · {ks.type.replace('_', ' ')}
                        </option>
                      ))}
                    </select>

                    {selectedSource?.type === 'obsidian_vault' && (
                      <button
                        type="button"
                        onClick={() =>
                          obsidianBridgeService.openInObsidianApp(
                            selectedSource.subfolderScope || selectedSource.name,
                            ''
                          )
                        }
                        className="px-2.5 py-1.5 bg-[#7c3aed] hover:bg-[#7c3aed]/90 text-white font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[11px] shrink-0"
                        title="Open this vault in Obsidian Desktop"
                      >
                        <ExternalLink size={11} />
                        <span>Open Vault</span>
                      </button>
                    )}
                  </div>

                  {selectedSource && (
                    <div className="flex items-center justify-between text-[11px] text-muted font-mono bg-canvas px-2.5 py-1.5 rounded-lg border border-hairline">
                      <span className="truncate flex items-center gap-1.5">
                        <CheckCircle2 size={11} className="text-semantic-success shrink-0" />
                        <span>Active Route: {selectedSource.location}</span>
                      </span>
                      <span className="text-[10px] text-primary shrink-0">
                        {selectedSource.filesCount} Documents
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-2.5 bg-canvas rounded-lg border border-dashed border-hairline text-center space-y-1">
                  <div className="text-[11px] text-ink font-semibold flex items-center justify-center gap-1">
                    <Folder size={12} className="text-muted" />
                    <span>No Knowledge Sources Mounted Yet</span>
                  </div>
                  <p className="text-[10px] text-muted">
                    Connect an Obsidian Vault or Folder in the <strong>Knowledge Base</strong> tab to bind it here.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Bundled Connectors List */}
          <div className="space-y-1.5 font-sans">
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
                  <span className="text-[10px] text-muted shrink-0 font-sans">
                    {c.tools.length} Tools
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Bundled Skills List */}
          <div className="space-y-1.5 font-sans">
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
                  <span className="text-[10px] uppercase text-primary shrink-0 font-sans">
                    {s.category.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <ModalFooter className="justify-end font-sans">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-primary hover:bg-primary/90 text-xs font-semibold text-canvas rounded-lg shadow-xs cursor-pointer transition-colors flex items-center gap-1"
            >
              <Check size={13} />
              <span>Done</span>
            </button>
          </ModalFooter>
        </div>
      </Modal>

      {/* Dedicated Confirmation Modal for Plugin Uninstall */}
      <ConfirmDeleteModal
        isOpen={showUninstallModal}
        onClose={() => setShowUninstallModal(false)}
        onConfirm={handleConfirmUninstall}
        title="Uninstall Plugin Pack"
        itemName={plugin.name}
        description={`Are you sure you want to uninstall "${plugin.name}"? This will disable its ${bundledConnectors.length} bundled connectors and ${bundledSkills.length} reasoning skills.`}
        confirmLabel="Uninstall Pack"
      />
    </>
  )
}
