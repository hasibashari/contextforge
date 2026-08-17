import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  ArrowRight,
  GitBranch,
  FileText,
  Globe,
  CheckCircle2,
  Play,
  Pause,
  ExternalLink,
  Sparkles,
  Layers,
  Cpu,
} from 'lucide-react'

type StageKey = 'thinking' | 'grep' | 'read' | 'edit' | 'done'

interface StageInfo {
  id: StageKey
  label: string
  pillBg: string
  pillText: string
  time: string
  actionTitle: string
  description: string
  logs: string[]
}

const STAGES: StageInfo[] = [
  {
    id: 'thinking',
    label: 'Thinking',
    pillBg: 'bg-[#dfa88f]',
    pillText: 'text-[#26251e]',
    time: '0.4s',
    actionTitle: 'Decomposing Goal & Dependency Graph',
    description: 'Analyzing user prompt: "Audit auth middleware for OAuth2 PKCE compliance and draft migration action plan."',
    logs: [
      '⚡ [Planner] Identified 3 required context sources: GitHub repo, Security RFC, OAuth2.1 specs',
      '⚡ [Planner] Formulating 4 deterministic checkpoints for verification',
      '⚡ [Dependency] AST parsing required for /src/middleware/auth.ts and /src/services/session.ts',
    ],
  },
  {
    id: 'grep',
    label: 'Grepping',
    pillBg: 'bg-[#9fc9a2]',
    pillText: 'text-[#26251e]',
    time: '1.2s',
    actionTitle: 'Scanning Codebase AST & Symbol Table',
    description: 'Searching GitHub repository across 48 files for legacy auth grant patterns and token handlers.',
    logs: [
      '🔍 [GitHub AST] Matched 12 call sites in `auth.middleware.ts` using legacy implicit flow',
      '🔍 [GitHub AST] Located token exchange handler at `src/auth/token.service.ts:42`',
      '🔍 [GitHub Repo] Found 2 open PRs touching authentication schemas (#104, #118)',
    ],
  },
  {
    id: 'read',
    label: 'Reading',
    pillBg: 'bg-[#9fbbe0]',
    pillText: 'text-[#26251e]',
    time: '2.1s',
    actionTitle: 'Ingesting Knowledge Base & RFC Specs',
    description: 'Cross-referencing internal company security policy with public OAuth 2.1 RFC drafts.',
    logs: [
      '📖 [KB Docs] Ingested `docs/security/RFC-409-OAuth-PKCE.md` (Version 2.3)',
      '📖 [Live Web] Fetched latest normative spec from `oauth.net/2.1/draft-ietf-oauth-v2-1-10`',
      '📖 [Synthesis] Detected mismatch: internal RFC requires SHA-256 code challenge generation',
    ],
  },
  {
    id: 'edit',
    label: 'Editing',
    pillBg: 'bg-[#c0a8dd]',
    pillText: 'text-[#26251e]',
    time: '3.4s',
    actionTitle: 'Synthesizing Patch & Verifying Implementation',
    description: 'Generating replacement middleware code and drafting automated unit test suite.',
    logs: [
      '✍️ [Patch Gen] Generated `pkceChallengeVerifier()` middleware with fallback telemetry',
      '✍️ [Test Harness] Synthesized 6 test cases for malformed code_verifier params',
      '✍️ [Linter] Static analysis passed with zero CVE vulnerabilities',
    ],
  },
  {
    id: 'done',
    label: 'Done',
    pillBg: 'bg-[#c08532]',
    pillText: 'text-[#ffffff]',
    time: '4.8s',
    actionTitle: 'Action Plan Ready for Execution',
    description: 'All 4 checkpoints verified. 1 pull request patch generated and ready for human review.',
    logs: [
      '✨ [Action Plan] Deliverable package assembled: `ACTION-PLAN-AUTH-MIGRATION.md`',
      '✨ [Artifact] Ready: 1 Pull Request draft, 3 migration steps, 1 rollback script',
      '✨ [Execution Gate] Awaiting user approval to commit directly to GitHub branch',
    ],
  },
]

