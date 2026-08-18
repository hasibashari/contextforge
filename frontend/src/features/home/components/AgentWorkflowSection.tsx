import { motion } from 'motion/react'
import { Brain, Cpu, ShieldCheck, FileCheck, CheckCircle2 } from 'lucide-react'

const STEPS = [
  {
    step: '01',
    stageLabel: 'Thinking',
    pillClass: 'bg-[#dfa88f] text-[#26251e]',
    title: '1. Objective & Task Planning',
    description:
      'The agent receives natural language instructions, breaks complex goals into structured sub-tasks, and establishes measurable pass/fail checkpoints.',
    icon: Brain,
    activityLabel: 'Agent Activity:',
    activityText: 'Formulating 4 deterministic checkpoints before deep context scanning.',
  },
  {
    step: '02',
    stageLabel: 'Grepping & Reading',
    pillClass: 'bg-[#9fc9a2] text-[#26251e]',
    title: '2. Comprehensive Context Ingestion',
    description:
      'Reads project repositories on GitHub, company SOPs in Notion, and live documentation across the web simultaneously for complete domain context.',
    icon: Cpu,
    activityLabel: 'Agent Activity:',
    activityText: 'Ingested 48 codebase files, 1 security policy doc, and 1 web API specification.',
  },
  {
    step: '03',
    stageLabel: 'Editing',
    pillClass: 'bg-[#c0a8dd] text-[#26251e]',
    title: '3. Automated Analysis & Verification',
    description:
      'Synthesizes exact solutions, runs automated test simulations in sandboxed environments, and verifies that zero regressions or CVEs are introduced.',
    icon: ShieldCheck,
    activityLabel: 'Agent Activity:',
    activityText: 'Automated test suite passed: 14 test cases verified, 0 vulnerabilities.',
  },
  {
    step: '04',
    stageLabel: 'Done',
    pillClass: 'bg-[#c08532] text-[#ffffff]',
    title: '4. Ready-to-Execute Action Plan',
    description:
      'Delivers an executive action plan: structured checklist, impact analysis, estimated completion time, and pull request draft ready for human sign-off.',
    icon: FileCheck,
    activityLabel: 'Agent Activity:',
    activityText: 'Action plan deliverable generated and awaiting your review.',
  },
]

export default function AgentWorkflowSection() {
  return (
    <section id="workflow" className="py-20 md:py-28 bg-canvas border-t border-hairline">
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
        {/* Section Header */}
        <div className="max-w-2xl mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-caption text-primary mb-3">
            <span>02 / Autonomous Engine</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-[40px] font-normal text-ink leading-[1.15] tracking-display-lg mb-4">
            Transparent at every step, from goal to execution.
          </h2>
          <p className="text-sm sm:text-base text-body leading-relaxed">
            No confusing "black box" guesswork. You always have complete visibility into what your
            agent is thinking, researching, testing, and preparing.
          </p>
        </div>

        {/* 4 Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {STEPS.map((step, idx) => {
            const Icon = step.icon
            return (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                className="bg-surface-card rounded-lg border border-hairline p-6 flex flex-col justify-between hover:border-hairline-strong transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-md bg-canvas-soft border border-hairline flex items-center justify-center text-ink">
                        <Icon size={16} />
                      </div>
                      <span className="text-xs font-mono font-semibold text-muted">
                        STEP {step.step}
                      </span>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-caption ${step.pillClass}`}
                    >
                      {step.stageLabel}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-semibold text-ink mb-2">
                    {step.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-body leading-relaxed mb-6">
                    {step.description}
                  </p>
                </div>

                {/* Activity Badge Box */}
                <div className="bg-canvas-soft rounded-md border border-hairline p-3 flex items-start gap-2.5 text-xs text-ink">
                  <CheckCircle2 size={15} className="text-semantic-success shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-muted text-[11px] block mb-0.5">
                      {step.activityLabel}
                    </span>
                    <span className="text-xs text-body leading-relaxed">
                      {step.activityText}
                    </span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}


