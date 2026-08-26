import { motion } from 'motion/react'
import { Brain, Cpu, ShieldCheck, FileCheck, CheckCircle2 } from 'lucide-react'

const STEPS = [
  {
    step: '01',
    stageLabel: 'Multi-Source',
    pillClass: 'bg-primary-soft text-primary border border-primary-subtle',
    title: '1. Multi-Source Context Ingestion',
    description:
      'The agent gathers real-world signals across Google Calendar meetings, Android device telemetry (Screen Time, battery), and your existing Obsidian vault.',
    icon: Brain,
    activityLabel: 'Agent Activity:',
    activityText: 'Ingested 4 calendar events, Android telemetry stream, and 365 vault daily notes.',
  },
  {
    step: '02',
    stageLabel: 'Reasoning',
    pillClass: 'bg-[#7c3aed]/15 text-[#7c3aed] border border-[#7c3aed]/30',
    title: '2. SOP Playbook & Skill Execution',
    description:
      'Matches your natural language instruction to standardized SOP skills, applying deterministic rules and domain-specific formatting.',
    icon: Cpu,
    activityLabel: 'Agent Activity:',
    activityText: 'Loaded `obsidian-note-creator` & `android-telemetry-audit` playbooks.',
  },
  {
    step: '03',
    stageLabel: 'Safety Gate',
    pillClass: 'bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30',
    title: '3. Strict Human-In-The-Loop (HITL)',
    description:
      'Enforces safety policies: external mutations, file writes, and database modifications require explicit human sign-off before execution.',
    icon: ShieldCheck,
    activityLabel: 'Agent Activity:',
    activityText: 'Guarded mutation checked: 0 unauthorized writes, awaiting user sign-off.',
  },
  {
    step: '04',
    stageLabel: 'Delivery',
    pillClass: 'bg-semantic-success/15 text-semantic-success border border-semantic-success/30',
    title: '4. Atomic Note & Action Delivery',
    description:
      'Delivers verified atomic Markdown notes directly to your local Obsidian vault with frontmatter, backlinks, and automated background tasks.',
    icon: FileCheck,
    activityLabel: 'Agent Activity:',
    activityText: 'Saved `2026-08-26-daily-briefing.md` and updated Notion sprint tasks.',
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
            Transparent at every step, from prompt to local note delivery.
          </h2>
          <p className="text-sm sm:text-base text-body leading-relaxed">
            No black-box guesswork. You always have complete visibility into what your
            agent is reading, reasoning, validating, and writing.
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
                className="bg-surface-card rounded-2xl border border-hairline p-6 flex flex-col justify-between hover:border-hairline-strong transition-all shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-canvas-soft border border-hairline flex items-center justify-center text-ink">
                        <Icon size={16} />
                      </div>
                      <span className="text-xs font-mono font-semibold text-muted">
                        STEP {step.step}
                      </span>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-caption ${step.pillClass}`}
                    >
                      {step.stageLabel}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-semibold text-ink mb-2 font-sans">
                    {step.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-body leading-relaxed mb-6 font-sans">
                    {step.description}
                  </p>
                </div>

                {/* Activity Badge Box */}
                <div className="bg-canvas-soft rounded-xl border border-hairline p-3 flex items-start gap-2.5 text-xs text-ink font-sans">
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


