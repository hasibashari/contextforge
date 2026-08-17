import { motion } from 'motion/react'

const METRICS = [
  {
    value: '10x',
    label: 'Faster Workflow Execution',
    description: 'Autonomous research, AST parsing, and action plan delivery in minutes.',
  },
  {
    value: '99.4%',
    label: 'Grounded Context Recall',
    description: 'Zero hallucinated APIs through verified repository and documentation indexing.',
  },
  {
    value: '50+',
    label: 'Popular App Connectors',
    description: 'Connect GitHub, Notion, Linear, Confluence, Slack, and team databases.',
  },
  {
    value: '100%',
    label: 'Human Approval Gates',
    description: 'No code commits or actions are dispatched without explicit human sign-off.',
  },
]

const TESTIMONIALS = [
  {
    quote:
      'ContextForge transformed how our platform team handles architectural migrations. Instead of spending 2 weeks manually checking 80 microservices, an agent synthesized the entire migration action plan in 15 minutes.',
    author: 'Alexandre R.',
    role: 'Principal Staff Engineer',
    company: 'CloudScale Infrastructure',
  },
  {
    quote:
      'The multi-source ingestion is unmatched. The agent read our internal Notion security RFCs alongside our GitHub pull requests and caught three subtle race conditions before code review.',
    author: 'Elena V.',
    role: 'Head of Developer Productivity',
    company: 'Fintech Core Labs',
  },
]

export default function TrustMetrics() {
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


