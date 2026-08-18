import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Brain,
  FileCheck,
  CheckCircle2,
  GitPullRequest,
  Terminal,
  ExternalLink,
  Layers,
  Database,
  Globe,
  Sparkles,
  Check,
  X,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'
import type { DashboardTab } from './DashboardSidebar'

interface DashboardOverviewProps {
  activeTab: DashboardTab
  onNewTaskClick: () => void
}

interface ActionPlanItem {
  id: string
  title: string
  repo: string
  agent: string
  timeAgo: string
  status: 'pending_review' | 'approved' | 'in_progress'
  summary: string
  impact: string
  checkpoints: { text: string; done: boolean }[]
  diffPreview: { file: string; additions: number; deletions: number }[]
}

const INITIAL_ACTION_PLANS: ActionPlanItem[] = [
  {
    id: 'PLAN-104',
    title: 'Migrate OAuth2 session tokens to ephemeral scoped keys',
    repo: 'github:acme/auth-service',
    agent: 'SecurityAndDocsAgent',
    timeAgo: '12m ago',
    status: 'pending_review',
    summary:
      'Grounded across internal Notion Security RFC #204 and GitHub auth middleware. Ingested 14 files, verified 0 regressions in sandboxed AST test.',
    impact: 'High (Auth Gateway & Session Stores)',
    checkpoints: [
      { text: 'Validate HMAC token rotation against Notion RFC #204', done: true },
      { text: 'Update authMiddleware.ts with scoped claims extractor', done: true },
      { text: 'Run sandboxed regression suite on 32 auth test cases', done: true },
      { text: 'Draft GitHub Pull Request with migration notes', done: false },
    ],
    diffPreview: [
      { file: 'src/middleware/auth.ts', additions: 34, deletions: 12 },
      { file: 'src/config/jwt.ts', additions: 18, deletions: 6 },
      { file: 'tests/auth.test.ts', additions: 52, deletions: 0 },
    ],
  },
  {
    id: 'PLAN-103',
    title: 'Sync Stripe Webhook handlers with v2024-06 OpenAPI specs',
    repo: 'github:acme/billing-service',
    agent: 'DocumentationCrawlerAgent',
    timeAgo: '45m ago',
    status: 'pending_review',
    summary:
      'Extracted Stripe API change logs from live docs and mapped missing refund event structures.',
    impact: 'Medium (Billing Pipeline)',
    checkpoints: [
      { text: 'Crawl and parse Stripe OpenAPI spec version 2024-06', done: true },
      { text: 'Generate type-safe payload handlers for payment_intent.succeeded', done: true },
      { text: 'Simulate webhook replay test in mock runner', done: true },
    ],
    diffPreview: [
      { file: 'src/handlers/stripe.ts', additions: 42, deletions: 8 },
      { file: 'src/types/stripe.d.ts', additions: 85, deletions: 14 },
    ],
  },
  {
    id: 'PLAN-102',
    title: 'Refactor Postgres connection pool for MCP Air-Gapped Service',
    repo: 'github:acme/data-platform',
    agent: 'DatabasePlatformAgent',
    timeAgo: '2h ago',
    status: 'approved',
    summary: 'Configured read-only replica connection with connection pooling max limits.',
    impact: 'Low (Internal Database Gateway)',
    checkpoints: [
      { text: 'Inspect connection timeout telemetry in PostgreSQL', done: true },
      { text: 'Implement bounded connection pool in pg-pool.ts', done: true },
      { text: 'Human approval received; PR merged into staging', done: true },
    ],
    diffPreview: [{ file: 'src/db/pool.ts', additions: 19, deletions: 4 }],
  },
]

const SOURCES = [
  {
    id: 'github-core',
    type: 'GitHub Repository',
    name: 'acme-corp/platform-core',
    meta: '48 files indexed · main branch',
    status: 'Synced',
    icon: Terminal,
    color: 'text-ink',
  },
  {
    id: 'notion-sops',
    type: 'Notion Workspace',
    name: 'Engineering SOPs & Security RFCs',
    meta: '12 documents · Last updated 1h ago',
    status: 'Synced',
    icon: Layers,
    color: 'text-[#dfa88f]',
  },
  {
    id: 'stripe-docs',
    type: 'Web API Spec',
    name: 'Stripe API v2024-06 Documentation',
    meta: 'Live crawl cached · 24 endpoints',
    status: 'Active',
    icon: Globe,
    color: 'text-[#9fbbe0]',
  },
  {
    id: 'mcp-postgres',
    type: 'MCP Server',
    name: 'PostgreSQL Read-Only Context Server',
    meta: 'Localhost:5432 · Schema only',
    status: 'Active',
    icon: Database,
    color: 'text-[#9fc9a2]',
  },
]

