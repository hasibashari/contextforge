import { motion } from 'motion/react'

const METRICS = [
  {
    value: '100%',
    label: 'Local-First Data Privacy',
    description: 'Obsidian notes & device telemetry stay strictly on your local machine.',
  },
  {
    value: '5+',
    label: 'Official MCP Connectors',
    description: 'Obsidian Protocol, Android Bridge, Google Calendar, Notion, & Web Search.',
  },
  {
    value: 'Strict',
    label: 'Human-In-The-Loop Gate',
    description: 'Zero unauthorized vault writes or tool mutations without explicit sign-off.',
  },
  {
    value: 'Real-time',
    label: 'Mobile Telemetry Sync',
    description: 'Continuous Screen Time, battery health, and push notifications via Termux/ADB.',
  },
]

const TESTIMONIALS = [
  {
    quote:
      'ContextForge bridges the gap between my mobile life and daily Obsidian journaling. It automatically grabs my Google Calendar agenda and screen time habits, creating atomic daily notes with frontmatter every single morning.',
    author: 'Ryan K.',
    role: 'Knowledge Architect',
    company: 'Personal PKM Vault',
  },
  {
    quote:
      'The Model Context Protocol (MCP) integration with Android Termux is brilliant. My AI assistant can check battery health, audit running background apps, and notify me directly on my smartphone when scheduled automations finish.',
    author: 'Maya T.',
    role: 'Systems Engineer',
    company: 'Context Engine Labs',
  },
]

export default function TrustMetricsSection() {
  return (
    <section className="py-20 md:py-28 bg-canvas border-t border-hairline">
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
        {/* Section Header */}
        <div className="max-w-2xl mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-caption text-primary mb-3">
            <span>05 / Reliability & Scale</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-[40px] font-normal text-ink leading-[1.15] tracking-display-lg mb-4">
            Engineered for mission-critical workflows.
          </h2>
          <p className="text-sm sm:text-base text-body leading-relaxed">
            Tested across monorepos containing millions of lines of code and hundreds of internal documentation pages.
          </p>
        </div>

        {/* 4 Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-14">
          {METRICS.map((metric, idx) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.06 }}
              className="bg-surface-card rounded-lg border border-hairline p-5 flex flex-col justify-between"
            >
              <div className="text-3xl sm:text-4xl font-normal text-ink tracking-display-md mb-2 font-mono">
                {metric.value}
              </div>
              <div>
                <div className="text-xs sm:text-sm font-semibold text-ink mb-1">
                  {metric.label}
                </div>
                <div className="text-[11px] sm:text-xs text-body leading-relaxed">
                  {metric.description}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* 2 Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {TESTIMONIALS.map((t, idx) => (
            <motion.div
              key={t.author}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="bg-surface-card rounded-lg border border-hairline p-6 flex flex-col justify-between"
            >
              <p className="text-xs sm:text-sm text-body leading-relaxed italic mb-6">
                "{t.quote}"
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-hairline">
                <div>
                  <div className="text-xs font-semibold text-ink">{t.author}</div>
                  <div className="text-[11px] text-muted">{t.role}</div>
                </div>
                <span className="text-[11px] font-mono text-muted">{t.company}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}


