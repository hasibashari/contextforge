import React, { useState } from 'react'
import {
  ShieldCheck,
  Save,
  Sparkles,
  Cpu,
  Database,
  Terminal,
  Brain,
  BookOpen,
  FileCode,
  RotateCcw,
} from 'lucide-react'
import { useWorkspace } from '@/shared/context'
import { MarkdownRenderer } from '@/shared/components'

export default function SettingsView() {
  const {
    showToast,
    integrations,
    skills,
    userMemories,
    memorySummary,
    clearAllMemories,
  } = useWorkspace()

  // Guardrail settings state
  const [strictHitl, setStrictHitl] = useState(() => {
    const saved = localStorage.getItem('cf_strict_hitl')
    return saved !== null ? saved === 'true' : true
  })
  const [astSandboxing, setAstSandboxing] = useState(() => {
    const saved = localStorage.getItem('cf_ast_sandboxing')
    return saved !== null ? saved === 'true' : true
  })
  const [autoVectorSync, setAutoVectorSync] = useState(() => {
    const saved = localStorage.getItem('cf_auto_vector_sync')
    return saved !== null ? saved === 'true' : true
  })

  const handleSavePolicies = (e: React.FormEvent) => {
    e.preventDefault()
    localStorage.setItem('cf_strict_hitl', String(strictHitl))
    localStorage.setItem('cf_ast_sandboxing', String(astSandboxing))
    localStorage.setItem('cf_auto_vector_sync', String(autoVectorSync))
    showToast('✓ Workspace safety policies and guardrails saved!')
  }

  const handleClearMemory = async () => {
    if (window.confirm('Are you sure you want to clear and reset your AI Memory Summary?')) {
      await clearAllMemories()
    }
  }

  const activeSummaryContent = memorySummary || (userMemories.length > 0
    ? `# Memory Summary\n\n` +
      userMemories
        .map(
          (m) =>
            `- **${m.category.toUpperCase()}** (${m.key.replace(/_/g, ' ')}): ${m.value}`,
        )
        .join('\n')
    : '')

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl w-full mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface-card border border-hairline p-5 sm:p-6 rounded-xl sm:rounded-2xl shadow-xs">
        <div className="min-w-0 flex-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-caption text-primary mb-1">
            <Sparkles size={13} />
            <span>Workspace Preferences & Configuration</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">
            Settings & Memory Summary
          </h1>
          <p className="text-xs sm:text-sm text-body mt-1">
            Manage cross-session AI memories, autonomous execution guardrails, and workspace runtime policies.
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. AI MEMORY SUMMARY (ChatGPT / Claude Pattern - memory-summary.md)       */}
      {/* ========================================================================= */}
      <div className="bg-surface-card border border-hairline rounded-xl p-5 sm:p-6 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-hairline pb-3">
          <div className="flex items-center gap-2">
            <Brain size={17} className="text-primary" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-ink">
                  AI Memory Summary
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-primary/10 text-primary border border-primary/20">
                  <FileCode size={11} />
                  <span>memory-summary.md</span>
                </span>
              </div>
              <p className="text-[11px] text-body mt-0.5">
                Consolidated developer profile and preferences automatically maintained by the system and injected into Gemini context.
              </p>
            </div>
          </div>
          {activeSummaryContent && (
            <button
              type="button"
              onClick={handleClearMemory}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-semantic-error/10 hover:bg-semantic-error/20 text-semantic-error font-medium text-xs rounded-lg transition-colors cursor-pointer shrink-0"
              title="Clear all saved memories and reset memory-summary.md"
            >
              <RotateCcw size={13} />
              <span>Clear Memory</span>
            </button>
          )}
        </div>

        {/* Memory Summary Markdown Document Preview */}
        {activeSummaryContent ? (
          <div className="rounded-xl bg-canvas-soft border border-hairline p-4 space-y-3">
            <div className="text-[10px] font-mono uppercase tracking-caption text-muted flex items-center justify-between">
              <span>Active Context Injected to Gemini:</span>
              <span>Auto-Managed</span>
            </div>
            <div className="bg-surface-card p-3.5 rounded-lg border border-hairline text-xs">
              <MarkdownRenderer content={activeSummaryContent} />
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-body text-xs bg-canvas-soft rounded-xl border border-hairline space-y-2">
            <BookOpen size={24} className="mx-auto text-muted opacity-50" />
            <p className="font-medium text-ink">Memory bank is empty</p>
            <p className="text-[11px] text-muted max-w-sm mx-auto">
              As you interact with your Personal Assistant in chat, the system will automatically summarize and remember your coding preferences and mission here.
            </p>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. SAFETY & HITL POLICIES FORM                                            */}
      {/* ========================================================================= */}
      <form onSubmit={handleSavePolicies} className="space-y-6">
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
                  When enabled, agents cannot dispatch filesystem write mutations or database modifications without explicit approval.
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
                  Automated Sandboxed AST & Security Pre-Flight Check
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
              <div className="text-xs font-semibold text-ink">Google Gemini 3.5 Flash</div>
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