export default function DashboardOverview({
  activeTab,
  onNewTaskClick,
}: DashboardOverviewProps) {
  const [actionPlans, setActionPlans] = useState<ActionPlanItem[]>(INITIAL_ACTION_PLANS)
  const [selectedPlan, setSelectedPlan] = useState<ActionPlanItem | null>(null)
  const [agentStage, setAgentStage] = useState<'thinking' | 'grepping' | 'reading' | 'done'>('grepping')
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const approvePlan = (planId: string) => {
    setActionPlans((prev) =>
      prev.map((p) => (p.id === planId ? { ...p, status: 'approved' } : p))
    )
    if (selectedPlan && selectedPlan.id === planId) {
      setSelectedPlan({ ...selectedPlan, status: 'approved' })
    }
    showToast(`✓ Action Plan ${planId} approved! Pull Request dispatched.`)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-6 z-50 bg-ink text-canvas px-4 py-3 rounded-lg shadow-lg border border-hairline flex items-center gap-2.5 text-xs font-medium"
          >
            <CheckCircle2 size={16} className="text-semantic-success" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-card border border-hairline p-5 sm:p-6 rounded-xl shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-caption text-primary mb-1">
            <Sparkles size={13} />
            <span>
              {activeTab === 'overview' && 'Multi-Source Context Engine Active'}
              {activeTab === 'agents' && 'Agent Runtime Environment'}
              {activeTab === 'action-plans' && 'Human-in-the-Loop Deliverables'}
              {activeTab === 'sources' && 'Knowledge & Repository Ingestion'}
              {activeTab === 'mcp' && 'Model Context Protocol Integrations'}
              {activeTab === 'settings' && 'Model Configuration & Guardrails'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-ink tracking-tight capitalize">
            {activeTab === 'overview' ? 'Acme Platform Workspace' : `${activeTab.replace('-', ' ')}`}
          </h1>
          <p className="text-xs sm:text-sm text-body mt-1">
            {activeTab === 'overview' && 'Autonomous agent orchestration connected to 4 sources. 3 action plans ready for human sign-off.'}
            {activeTab === 'agents' && 'Monitor background agent reasoning, sandbox execution, and AST validation runs.'}
            {activeTab === 'action-plans' && 'Review structured checklists and execute verified pull requests with single-click sign-off.'}
            {activeTab === 'sources' && 'Manage GitHub repositories, Notion spaces, and live web API documentation cache.'}
            {activeTab === 'mcp' && 'Configure custom Model Context Protocol servers for air-gapped databases and local tools.'}
            {activeTab === 'settings' && 'Configure LLM providers, temperature bounds, and strict HITL approval enforcement.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAgentStage('thinking')}
            className={`px-3 py-1.5 rounded-md text-xs font-mono transition-colors border cursor-pointer ${
              agentStage === 'thinking'
                ? 'bg-ink text-canvas border-ink'
                : 'bg-canvas-soft text-body border-hairline hover:text-ink'
            }`}
          >
            Simulate Run
          </button>
          <button
            onClick={onNewTaskClick}
            className="px-4 py-2 rounded-md bg-primary hover:bg-primary-active text-on-primary text-xs font-medium transition-colors shadow-xs cursor-pointer"
          >
            + Dispatch New Agent
          </button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-card border border-hairline p-4 sm:p-5 rounded-lg">
          <div className="flex items-center justify-between text-muted mb-2">
            <span className="text-xs font-medium">Active Agents</span>
            <Brain size={16} className="text-primary" />
          </div>
          <div className="text-2xl sm:text-3xl font-semibold text-ink font-mono">2</div>
          <div className="text-[11px] text-body mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-semantic-success" />
            <span>1 Security, 1 Doc Sync</span>
          </div>
        </div>

        <div className="bg-surface-card border border-hairline p-4 sm:p-5 rounded-lg">
          <div className="flex items-center justify-between text-muted mb-2">
            <span className="text-xs font-medium">Connected Sources</span>
            <Database size={16} className="text-timeline-read" />
          </div>
          <div className="text-2xl sm:text-3xl font-semibold text-ink font-mono">4</div>
          <div className="text-[11px] text-body mt-1">GitHub, Notion, Web API, MCP</div>
        </div>

        <div className="bg-surface-card border border-hairline p-4 sm:p-5 rounded-lg">
          <div className="flex items-center justify-between text-muted mb-2">
            <span className="text-xs font-medium">Pending Action Plans</span>
            <FileCheck size={16} className="text-timeline-thinking" />
          </div>
          <div className="text-2xl sm:text-3xl font-semibold text-ink font-mono">
            {actionPlans.filter((p) => p.status === 'pending_review').length}
          </div>
          <div className="text-[11px] text-body mt-1">Awaiting human sign-off</div>
        </div>

        <div className="bg-surface-card border border-hairline p-4 sm:p-5 rounded-lg">
          <div className="flex items-center justify-between text-muted mb-2">
            <span className="text-xs font-medium">AST Safety Checks</span>
            <ShieldCheck size={16} className="text-semantic-success" />
          </div>
          <div className="text-2xl sm:text-3xl font-semibold text-ink font-mono">100%</div>
          <div className="text-[11px] text-semantic-success mt-1">0 regressions detected</div>
        </div>
      </div>

      {/* Main Grid: Live Agent Feed & Action Plans Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Live Agent Task Feed (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal size={16} className="text-primary" />
              <h2 className="text-sm font-semibold text-ink">Live Agent Execution Stream</h2>
            </div>
            <span className="text-[11px] font-mono text-muted">ID: AGENT-RUN-9021</span>
          </div>

          <div className="bg-surface-card rounded-lg border border-hairline overflow-hidden shadow-xs">
            {/* Terminal Top Bar */}
            <div className="px-4 py-3 bg-canvas-soft border-b border-hairline flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ef6a5b]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#f4be4f]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#61c554]" />
                <span className="text-xs font-mono text-body ml-2">SecurityAndDocsAgent</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-mono text-muted">
                <span className="w-2 h-2 rounded-full bg-semantic-success animate-pulse" />
                <span>Running</span>
              </div>
            </div>

            {/* Stepper Tabs */}
            <div className="grid grid-cols-4 border-b border-hairline text-center text-xs font-mono bg-canvas">
              <button
                onClick={() => setAgentStage('thinking')}
                className={`py-2 px-1 border-r border-hairline transition-colors cursor-pointer ${
                  agentStage === 'thinking'
                    ? 'bg-surface-card text-ink font-semibold border-b-2 border-b-primary'
                    : 'text-muted hover:text-ink'
                }`}
              >
                1. Plan
              </button>
              <button
                onClick={() => setAgentStage('grepping')}
                className={`py-2 px-1 border-r border-hairline transition-colors cursor-pointer ${
                  agentStage === 'grepping'
                    ? 'bg-surface-card text-ink font-semibold border-b-2 border-b-primary'
                    : 'text-muted hover:text-ink'
                }`}
              >
                2. Ingest
              </button>
              <button
                onClick={() => setAgentStage('reading')}
                className={`py-2 px-1 border-r border-hairline transition-colors cursor-pointer ${
                  agentStage === 'reading'
                    ? 'bg-surface-card text-ink font-semibold border-b-2 border-b-primary'
                    : 'text-muted hover:text-ink'
                }`}
              >
                3. Sandbox
              </button>
              <button
                onClick={() => setAgentStage('done')}
                className={`py-2 px-1 transition-colors cursor-pointer ${
                  agentStage === 'done'
                    ? 'bg-surface-card text-ink font-semibold border-b-2 border-b-primary'
                    : 'text-muted hover:text-ink'
                }`}
              >
                4. Action Plan
              </button>
            </div>

            {/* Terminal Body */}
            <div className="p-4 bg-ink text-canvas font-mono text-xs space-y-3 min-h-55">
              <div className="text-muted-soft text-[11px]">
                [2026-08-18T13:30:00Z] Goal: Migrate OAuth2 session tokens with zero regression
              </div>

              {agentStage === 'thinking' && (
                <div className="space-y-2 animate-in fade-in duration-200">
                  <div className="text-timeline-thinking">
                    &gt; Agent initialized task breakdown:
                  </div>
                  <div className="text-hairline-soft pl-3 space-y-1">
                    <div>1. Grep for all references to `jwt.verify` across codebase</div>
                    <div>2. Read Notion Security RFC #204 for token payload format</div>
                    <div>3. Modify `src/middleware/auth.ts` and simulate test runner</div>
                    <div>4. Output comprehensive Action Plan deliverable</div>
                  </div>
                </div>
              )}

              {agentStage === 'grepping' && (
                <div className="space-y-2 animate-in fade-in duration-200">
                  <div className="text-timeline-grep">
                    &gt; Context Ingestion from multiple sources:
                  </div>
                  <div className="text-hairline-soft pl-3 space-y-1 text-[11px]">
                    <div>[GitHub] Indexed 14 files in `acme-corp/platform-core`</div>
                    <div>[Notion] Ingested `Security RFC #204: Ephemeral Tokens`</div>
                    <div>[OpenAPI] Validated payload schema against OpenAPI 3.1</div>
                    <div className="text-primary font-bold">
                      ✓ Complete multi-source grounding established.
                    </div>
                  </div>
                </div>
              )}

              {agentStage === 'reading' && (
                <div className="space-y-2 animate-in fade-in duration-200">
                  <div className="text-timeline-edit">
                    &gt; Sandboxed AST Verification & Test Execution:
                  </div>
                  <div className="text-hairline-soft pl-3 space-y-1 text-[11px]">
                    <div>&gt; vitest run --coverage (Sandboxed Container)</div>
                    <div className="text-semantic-success">✓ 14/14 unit tests passed (100% coverage)</div>
                    <div className="text-semantic-success">✓ 0 CVEs detected in modified dependencies</div>
                    <div>&gt; Generating Pull Request diff artifact...</div>
                  </div>
                </div>
              )}

              {agentStage === 'done' && (
                <div className="space-y-2 animate-in fade-in duration-200">
                  <div className="text-timeline-done font-semibold">
                    &gt; Deliverable: Action Plan PLAN-104 ready for review.
                  </div>
                  <div className="text-hairline-soft pl-3 text-[11px]">
                    Pull Request draft is locked awaiting human approval gate.
                  </div>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="p-3 bg-canvas-soft border-t border-hairline flex items-center justify-between text-xs">
              <span className="text-muted">
                Stage: <strong className="text-ink uppercase">{agentStage}</strong>
              </span>
              <button
                onClick={() => {
                  const stages: ('thinking' | 'grepping' | 'reading' | 'done')[] = [
                    'thinking',
                    'grepping',
                    'reading',
                    'done',
                  ]
                  const next = stages[(stages.indexOf(agentStage) + 1) % stages.length]
                  setAgentStage(next)
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-surface-card border border-hairline hover:border-hairline-strong text-ink font-mono text-[11px] transition-colors"
              >
                <span>Next Stage</span>
                <ArrowRight size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Pending Action Plans Queue (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck size={16} className="text-timeline-thinking" />
              <h2 className="text-sm font-semibold text-ink">Action Plans for Review</h2>
            </div>
            <span className="text-xs text-muted">
              {actionPlans.filter((p) => p.status === 'pending_review').length} Pending
            </span>
          </div>

          <div className="space-y-3">
            {actionPlans.map((plan) => {
              const isPending = plan.status === 'pending_review'

              return (
                <div
                  key={plan.id}
                  className={`bg-surface-card border rounded-lg p-4 transition-all ${
                    isPending ? 'border-hairline-strong shadow-xs' : 'border-hairline opacity-75'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-primary">
                        {plan.id}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                          isPending
                            ? 'bg-timeline-thinking/20 text-[#26251e] font-semibold'
                            : 'bg-semantic-success/15 text-semantic-success font-semibold'
                        }`}
                      >
                        {isPending ? 'Pending Sign-off' : '✓ Approved'}
                      </span>
                    </div>
                    <span className="text-[11px] text-muted">{plan.timeAgo}</span>
                  </div>

                  <h3 className="text-xs sm:text-sm font-medium text-ink leading-snug mb-1.5">
                    {plan.title}
                  </h3>

                  <p className="text-[11px] text-body line-clamp-2 mb-3 leading-relaxed">
                    {plan.summary}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-hairline text-xs">
                    <button
                      onClick={() => setSelectedPlan(plan)}
                      className="text-body hover:text-ink font-medium text-xs underline cursor-pointer"
                    >
                      View Details & Diff
                    </button>

                    {isPending ? (
                      <button
                        onClick={() => approvePlan(plan.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary hover:bg-primary-active text-on-primary text-xs font-medium transition-colors cursor-pointer"
                      >
                        <GitPullRequest size={13} />
                        <span>Approve & PR</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-semantic-success text-xs font-medium">
                        <Check size={14} />
                        <span>Dispatched</span>
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Connected Context Sources Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database size={16} className="text-primary" />
            <h2 className="text-sm font-semibold text-ink">Connected Context Sources</h2>
          </div>
          <span className="text-xs text-muted">All active & synchronized</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SOURCES.map((src) => {
            const Icon = src.icon

            return (
              <div
                key={src.id}
                className="bg-surface-card border border-hairline p-4 rounded-lg flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono uppercase tracking-caption text-muted">
                      {src.type}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono text-semantic-success font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-semantic-success" />
                      {src.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-1">
                    <Icon size={16} className={src.color} />
                    <span className="text-xs font-semibold text-ink truncate">{src.name}</span>
                  </div>

                  <p className="text-[11px] text-body">{src.meta}</p>
                </div>

                <div className="pt-2 border-t border-hairline-soft flex items-center justify-between text-[11px] text-muted">
                  <span>Auto-indexed</span>
                  <ExternalLink size={12} className="hover:text-ink cursor-pointer" />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Action Plan Details Modal */}
      <AnimatePresence>
        {selectedPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface-card border border-hairline rounded-xl max-w-2xl w-full p-6 space-y-5 shadow-xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold text-primary">
                      {selectedPlan.id}
                    </span>
                    <span className="text-xs font-mono text-muted">
                      by {selectedPlan.agent}
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-semibold text-ink">
                    {selectedPlan.title}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedPlan(null)}
                  className="p-1 rounded hover:bg-canvas-soft text-muted hover:text-ink"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-3 bg-canvas-soft rounded-lg border border-hairline text-xs space-y-1">
                <div className="font-semibold text-ink">Executive Summary:</div>
                <p className="text-body leading-relaxed">{selectedPlan.summary}</p>
              </div>

              {/* Checkpoints Checklist */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-ink uppercase tracking-caption font-mono">
                  Verified Checkpoints:
                </div>
                <div className="space-y-1.5">
                  {selectedPlan.checkpoints.map((cp, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 text-xs text-ink p-2 rounded bg-canvas border border-hairline"
                    >
                      <CheckCircle2 size={14} className="text-semantic-success shrink-0" />
                      <span>{cp.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Diff Preview */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-ink uppercase tracking-caption font-mono">
                  Affected Files Diff Preview:
                </div>
                <div className="space-y-1 font-mono text-xs">
                  {selectedPlan.diffPreview.map((d, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 rounded bg-canvas-soft border border-hairline"
                    >
                      <span className="text-ink">{d.file}</span>
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="text-semantic-success">+{d.additions}</span>
                        <span className="text-semantic-error">-{d.deletions}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-hairline">
                <button
                  onClick={() => setSelectedPlan(null)}
                  className="px-4 py-2 text-xs font-medium text-body hover:text-ink rounded-md hover:bg-canvas-soft"
                >
                  Close
                </button>

                {selectedPlan.status === 'pending_review' ? (
                  <button
                    onClick={() => {
                      approvePlan(selectedPlan.id)
                      setSelectedPlan(null)
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary hover:bg-primary-active text-on-primary text-xs font-medium transition-colors shadow-xs"
                  >
                    <GitPullRequest size={14} />
                    <span>Approve & Dispatch PR</span>
                  </button>
                ) : (
                  <div className="text-xs font-mono text-semantic-success font-medium">
                    ✓ Already Approved
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
