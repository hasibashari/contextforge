import { motion } from 'motion/react'
import { GitBranch, BookOpen, Globe, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react'

export default function SourcesBentoSection() {
  return (
    <section id="sources" className="py-20 md:py-28 bg-canvas border-t border-hairline">
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
        {/* Section Header */}
        <div className="max-w-2xl mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-caption text-primary mb-3">
            <span>01 / Multi-Source Context Engine</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-[40px] font-normal text-ink leading-[1.15] tracking-display-lg mb-4">
            Connect all your engineering knowledge in one place.
          </h2>
          <p className="text-sm sm:text-base text-body leading-relaxed">
            AI agents cannot deliver accurate results without real context. ContextForge ingests
            your project code, team documentation, and live web references simultaneously to
            produce grounded, hallucination-free deliverables.
          </p>
        </div>

        {/* 3-Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: GitHub Repositories */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="bg-surface-card rounded-lg border border-hairline p-6 flex flex-col justify-between hover:border-hairline-strong transition-all group"
          >
            <div>
              <div className="w-10 h-10 rounded-md bg-canvas-soft border border-hairline flex items-center justify-center text-ink mb-5 group-hover:border-primary/40 transition-colors">
                <GitBranch size={18} />
              </div>

              <h3 className="text-lg font-semibold text-ink mb-2">
                1. Project Codebase & Repositories
              </h3>
              <p className="text-xs sm:text-sm text-body leading-relaxed mb-6">
                The agent maps your repository architecture, core functions, and recent commits on GitHub/GitLab so every proposed solution natively matches your codebase.
              </p>
            </div>

            {/* Visual Mini Card */}
            <div className="bg-canvas-soft rounded-md border border-hairline p-3 text-xs space-y-2">
              <div className="flex items-center justify-between text-[11px] font-medium text-muted pb-1.5 border-b border-hairline">
                <span>CONNECTED REPOSITORY</span>
                <span className="text-semantic-success flex items-center gap-1 font-mono text-[10px]">
                  <CheckCircle2 size={11} />
                  <span>Active</span>
                </span>
              </div>
              <div className="flex items-center justify-between text-ink text-xs">
                <span>📁 Core Application</span>
                <span className="text-muted text-[11px]">48 files indexed</span>
              </div>
              <div className="flex items-center justify-between text-ink text-xs">
                <span>📁 Database & Schemas</span>
                <span className="text-muted text-[11px]">Ready for audit</span>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Knowledge Bases */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-surface-card rounded-lg border border-hairline p-6 flex flex-col justify-between hover:border-hairline-strong transition-all group"
          >
            <div>
              <div className="w-10 h-10 rounded-md bg-canvas-soft border border-hairline flex items-center justify-center text-ink mb-5 group-hover:border-primary/40 transition-colors">
                <BookOpen size={18} />
              </div>

              <h3 className="text-lg font-semibold text-ink mb-2">
                2. Team SOPs & Knowledge Bases
              </h3>
              <p className="text-xs sm:text-sm text-body leading-relaxed mb-6">
                Connect Notion workspaces, Confluence spaces, Google Docs, or PDFs so the agent respects your internal company policies, security guidelines, and architectural standards.
              </p>
            </div>

            {/* Visual Mini Card */}
            <div className="bg-canvas-soft rounded-md border border-hairline p-3 text-xs space-y-2">
              <div className="flex items-center justify-between text-[11px] font-medium text-muted pb-1.5 border-b border-hairline">
                <span>INTERNAL KNOWLEDGE</span>
                <span className="text-semantic-success flex items-center gap-1 font-mono text-[10px]">
                  <CheckCircle2 size={11} />
                  <span>Synced</span>
                </span>
              </div>
              <div className="flex items-center justify-between text-ink text-xs">
                <span>📄 Auth & Security SOP</span>
                <span className="text-primary text-[11px] font-medium">Priority</span>
              </div>
              <div className="flex items-center justify-between text-ink text-xs">
                <span>📄 Architecture RFC Specs</span>
                <span className="text-muted text-[11px]">Latest v2.4</span>
              </div>
            </div>
          </motion.div>

          {/* Card 3: Live Web & Technical Specs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="bg-surface-card rounded-lg border border-hairline p-6 flex flex-col justify-between hover:border-hairline-strong transition-all group"
          >
            <div>
              <div className="w-10 h-10 rounded-md bg-canvas-soft border border-hairline flex items-center justify-center text-ink mb-5 group-hover:border-primary/40 transition-colors">
                <Globe size={18} />
              </div>

              <h3 className="text-lg font-semibold text-ink mb-2">
                3. Real-Time Web & Official Specs
              </h3>
              <p className="text-xs sm:text-sm text-body leading-relaxed mb-6">
                The agent performs live research across official API documentation, open-source package registries, and industry RFC standards in real time.
              </p>
            </div>

            {/* Visual Mini Card */}
            <div className="bg-canvas-soft rounded-md border border-hairline p-3 text-xs space-y-2">
              <div className="flex items-center justify-between text-[11px] font-medium text-muted pb-1.5 border-b border-hairline">
                <span>LIVE WEB RESEARCH</span>
                <span className="text-semantic-success flex items-center gap-1 font-mono text-[10px]">
                  <CheckCircle2 size={11} />
                  <span>Real-time</span>
                </span>
              </div>
              <div className="flex items-center justify-between text-ink text-xs">
                <span>🌐 OAuth 2.1 Normative Spec</span>
                <span className="text-muted text-[11px]">Verified</span>
              </div>
              <div className="flex items-center justify-between text-ink text-xs">
                <span>🌐 Official Package Updates</span>
                <span className="text-muted text-[11px]">Stable v20.1</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Feature Banner */}
        <div className="mt-10 p-5 rounded-lg bg-surface-card border border-hairline flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <ShieldCheck size={18} />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-semibold text-ink">
                Enterprise-Grade Privacy & Security
              </div>
              <p className="text-xs text-body">
                Your proprietary source code and team documents are encrypted and never used to train public AI models.
              </p>
            </div>
          </div>
          <a
            href="#workflow"
            className="text-xs font-semibold text-primary hover:text-primary-active transition-colors flex items-center gap-1 shrink-0"
          >
            <span>See How Agents Execute</span>
            <ArrowRight size={13} />
          </a>
        </div>
      </div>
    </section>
  )
}


