import { motion } from 'motion/react'
import { ArrowRight, Terminal } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function CTASection() {
  return (
    <section className="py-24 md:py-32 bg-canvas border-t border-hairline relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto"
        >
          <div className="w-12 h-12 rounded-xl bg-ink text-canvas mx-auto flex items-center justify-center mb-6 shadow-xs">
            <Terminal size={22} strokeWidth={2.2} />
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-normal text-ink leading-[1.12] tracking-display-lg mb-5 font-sans">
            Ready to delegate your daily workflow to an autonomous AI agent?
          </h2>

          <p className="text-sm sm:text-base text-body leading-relaxed max-w-lg mx-auto mb-8 font-sans">
            Connect your Obsidian vault, pair your Android smartphone, and experience context-aware AI execution in less than two minutes.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
            <Link
              to="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-active text-on-primary text-sm font-medium px-8 py-3.5 rounded-xl transition-colors shadow-xs"
            >
              <span>Launch Workspace</span>
              <ArrowRight size={16} />
            </Link>

            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-surface-card hover:bg-canvas-soft text-ink border border-hairline-strong text-sm font-medium px-8 py-3.5 rounded-xl transition-colors shadow-2xs"
            >
              <span>Explore GitHub</span>
            </a>
          </div>

          <div className="text-[11px] font-mono text-muted">
            100% Local-First Privacy · Model Context Protocol (MCP) Native · Full Human-in-the-Loop Control
          </div>
        </motion.div>
      </div>
    </section>
  )
}