export default function Hero() {
  const [activeStage, setActiveStage] = useState<StageKey>('thinking')
  const [isPlaying, setIsPlaying] = useState<boolean>(true)
  const [checklist, setChecklist] = useState<{ [key: string]: boolean }>({
    step1: true,
    step2: true,
    step3: false,
    step4: false,
  })

  // Auto playback of stages
  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      setActiveStage((prev) => {
        const currentIndex = STAGES.findIndex((s) => s.id === prev)
        const nextIndex = (currentIndex + 1) % STAGES.length
        return STAGES[nextIndex].id
      })
    }, 4500)

    return () => clearInterval(interval)
  }, [isPlaying])

  const currentStageData = STAGES.find((s) => s.id === activeStage) || STAGES[0]

  const toggleCheck = (key: string) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden bg-canvas">
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
        {/* Editorial Hero Headline */}
        <div className="max-w-3xl mx-auto text-center mb-10 md:mb-14">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface-strong border border-hairline mb-5"
          >
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-xs font-mono uppercase tracking-caption text-ink">
              Multi-Source AI Agent Platform
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-[68px] font-normal text-ink leading-[1.08] tracking-display-mega mb-6"
          >
            Delegate complex work to AI agents that understand your context.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-base sm:text-lg text-body leading-relaxed max-w-2xl mx-auto mb-8 font-normal"
          >
            ContextForge orchestrates autonomous agents that gather intelligence from GitHub,
            knowledge bases, and live web resources — turning ambiguous goals into verified,
            executable action plans.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <a
              href="#hero-sandbox"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-active text-on-primary text-sm font-medium px-6 py-3 rounded-md transition-colors shadow-xs"
            >
              <span>Start Delegating</span>
              <ArrowRight size={16} />
            </a>

            <a
              href="#sources"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-surface-card hover:bg-canvas-soft text-ink border border-hairline-strong text-sm font-medium px-6 py-3 rounded-md transition-colors"
            >
              <span>Explore Context Ingestion</span>
            </a>
          </motion.div>
        </div>

        {/* The Signature IDE / Agent Workspace Mockup */}
        <motion.div
          id="hero-sandbox"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-surface-card rounded-lg border border-hairline shadow-xs overflow-hidden"
        >
          {/* Workspace Window Header */}
          <div className="bg-canvas-soft border-b border-hairline px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-hairline-strong" />
              <div className="w-2.5 h-2.5 rounded-full bg-hairline-strong" />
              <div className="w-2.5 h-2.5 rounded-full bg-hairline-strong" />
              <span className="text-xs font-mono text-muted ml-2">
                workspace / agent-orchestrator-8841
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="inline-flex items-center gap-1.5 text-xs text-body hover:text-ink font-mono px-2 py-1 rounded hover:bg-surface-strong transition-colors cursor-pointer"
                title={isPlaying ? 'Pause auto-cycle' : 'Resume auto-cycle'}
              >
                {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                <span className="hidden sm:inline">{isPlaying ? 'Live Simulating' : 'Paused'}</span>
              </button>

              <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted bg-surface-strong px-2 py-0.5 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-semantic-success animate-pulse" />
                <span>Agent Idle: 0% (Active)</span>
              </div>
            </div>
          </div>

          {/* 3-Pane Responsive Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-hairline min-h-130">
            {/* Left Pane: Connected Sources (lg:col-span-3) */}
            <div className="lg:col-span-3 p-4 bg-canvas-soft/60 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-semibold text-muted uppercase tracking-caption">
                    Connected Context
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-strong text-body">
                    3 active
                  </span>
                </div>

                <div className="space-y-2">
                  {/* GitHub Source */}
                  <div className="p-2.5 rounded-md bg-surface-card border border-hairline flex items-start gap-2.5">
                    <div className="p-1 rounded bg-canvas-soft text-ink shrink-0 mt-0.5">
                      <GitBranch size={13} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-ink truncate">contextforge/core</div>
                      <div className="text-[11px] font-mono text-muted">branch: main (48 files)</div>
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-semantic-success font-medium">
                        <span className="w-1 h-1 rounded-full bg-semantic-success" />
                        <span>AST Indexed</span>
                      </div>
                    </div>
                  </div>

                  {/* Knowledge Base */}
                  <div className="p-2.5 rounded-md bg-surface-card border border-hairline flex items-start gap-2.5">
                    <div className="p-1 rounded bg-canvas-soft text-ink shrink-0 mt-0.5">
                      <FileText size={13} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-ink truncate">RFC-409-OAuth-PKCE.md</div>
                      <div className="text-[11px] font-mono text-muted">internal/security-rfc</div>
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-semantic-success font-medium">
                        <span className="w-1 h-1 rounded-full bg-semantic-success" />
                        <span>Vector Chunked</span>
                      </div>
                    </div>
                  </div>

                  {/* Web Source */}
                  <div className="p-2.5 rounded-md bg-surface-card border border-hairline flex items-start gap-2.5">
                    <div className="p-1 rounded bg-canvas-soft text-ink shrink-0 mt-0.5">
                      <Globe size={13} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-ink truncate">oauth.net/2.1/draft</div>
                      <div className="text-[11px] font-mono text-muted">IETF Normative Spec</div>
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-semantic-success font-medium">
                        <span className="w-1 h-1 rounded-full bg-semantic-success" />
                        <span>Live Scraped</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Source Ingestion Summary */}
              <div className="mt-4 pt-3 border-t border-hairline text-[11px] font-mono text-muted space-y-1">
                <div className="flex justify-between">
                  <span>Tokens Ingested:</span>
                  <span className="text-ink font-medium">38,420</span>
                </div>
                <div className="flex justify-between">
                  <span>Context Relevance:</span>
                  <span className="text-semantic-success font-medium">99.4%</span>
                </div>
              </div>
            </div>

            {/* Center Pane: Agent Timeline & Live Stream (lg:col-span-5) */}
            <div className="lg:col-span-5 p-4 flex flex-col justify-between bg-surface-card">
              <div>
                {/* Active Goal */}
                <div className="mb-4 p-3 rounded-md bg-canvas border border-hairline">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-caption text-primary mb-1">
                    <Sparkles size={12} />
                    <span>Delegated Agent Mission</span>
                  </div>
                  <p className="text-xs font-medium text-ink leading-relaxed">
                    "Audit authentication middleware for OAuth2 PKCE compliance, cross-reference internal RFC-409, and synthesize migration action plan."
                  </p>
                </div>

                {/* The 5 Signature Timeline Pills */}
                <div className="mb-4">
                  <div className="text-[11px] font-semibold text-muted uppercase tracking-caption mb-2">
                    Autonomous Execution Timeline
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {STAGES.map((stage) => {
                      const isActive = activeStage === stage.id
                      return (
                        <button
                          key={stage.id}
                          onClick={() => {
                            setActiveStage(stage.id)
                            setIsPlaying(false)
                          }}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-caption transition-all cursor-pointer ${
                            stage.pillBg
                          } ${stage.pillText} ${
                            isActive
                              ? 'ring-2 ring-ink ring-offset-1 scale-105 shadow-xs'
                              : 'opacity-65 hover:opacity-100'
                          }`}
                        >
                          {stage.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Stage Detail Card */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStageData.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className="p-3 rounded-md bg-canvas-soft border border-hairline mb-3"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-ink">
                        {currentStageData.actionTitle}
                      </span>
                      <span className="text-[10px] font-mono text-muted">
                        +{currentStageData.time}
                      </span>
                    </div>
                    <p className="text-xs text-body leading-relaxed">
                      {currentStageData.description}
                    </p>
                  </motion.div>
                </AnimatePresence>

                {/* JetBrains Mono Execution Log Stream */}
                <div className="bg-ink text-canvas rounded-md p-3 font-mono text-[11px] leading-relaxed max-h-48 overflow-y-auto space-y-1.5 shadow-inner">
                  <div className="text-muted-soft text-[10px] flex items-center justify-between pb-1 border-b border-white/10">
                    <span>AGENT TRACE LOG</span>
                    <span>LIVE STREAM</span>
                  </div>
                  {currentStageData.logs.map((log, idx) => (
                    <motion.div
                      key={`${currentStageData.id}-${idx}`}
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: idx * 0.08 }}
                      className="text-canvas-soft"
                    >
                      {log}
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Status footer */}
              <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-muted pt-2 border-t border-hairline">
                <span className="flex items-center gap-1">
                  <Cpu size={12} className="text-primary" />
                  <span>Agent Model: DeepContext-Reasoner</span>
                </span>
                <span>Latency: 12ms</span>
              </div>
            </div>

            {/* Right Pane: Generated Actionable Artifact (lg:col-span-4) */}
            <div className="lg:col-span-4 p-4 bg-canvas-soft/40 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <Layers size={13} className="text-primary" />
                    <span className="text-[11px] font-semibold text-ink uppercase tracking-caption">
                      Action Plan Deliverable
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-timeline-done text-on-primary">
                    VERIFIED
                  </span>
                </div>

                <div className="bg-surface-card rounded-md border border-hairline p-3 mb-3">
                  <div className="text-xs font-semibold text-ink mb-1">
                    Migration: Legacy Auth → OAuth2 PKCE
                  </div>
                  <div className="text-[11px] text-body mb-3">
                    Target: `src/middleware/auth.ts`
                  </div>

                  {/* Interactive Action Checklist */}
                  <div className="space-y-2">
                    <div
                      onClick={() => toggleCheck('step1')}
                      className="flex items-start gap-2 text-xs cursor-pointer select-none group"
                    >
                      <CheckCircle2
                        size={15}
                        className={`shrink-0 mt-0.5 transition-colors ${
                          checklist.step1
                            ? 'text-semantic-success'
                            : 'text-hairline-strong group-hover:text-muted'
                        }`}
                      />
                      <span
                        className={
                          checklist.step1 ? 'line-through text-muted' : 'text-ink font-medium'
                        }
                      >
                        Enforce `code_challenge_method: S256`
                      </span>
                    </div>

                    <div
                      onClick={() => toggleCheck('step2')}
                      className="flex items-start gap-2 text-xs cursor-pointer select-none group"
                    >
                      <CheckCircle2
                        size={15}
                        className={`shrink-0 mt-0.5 transition-colors ${
                          checklist.step2
                            ? 'text-semantic-success'
                            : 'text-hairline-strong group-hover:text-muted'
                        }`}
                      />
                      <span
                        className={
                          checklist.step2 ? 'line-through text-muted' : 'text-ink font-medium'
                        }
                      >
                        Remove implicit grant fallback paths
                      </span>
                    </div>

                    <div
                      onClick={() => toggleCheck('step3')}
                      className="flex items-start gap-2 text-xs cursor-pointer select-none group"
                    >
                      <CheckCircle2
                        size={15}
                        className={`shrink-0 mt-0.5 transition-colors ${
                          checklist.step3
                            ? 'text-semantic-success'
                            : 'text-hairline-strong group-hover:text-muted'
                        }`}
                      />
                      <span
                        className={
                          checklist.step3 ? 'line-through text-muted' : 'text-ink font-medium'
                        }
                      >
                        Update integration tests for token exchange
                      </span>
                    </div>

                    <div
                      onClick={() => toggleCheck('step4')}
                      className="flex items-start gap-2 text-xs cursor-pointer select-none group"
                    >
                      <CheckCircle2
                        size={15}
                        className={`shrink-0 mt-0.5 transition-colors ${
                          checklist.step4
                            ? 'text-semantic-success'
                            : 'text-hairline-strong group-hover:text-muted'
                        }`}
                      />
                      <span
                        className={
                          checklist.step4 ? 'line-through text-muted' : 'text-ink font-medium'
                        }
                      >
                        Deploy canary canary-cluster-01
                      </span>
                    </div>
                  </div>
                </div>

                {/* Diff Code Snippet in JetBrains Mono */}
                <div className="bg-surface-card border border-hairline rounded-md p-2.5 font-mono text-[11px] leading-tight">
                  <div className="text-muted text-[10px] mb-1">PATCH PREVIEW: auth.ts</div>
                  <div className="text-semantic-error bg-semantic-error/10 px-1 rounded">- const token = req.query.access_token;</div>
                  <div className="text-semantic-success bg-semantic-success/10 px-1 rounded mt-0.5">+ const token = await verifyPkceGrant(req);</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-3 space-y-2">
                <button className="w-full inline-flex items-center justify-center gap-1.5 bg-ink hover:bg-black text-canvas text-xs font-medium py-2.5 rounded-md transition-colors cursor-pointer">
                  <span>Dispatch GitHub Pull Request</span>
                  <ExternalLink size={12} />
                </button>
                <div className="text-center text-[10px] font-mono text-muted">
                  Requires 1 approval before production execution
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
