import { motion } from 'motion/react'
import { Smartphone, Calendar, ArrowRight, CheckCircle2, ShieldCheck, Layers } from 'lucide-react'

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
            Connect your personal knowledge and device telemetry in one place.
          </h2>
          <p className="text-sm sm:text-base text-body leading-relaxed">
            AI agents cannot deliver accurate results without real-world context. ContextForge ingests
            your Obsidian vault notes, Android mobile telemetry, Google Calendar, and Notion tasks simultaneously to
            produce grounded, verified deliverables.
          </p>
        </div>

        {/* 3-Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Obsidian Vault & Knowledge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="bg-surface-card rounded-2xl border border-hairline p-6 flex flex-col justify-between hover:border-hairline-strong transition-all group shadow-2xs"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#7c3aed]/10 border border-[#7c3aed]/20 flex items-center justify-center text-[#7c3aed] mb-5 group-hover:border-[#7c3aed]/40 transition-colors">
                <Layers size={18} />
              </div>

              <h3 className="text-lg font-semibold text-ink mb-2 font-sans">
                1. Obsidian Vault & Markdown
              </h3>
              <p className="text-xs sm:text-sm text-body leading-relaxed mb-6 font-sans">
                Local-first Markdown knowledge management with bi-directional backlinks, atomic notes, and custom Obsidian URI desktop launcher.
              </p>
            </div>

            {/* Visual Mini Card */}
            <div className="bg-canvas-soft rounded-xl border border-hairline p-3 text-xs space-y-2">
              <div className="flex items-center justify-between text-[11px] font-medium text-muted pb-1.5 border-b border-hairline font-sans">
                <span>PAIRED OBSIDIAN VAULT</span>
                <span className="text-semantic-success flex items-center gap-1 font-mono text-[10px]">
                  <CheckCircle2 size={11} />
                  <span>Paired</span>
                </span>
              </div>
              <div className="flex items-center justify-between text-ink text-xs font-sans">
                <span>📓 Daily Notes Vault</span>
                <span className="text-muted text-[11px] font-mono">365 files</span>
              </div>
              <div className="flex items-center justify-between text-ink text-xs font-sans">
                <span>🕸️ Backlink Graph</span>
                <span className="text-[#7c3aed] text-[11px] font-mono">1,420 links</span>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Android MCP Bridge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-surface-card rounded-2xl border border-hairline p-6 flex flex-col justify-between hover:border-hairline-strong transition-all group shadow-2xs"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#10b981]/10 border border-[#10b981]/20 flex items-center justify-center text-[#10b981] mb-5 group-hover:border-[#10b981]/40 transition-colors">
                <Smartphone size={18} />
              </div>

              <h3 className="text-lg font-semibold text-ink mb-2 font-sans">
                2. Android Mobile MCP Bridge
              </h3>
              <p className="text-xs sm:text-sm text-body leading-relaxed mb-6 font-sans">
                Read real-time smartphone telemetry via Termux/ADB: battery level, running background apps, Screen Time analytics, and push notifications.
              </p>
            </div>

            {/* Visual Mini Card */}
            <div className="bg-canvas-soft rounded-xl border border-hairline p-3 text-xs space-y-2">
              <div className="flex items-center justify-between text-[11px] font-medium text-muted pb-1.5 border-b border-hairline font-sans">
                <span>ANDROID TELEMETRY</span>
                <span className="text-semantic-success flex items-center gap-1 font-mono text-[10px]">
                  <CheckCircle2 size={11} />
                  <span>Online</span>
                </span>
              </div>
              <div className="flex items-center justify-between text-ink text-xs font-sans">
                <span>📱 Screen Time Today</span>
                <span className="text-primary text-[11px] font-mono font-medium">4h 12m</span>
              </div>
              <div className="flex items-center justify-between text-ink text-xs font-sans">
                <span>🔋 Battery Health</span>
                <span className="text-[#10b981] text-[11px] font-mono">89% Optimal</span>
              </div>
            </div>
          </motion.div>

          {/* Card 3: Google Calendar & Notion */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="bg-surface-card rounded-2xl border border-hairline p-6 flex flex-col justify-between hover:border-hairline-strong transition-all group shadow-2xs"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#0284c7]/10 border border-[#0284c7]/20 flex items-center justify-center text-[#0284c7] mb-5 group-hover:border-[#0284c7]/40 transition-colors">
                <Calendar size={18} />
              </div>

              <h3 className="text-lg font-semibold text-ink mb-2 font-sans">
                3. Google Calendar & Notion Tasks
              </h3>
              <p className="text-xs sm:text-sm text-body leading-relaxed mb-6 font-sans">
                Real-time meeting agenda aggregation, event conflict alerts, and automated task prioritization synchronized from your Notion workspace.
              </p>
            </div>

            {/* Visual Mini Card */}
            <div className="bg-canvas-soft rounded-xl border border-hairline p-3 text-xs space-y-2">
              <div className="flex items-center justify-between text-[11px] font-medium text-muted pb-1.5 border-b border-hairline font-sans">
                <span>CLOUD WORKSPACES</span>
                <span className="text-semantic-success flex items-center gap-1 font-mono text-[10px]">
                  <CheckCircle2 size={11} />
                  <span>Synced</span>
                </span>
              </div>
              <div className="flex items-center justify-between text-ink text-xs font-sans">
                <span>📅 Google Calendar</span>
                <span className="text-muted text-[11px] font-mono">4 meetings today</span>
              </div>
              <div className="flex items-center justify-between text-ink text-xs font-sans">
                <span>📑 Notion Backlog</span>
                <span className="text-muted text-[11px] font-mono">12 active tasks</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Feature Banner */}
        <div className="mt-10 p-5 rounded-2xl bg-surface-card border border-hairline flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <ShieldCheck size={18} />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-semibold text-ink font-sans">
                100% Local-First Data Privacy
              </div>
              <p className="text-xs text-body font-sans">
                Your private Obsidian vault files and Android device logs stay securely on your machine and are never used to train public AI models.
              </p>
            </div>
          </div>
          <a
            href="#workflow"
            className="text-xs font-semibold text-primary hover:text-primary-active transition-colors flex items-center gap-1 shrink-0 font-sans"
          >
            <span>See How Agents Execute</span>
            <ArrowRight size={13} />
          </a>
        </div>
      </div>
    </section>
  )
}


