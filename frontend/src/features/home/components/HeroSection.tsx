import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Terminal,
  Brain,
  FileCheck,
  CheckCircle2,
  GitPullRequest,
  ShieldCheck,
  Database,
  ExternalLink,
  Sparkles,
  Layers,
  Globe,
} from 'lucide-react'

export default function HeroSection() {
  return (
    <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden bg-canvas">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-87.5 bg-primary/5 rounded-full blur-3xl pointer-events-none -z-10" />

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
            <Link
              to="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-active text-on-primary text-sm font-medium px-6 py-3 rounded-md transition-colors shadow-xs group"
            >
              <span>Launch Workspace</span>
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <a
              href="#sources"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-surface-card hover:bg-canvas-soft text-ink border border-hairline-strong text-sm font-medium px-6 py-3 rounded-md transition-colors"
            >
              <span>Explore Context Ingestion</span>
            </a>
          </motion.div>
        </div>

        {/* Tailwind UI Style App Screenshot Container */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-12 sm:mt-16 flow-root max-w-5xl mx-auto"
        >
          <div className="-m-2 rounded-xl bg-ink/5 p-2 ring-1 ring-inset ring-hairline-strong/60 lg:-m-4 lg:rounded-2xl lg:p-3">
            {/* App Window Frame Container */}
            <div className="bg-surface-card rounded-lg lg:rounded-xl shadow-2xl ring-1 ring-hairline/80 overflow-hidden">
              {/* Window Titlebar */}
              <div className="px-4 py-3 bg-canvas-soft border-b border-hairline flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ef6a5b] inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#f4be4f] inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#61c554] inline-block" />
                  <span className="text-xs font-mono text-muted ml-2 hidden sm:inline-block">
                    ContextForge Workspace — Acme Platform (Production)
                  </span>
                </div>

                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary hover:bg-primary-active text-on-primary text-xs font-medium transition-colors shadow-xs"
                >
                  <span>Open Full App</span>
                  <ExternalLink size={12} />
                </Link>
              </div>

              {/* Mockup Body Preview (3-Area Layout) */}
              <div className="relative">
                <div className="grid grid-cols-12 min-h-135 md:min-h-145 lg:min-h-155 bg-canvas text-ink font-sans text-xs">
                  {/* Column 1: Left Mockup Navigation Sidebar */}
                  <div className="hidden md:flex md:col-span-4 lg:col-span-3 bg-canvas-soft border-r border-hairline p-3.5 flex-col justify-between">
                    <div className="space-y-3.5">
                      <div className="flex items-center gap-2 p-2 bg-surface-card rounded-md border border-hairline shadow-2xs">
                        <div className="w-5 h-5 rounded bg-primary text-on-primary text-xs flex items-center justify-center font-bold">
                          A
                        </div>
                        <div className="truncate">
                          <div className="font-semibold text-ink truncate text-xs">Acme Platform</div>
                          <div className="text-[10px] text-muted truncate">production-cluster</div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="px-2 py-1 text-[10px] font-mono text-muted uppercase tracking-caption">
                          Workspace
                        </div>
                        <div className="px-2.5 py-1.5 rounded-md bg-ink text-canvas font-medium flex items-center gap-2 shadow-xs">
                          <Terminal size={13} className="text-primary" />
                          <span>Agent Overview</span>
                        </div>
                        <div className="px-2.5 py-1.5 rounded-md text-body hover:text-ink flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Brain size={13} className="text-muted" />
                            <span>Live Runs</span>
                          </div>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-strong">2</span>
                        </div>
                        <div className="px-2.5 py-1.5 rounded-md text-body hover:text-ink flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileCheck size={13} className="text-muted" />
                            <span>Action Plans</span>
                          </div>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary text-on-primary font-bold">3</span>
                        </div>
                        <div className="px-2.5 py-1.5 rounded-md text-body hover:text-ink flex items-center gap-2">
                          <Database size={13} className="text-muted" />
                          <span>Context Sources</span>
                        </div>
                      </div>

                      <div className="space-y-1 pt-2 border-t border-hairline">
                        <div className="px-2 py-1 text-[10px] font-mono text-muted uppercase tracking-caption">
                          Indexed Repos
                        </div>
                        <div className="px-2 py-0.5 text-[11px] text-body flex items-center gap-1.5 truncate">
                          <span className="w-1.5 h-1.5 rounded-full bg-semantic-success" />
                          <span className="truncate">acme/auth-service</span>
                        </div>
                        <div className="px-2 py-0.5 text-[11px] text-body flex items-center gap-1.5 truncate">
                          <span className="w-1.5 h-1.5 rounded-full bg-semantic-success" />
                          <span className="truncate">acme/data-platform</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-hairline">
                      <div className="p-2 rounded-md bg-canvas border border-hairline space-y-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-medium text-ink">
                          <ShieldCheck size={12} className="text-semantic-success" />
                          <span>HITL Safety Gate: Active</span>
                        </div>
                        <div className="text-[9px] text-muted leading-tight">
                          Human confirmation required before PR merge.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Center Mockup Primary Workspace */}
                  <div className="col-span-12 md:col-span-8 lg:col-span-6 p-3.5 sm:p-4.5 space-y-4 bg-canvas flex flex-col justify-between">
                    <div className="space-y-3.5">
                      {/* Top Stats Row */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-surface-card p-2.5 rounded-lg border border-hairline">
                          <div className="text-[9px] text-muted font-mono uppercase tracking-caption">Agent</div>
                          <div className="text-xs font-bold text-ink mt-0.5 truncate">SecurityAgent</div>
                        </div>
                        <div className="bg-surface-card p-2.5 rounded-lg border border-hairline">
                          <div className="text-[9px] text-muted font-mono uppercase tracking-caption">Context</div>
                          <div className="text-xs font-bold text-primary font-mono mt-0.5 truncate">48 Files · 2 RFCs</div>
                        </div>
                        <div className="bg-surface-card p-2.5 rounded-lg border border-hairline">
                          <div className="text-[9px] text-muted font-mono uppercase tracking-caption">Status</div>
                          <div className="text-xs font-bold text-semantic-success font-mono mt-0.5 truncate">Plan Ready</div>
                        </div>
                      </div>

                      {/* Terminal / Live Step Feed Preview */}
                      <div className="bg-ink text-canvas rounded-lg p-3.5 font-mono text-[10px] sm:text-[11px] space-y-2 border border-hairline shadow-xs">
                        <div className="flex items-center justify-between text-muted-soft text-[9px] sm:text-[10px] border-b border-white/10 pb-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-semantic-success animate-pulse" />
                            <span>Task Runner — PLAN-104</span>
                          </div>
                          <span>ast-sandbox:passed</span>
                        </div>

                        <div className="space-y-1 text-hairline-soft pt-0.5">
                          <div className="text-timeline-thinking">
                            &gt; [01/PLAN] Goal: Migrate OAuth2 session tokens
                          </div>
                          <div className="text-timeline-grep">
                            &gt; [02/INGEST] Ingested `github:acme/auth-service` & RFC-204
                          </div>
                          <div className="text-timeline-edit">
                            &gt; [03/SANDBOX] AST mutation complete: 3 files modified
                          </div>
                          <div className="text-semantic-success flex items-center gap-1 pt-0.5">
                            <CheckCircle2 size={12} className="shrink-0" />
                            <span>✓ 14/14 unit tests passed. 0 CVEs detected.</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Plan Deliverable Preview Cards */}
                      <div className="space-y-2">
                        <div className="text-[10px] font-mono uppercase tracking-caption text-muted">
                          Generated Deliverable
                        </div>

                        <div className="bg-surface-card p-3 rounded-lg border border-hairline-strong flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-mono font-bold text-primary">PLAN-104</span>
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-timeline-thinking/20 text-ink font-semibold">
                                Pending Sign-off
                              </span>
                            </div>
                            <div className="text-xs font-medium text-ink truncate">
                              OAuth2 Scoped Tokens Migration (+104 / -18)
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <div className="px-2.5 py-1.5 rounded-md bg-primary text-on-primary text-[11px] font-medium inline-flex items-center gap-1 shadow-xs">
                              <GitPullRequest size={12} />
                              <span>Approve PR</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Status bar inside preview */}
                    <div className="pt-2.5 border-t border-hairline flex items-center justify-between text-[10px] text-muted font-mono">
                      <span className="truncate">Sources: GitHub, Notion, Web OpenAPI</span>
                      <span className="text-semantic-success shrink-0">● Synced</span>
                    </div>
                  </div>

                  {/* Column 3: Right Mockup Context Inspector Aside */}
                  <div className="hidden lg:flex lg:col-span-3 bg-canvas-soft border-l border-hairline p-3.5 flex-col justify-between text-xs">
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between pb-2 border-b border-hairline">
                        <div className="flex items-center gap-1.5 font-semibold text-ink text-[11px]">
                          <Sparkles size={13} className="text-primary" />
                          <span>Context Inspector</span>
                        </div>
                        <span className="text-[9px] font-mono text-primary font-bold">51 Ingested</span>
                      </div>

                      {/* Active Grounding Scope */}
                      <div className="space-y-1.5">
                        <div className="text-[9px] font-mono uppercase tracking-caption text-muted">
                          Active Grounding Scope
                        </div>
                        <div className="p-2 rounded bg-surface-card border border-hairline space-y-0.5 shadow-2xs">
                          <div className="flex items-center justify-between text-[11px] font-medium text-ink">
                            <span className="truncate">acme/auth-service</span>
                            <span className="text-[9px] font-mono text-semantic-success">✓ 14 files</span>
                          </div>
                          <p className="text-[10px] text-muted truncate">JWT middleware & routes</p>
                        </div>
                        <div className="p-2 rounded bg-surface-card border border-hairline space-y-0.5 shadow-2xs">
                          <div className="flex items-center justify-between text-[11px] font-medium text-ink">
                            <div className="flex items-center gap-1 truncate">
                              <Layers size={11} className="text-timeline-thinking shrink-0" />
                              <span className="truncate">Notion Security RFC</span>
                            </div>
                            <span className="text-[9px] font-mono text-semantic-success">✓ RFC #204</span>
                          </div>
                          <p className="text-[10px] text-muted truncate">Scoped token spec</p>
                        </div>
                        <div className="p-2 rounded bg-surface-card border border-hairline space-y-0.5 shadow-2xs">
                          <div className="flex items-center justify-between text-[11px] font-medium text-ink">
                            <div className="flex items-center gap-1 truncate">
                              <Globe size={11} className="text-timeline-read shrink-0" />
                              <span className="truncate">Stripe API Docs</span>
                            </div>
                            <span className="text-[9px] font-mono text-semantic-success">✓ v2024-06</span>
                          </div>
                          <p className="text-[10px] text-muted truncate">Webhook schemas</p>
                        </div>
                      </div>

                      {/* AST Telemetry */}
                      <div className="space-y-1">
                        <div className="text-[9px] font-mono uppercase tracking-caption text-muted">
                          Sandboxed AST Telemetry
                        </div>
                        <div className="p-2 rounded bg-canvas border border-hairline text-[10px] space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-muted">Regression Suite:</span>
                            <span className="font-mono text-semantic-success font-semibold">14/14 Pass</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted">Security CVEs:</span>
                            <span className="font-mono text-semantic-success font-semibold">0 Detected</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-hairline">
                      <div className="flex items-center justify-between p-1.5 rounded bg-surface-card border border-hairline text-[10px]">
                        <div className="flex items-center gap-1.5 font-medium text-ink truncate">
                          <Database size={12} className="text-timeline-grep" />
                          <span className="truncate">Postgres MCP</span>
                        </div>
                        <span className="font-mono text-semantic-success text-[9px]">12ms</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
