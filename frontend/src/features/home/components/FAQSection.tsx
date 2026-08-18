import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Plus, Minus } from 'lucide-react'

const FAQS = [
  {
    question: 'How is ContextForge different from a standard AI chatbot?',
    answer:
      'Standard chatbots only provide isolated conversational text without deep understanding of your codebase. ContextForge reads your GitHub repositories, internal team SOPs in Notion/Confluence, and live web references simultaneously, delivering deterministic Action Plans with verified steps and pull request drafts ready for immediate execution.',
  },
  {
    question: 'Is it secure to connect proprietary code and confidential team documents?',
    answer:
      'Yes, absolutely. ContextForge uses ephemeral, scoped access tokens and enterprise-grade encryption. Your proprietary source code and private documents are never used to train global AI models or shared with third parties.',
  },
  {
    question: 'Can agents modify code or make decisions without my explicit permission?',
    answer:
      'Never. ContextForge operates under strict Human-in-the-Loop approval gates. The agent analyzes context, simulates solutions in isolated sandboxes, and formats clear action plans. Applying changes or opening Pull Requests always requires your explicit confirmation.',
  },
  {
    question: 'Which applications and tools can I connect out of the box?',
    answer:
      'You can instantly connect GitHub, GitLab, Notion, Confluence, Linear, Jira, Slack, Discord, Google Docs, and technical PDFs. You can also connect internal microservices and databases via the open Model Context Protocol (MCP) standard.',
  },
  {
    question: 'Do I need to write complex prompts or code to use the platform?',
    answer:
      'No. You can delegate tasks in plain natural language (for example: "Audit our auth middleware for OAuth 2.1 compliance and draft a migration plan"). The agent autonomously handles context discovery, analysis, and verification.',
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


