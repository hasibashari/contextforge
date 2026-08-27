import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Plus, Minus } from 'lucide-react'

const FAQS = [
  {
    question: 'How does ContextForge connect to my local Obsidian vault?',
    answer:
      'ContextForge reads and writes Markdown notes directly to your local vault using atomic formatting, YAML frontmatter metadata, and bi-directional backlinks. You can also open generated notes directly in your Obsidian Desktop app with a single click.',
  },
  {
    question: 'How does the Android MCP Bridge work?',
    answer:
      'The Android Bridge connects your Android smartphone via Termux or ADB over the Model Context Protocol. This enables AI agents to check battery status, monitor running apps, analyze Screen Time metrics, and dispatch local push notifications directly to your phone.',
  },
  {
    question: 'Can AI agents modify files or databases without permission?',
    answer:
      'Never. ContextForge operates under strict Human-in-the-Loop (HITL) safety verification gates. Agents can autonomously reason and plan, but every disk write, database modification, or external action requires your explicit approval.',
  },
  {
    question: 'Which services and protocols are supported out of the box?',
    answer:
      'ContextForge natively supports Obsidian Vaults, Android Mobile Bridge, Google Calendar, Notion Databases, and Live Web Grounding (Tavily). Additionally, you can connect any custom tool or server compliant with the open Model Context Protocol (MCP) standard.',
  },
  {
    question: 'Can I schedule recurring automated daily workflows (Cron)?',
    answer:
      'Yes. The Automations module allows you to configure recurring cron schedules (e.g. a 07:00 AM daily morning briefing that aggregates your Google Calendar agenda and screen time habits directly into an Obsidian daily note).',
  },
]

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx)
  }

  return (
    <section id="faq" className="py-20 md:py-28 bg-canvas border-t border-hairline">
      <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-caption text-primary mb-3">
            <span>06 / Frequently Asked Questions</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-[40px] font-normal text-ink leading-[1.15] tracking-display-lg mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-sm sm:text-base text-body leading-relaxed">
            Everything you need to know about security, context ingestion, and autonomous agent orchestration.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx
            return (
              <div
                key={faq.question}
                className="bg-surface-card rounded-lg border border-hairline overflow-hidden transition-colors"
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer select-none"
                >
                  <span className="text-sm sm:text-base font-semibold text-ink">
                    {faq.question}
                  </span>
                  <div className="w-6 h-6 rounded bg-canvas-soft border border-hairline flex items-center justify-center text-ink shrink-0">
                    {isOpen ? <Minus size={14} /> : <Plus size={14} />}
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-body leading-relaxed border-t border-hairline-soft">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}


