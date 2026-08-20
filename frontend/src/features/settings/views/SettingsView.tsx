import React, { useState } from 'react'
import {
  ShieldCheck,
  Save,
  Sparkles,
  Cpu,
  Database,
  Terminal,
} from 'lucide-react'
import { useWorkspace } from '@/shared/mock'

export default function SettingsView() {
  const { showToast, integrations, skills } = useWorkspace()
  const [strictHitl, setStrictHitl] = useState(true)
  const [astSandboxing, setAstSandboxing] = useState(true)
  const [autoVectorSync, setAutoVectorSync] = useState(true)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    showToast('✓ Workspace safety policies and guardrails saved!')
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl w-full mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface-card border border-hairline p-5 sm:p-6 rounded-xl sm:rounded-2xl shadow-xs">
        <div className="min-w-0 flex-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-caption text-primary mb-1">
            <Sparkles size={13} />
            <span>Runtime Configuration & Guardrails</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">
            Settings & Safety Policies
          </h1>
          <p className="text-xs sm:text-sm text-body mt-1">
            Manage autonomous execution guardrails, Human-in-the-Loop approval enforcement, and workspace runtime policies.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Safety & HITL Guardrails */}
        <div className="bg-surface-card border border-hairline rounded-xl p-5 sm:p-6 space-y-5 shadow-xs">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink border-b border-hairline pb-3">
            <ShieldCheck size={16} className="text-semantic-success" />
            <span>Safety & Human-in-the-Loop Policies</span>
          </div>

          <div className="space-y-3.5">
            <label className="flex items-start gap-3 p-3.5 rounded-xl bg-canvas-soft border border-hairline hover:border-hairline-strong transition-colors cursor-pointer select-none">
              <input
                type="checkbox"
                checked={strictHitl}
                onChange={(e) => setStrictHitl(e.target.checked)}
                className="mt-0.5 rounded text-primary focus:ring-0 cursor-pointer"
              />
              <div>
                <div className="text-xs font-semibold text-ink">
                  Enforce Strict Human-in-the-Loop Sign-Off Gate
                </div>
                <p className="text-[11px] text-body leading-relaxed mt-0.5">
                  When enabled, agents cannot dispatch Pull Requests, merge code, or execute filesystem write mutations without explicit human engineer sign-off in the Task Detail view.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3.5 rounded-xl bg-canvas-soft border border-hairline hover:border-hairline-strong transition-colors cursor-pointer select-none">
              <input
                type="checkbox"
                checked={astSandboxing}
                onChange={(e) => setAstSandboxing(e.target.checked)}
                className="mt-0.5 rounded text-primary focus:ring-0 cursor-pointer"
              />
              <div>
                <div className="text-xs font-semibold text-ink">
                  Automated Sandboxed AST & CVE Pre-Flight Check
                </div>
                <p className="text-[11px] text-body leading-relaxed mt-0.5">
                  Automatically spins up isolated test runners and dependency audits before formatting any Action Plan deliverable.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3.5 rounded-xl bg-canvas-soft border border-hairline hover:border-hairline-strong transition-colors cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoVectorSync}
                onChange={(e) => setAutoVectorSync(e.target.checked)}
                className="mt-0.5 rounded text-primary focus:ring-0 cursor-pointer"
              />
              <div>
                <div className="text-xs font-semibold text-ink">
                  Continuous Delta Ingestion for Knowledge Vaults
                </div>
                <p className="text-[11px] text-body leading-relaxed mt-0.5">
                  Watches mounted local Obsidian vaults and knowledge repositories for markdown edits and automatically schedules vector re-indexing chunks.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Engine Telemetry & System Info */}
        <div className="bg-surface-card border border-hairline rounded-xl p-5 sm:p-6 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink border-b border-hairline pb-3">
            <Cpu size={16} className="text-primary" />
            <span>Workspace Platform & Engine Telemetry</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 font-mono text-xs">
            <div className="p-3 bg-canvas-soft border border-hairline rounded-xl space-y-1">
              <div className="text-[10px] text-muted uppercase flex items-center gap-1">
                <Sparkles size={11} className="text-primary" />
                <span>Reasoning Core</span>
              </div>
              <div className="text-xs font-semibold text-ink">Google Gemini 3.x Flash</div>
              <div className="text-[10px] text-muted">DeepMind SDK Integration</div>
            </div>

            <div className="p-3 bg-canvas-soft border border-hairline rounded-xl space-y-1">
              <div className="text-[10px] text-muted uppercase flex items-center gap-1">
                <Database size={11} className="text-[#3b6ea5]" />
                <span>Vector & Database</span>
              </div>
              <div className="text-xs font-semibold text-ink">PostgreSQL pgvector</div>
              <div className="text-[10px] text-muted">1536-dim Embedding Chunks</div>
            </div>

            <div className="p-3 bg-canvas-soft border border-hairline rounded-xl space-y-1">
              <div className="text-[10px] text-muted uppercase flex items-center gap-1">
                <Terminal size={11} className="text-timeline-edit" />
                <span>Active Ecosystem</span>
              </div>
              <div className="text-xs font-semibold text-ink">
                {integrations.length} MCP Tools · {skills.length} Skills
              </div>
              <div className="text-[10px] text-muted">Standard Operating Protocols</div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-active text-on-primary font-semibold text-xs rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Save size={15} />
            <span>Save Policies</span>
          </button>
        </div>
      </form>
    </div>
  )
}
