import React, { useState } from 'react'
import {
  ShieldCheck,
  Cpu,
  Save,
  Sparkles,
} from 'lucide-react'
import { useWorkspace } from '@/shared/mock'

export default function SettingsView() {
  const { showToast } = useWorkspace()
  const [model, setModel] = useState('claude-3-7-sonnet')
  const [temperature, setTemperature] = useState(0.1)
  const [strictHitl, setStrictHitl] = useState(true)
  const [astSandboxing, setAstSandboxing] = useState(true)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    showToast('✓ Workspace model configuration updated!')
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-card border border-hairline p-5 sm:p-6 rounded-xl shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-caption text-primary mb-1">
            <Sparkles size={13} />
            <span>Runtime Configuration & Guardrails</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">
            Settings & Model Parameters
          </h1>
          <p className="text-xs sm:text-sm text-body mt-1">
            Configure default LLM orchestration parameters, Human-in-the-Loop approval enforcement, and AST safety thresholds.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Model Orchestration */}
        <div className="bg-surface-card border border-hairline rounded-xl p-5 sm:p-6 space-y-5 shadow-xs">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink border-b border-hairline pb-3">
            <Cpu size={16} className="text-primary" />
            <span>Default LLM Orchestrator</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-caption font-mono mb-1.5">
                Primary Reasoning Model:
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full p-2.5 bg-canvas-soft border border-hairline rounded-lg text-xs font-mono text-ink focus:outline-none focus:border-primary"
              >
                <option value="claude-3-7-sonnet">Claude 3.7 Sonnet (Recommended for AST/Coding)</option>
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Ultra-fast multi-source crawl)</option>
                <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                <option value="gpt-4o">OpenAI GPT-4o</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-caption font-mono mb-1.5">
                Temperature ({temperature}):
              </label>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full mt-2 accent-primary cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-muted mt-1">
                <span>0.0 (Deterministic Code)</span>
                <span>1.0 (Creative)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Safety & HITL Guardrails */}
        <div className="bg-surface-card border border-hairline rounded-xl p-5 sm:p-6 space-y-5 shadow-xs">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink border-b border-hairline pb-3">
            <ShieldCheck size={16} className="text-semantic-success" />
            <span>Safety & Human-in-the-Loop Policies</span>
          </div>

          <div className="space-y-4">
            <label className="flex items-start gap-3 p-3 rounded-lg bg-canvas-soft border border-hairline cursor-pointer select-none">
              <input
                type="checkbox"
                checked={strictHitl}
                onChange={(e) => setStrictHitl(e.target.checked)}
                className="mt-0.5 rounded text-primary focus:ring-0"
              />
              <div>
                <div className="text-xs font-semibold text-ink">
                  Enforce Strict Human-in-the-Loop Sign-Off Gate
                </div>
                <p className="text-[11px] text-body leading-relaxed mt-0.5">
                  When enabled, agents cannot dispatch Pull Requests, merge code, or execute write tools without explicit human engineer sign-off in the Task Detail view.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-lg bg-canvas-soft border border-hairline cursor-pointer select-none">
              <input
                type="checkbox"
                checked={astSandboxing}
                onChange={(e) => setAstSandboxing(e.target.checked)}
                className="mt-0.5 rounded text-primary focus:ring-0"
              />
              <div>
                <div className="text-xs font-semibold text-ink">
                  Automated Sandboxed AST & CVE Pre-Flight Check
                </div>
                <p className="text-[11px] text-body leading-relaxed mt-0.5">
                  Automatically spins up isolated Vitest container test runners and dependency audits before formatting any Action Plan deliverable.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-active text-on-primary font-semibold text-xs rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            <Save size={15} />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  )
}
