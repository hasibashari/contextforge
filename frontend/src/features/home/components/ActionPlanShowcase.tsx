import { motion } from 'motion/react'
import { XCircle, CheckCircle2, ArrowRight, ShieldCheck, Clock, FileText } from 'lucide-react'

export default function ActionPlanShowcase() {
  return (
    <section id="action-plans" className="py-20 md:py-28 bg-canvas border-t border-hairline">
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
        {/* Section Header */}
        <div className="max-w-2xl mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-caption text-primary mb-3">
            <span>03 / Concrete Deliverables</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-[40px] font-normal text-ink leading-[1.15] tracking-display-lg mb-4">
            Chat is ephemeral. Action plans are executable.
          </h2>
          <p className="text-sm sm:text-base text-body leading-relaxed">
            Standard AI chatbots only produce unstructured text that requires tedious manual review.
            ContextForge generates comprehensive, verified action plans ready for immediate team execution.
          </p>
        </div>

        {/* Side-by-Side Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Legacy Chat AI */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="bg-surface-card/60 rounded-lg border border-hairline p-6 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-hairline mb-4">
                <span className="text-xs font-semibold text-muted uppercase tracking-caption">
                  Standard AI Chatbot
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-strong text-muted">
                  Passive Conversational Text
                </span>
              </div>

              <div className="space-y-3 mb-6">
                <div className="p-3.5 rounded bg-canvas-soft border border-hairline-soft text-xs text-muted leading-relaxed">
                  "Here is an 8-paragraph essay explaining your issue. Please search through your files manually to find where to apply this, and copy-paste this untyped code block..."
                </div>
                <div className="p-3.5 rounded bg-canvas-soft border border-hairline-soft text-xs text-muted leading-relaxed">
                  "Note: I cannot see your open PRs or internal team SOPs, so this code might break existing session state."
                </div>
              </div>

              <ul className="space-y-2.5 text-xs text-body">
                <li className="flex items-center gap-2 text-muted">
                  <XCircle size={14} className="text-semantic-error shrink-0" />
                  <span>Does not read full project context or internal team SOPs</span>
                </li>
                <li className="flex items-center gap-2 text-muted">
                  <XCircle size={14} className="text-semantic-error shrink-0" />
                  <span>No automated test execution or validation sandbox</span>
                </li>
                <li className="flex items-center gap-2 text-muted">
                  <XCircle size={14} className="text-semantic-error shrink-0" />
                  <span>Requires heavy manual copy-pasting and human verification</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-hairline text-center text-xs font-mono text-muted">
              Result: High cognitive load & high risk of bugs
            </div>
          </motion.div>

          {/* ContextForge Action Plan Artifact */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-surface-card rounded-lg border border-hairline-strong p-6 flex flex-col justify-between relative shadow-xs"
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-hairline mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-xs font-semibold text-ink uppercase tracking-caption">
                    ContextForge Action Plan
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-timeline-done text-on-primary font-medium">
                  READY TO EXECUTE
                </span>
              </div>

              {/* Action Plan Summary Card */}
              <div className="bg-canvas-soft rounded-md border border-hairline p-4 mb-4 text-xs">
                <div className="flex items-center justify-between text-[11px] text-muted pb-2 mb-3 border-b border-hairline">
                  <span className="flex items-center gap-1.5 font-medium text-ink">
                    <FileText size={13} className="text-primary" />
                    <span>Deliverable: Security Migration Action Plan</span>
                  </span>
                  <span className="text-semantic-success flex items-center gap-1 font-mono text-[10px]">
                    <ShieldCheck size={12} />
                    <span>14 Tests Passed</span>
                  </span>
                </div>

                {/* Structured Checkpoints */}
                <div className="space-y-2 text-ink">
                  <div className="flex items-start gap-2 bg-surface-card p-2 rounded border border-hairline">
                    <CheckCircle2 size={14} className="text-semantic-success shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-xs text-ink">Step 1: Upgrade Auth Middleware</div>
                      <div className="text-[11px] text-body">3 files updated to enforce OAuth 2.1 PKCE standards.</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 bg-surface-card p-2 rounded border border-hairline">
                    <CheckCircle2 size={14} className="text-semantic-success shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-xs text-ink">Step 2: Sync with Team Security SOP</div>
                      <div className="text-[11px] text-body">Verified against internal guidelines in Notion workspace.</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 bg-surface-card p-2 rounded border border-hairline">
                    <CheckCircle2 size={14} className="text-semantic-success shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-xs text-ink">Step 3: Run Automated Regression Suite</div>
                      <div className="text-[11px] text-body">Zero broken dependencies across all connected services.</div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] text-muted pt-2 border-t border-hairline">
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    <span>Execution Time: 4.8s</span>
                  </span>
                  <span className="text-semantic-success font-medium">100% Ready for Human Sign-Off</span>
                </div>
              </div>

              <ul className="space-y-2 text-xs text-ink font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-semantic-success shrink-0" />
                  <span>Grounded in real context from code, docs, and live web</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-semantic-success shrink-0" />
                  <span>Structured action items with clear ownership and estimates</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-semantic-success shrink-0" />
                  <span>One-click execution or export to GitHub PR & Notion</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-hairline flex items-center justify-between">
              <span className="text-xs text-muted">You stay in complete control</span>
              <a
                href="#hero-sandbox"
                className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary-active text-on-primary text-xs font-medium px-3.5 py-1.5 rounded-md transition-colors cursor-pointer"
              >
                <span>Try Action Plan Generator</span>
                <ArrowRight size={12} />
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}


