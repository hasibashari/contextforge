import { motion } from 'motion/react'
import {
  Terminal,
  Sparkles,
  Copy,
  Check,
  CheckCircle2,
  Layers,
  Smartphone,
  Calendar,
  FileSpreadsheet,
  Globe2,
  ShieldCheck,
} from 'lucide-react'
import { useState } from 'react'

const INTEGRATIONS = [
  {
    name: 'Obsidian Vault Protocol',
    category: 'Personal Knowledge Base',
    desc: 'Reads daily notes, bi-directional backlinks, frontmatter, and opens notes in Obsidian app via custom URI.',
    icon: Layers,
    status: '1-Click Active',
    accent: 'text-[#7c3aed]',
  },
  {
    name: 'Android Mobile MCP',
    category: 'Device Telemetry & ADB',
    desc: 'Reads Screen Time, battery health, running background apps, and triggers device push notifications.',
    icon: Smartphone,
    status: '1-Click Active',
    accent: 'text-[#10b981]',
  },
  {
    name: 'Google Calendar MCP',
    category: 'Schedule & Meetings',
    desc: 'Synchronizes daily events, generates meeting preparation briefings, and detects agenda conflicts.',
    icon: Calendar,
    status: '1-Click Active',
    accent: 'text-[#0284c7]',
  },
  {
    name: 'Notion Database MCP',
    category: 'Team Wiki & Tasks',
    desc: 'Retrieves sprint task backlogs, syncs project docs, and writes structured database entries.',
    icon: FileSpreadsheet,
    status: '1-Click Active',
    accent: 'text-[#3b82f6]',
  },
  {
    name: 'Live Web Grounding',
    category: 'Real-Time Research',
    desc: 'Searches official developer documentation, package registries, and RFC specs via Tavily API.',
    icon: Globe2,
    status: 'Automated',
    accent: 'text-[#14b8a6]',
  },
  {
    name: 'Custom MCP Servers',
    category: 'Extensibility Standard',
    desc: 'Connect any Model Context Protocol compliant server via Stdio or SSE transport channels.',
    icon: Terminal,
    status: 'MCP Native',
    accent: 'text-primary',
  },
]

const CODE_EXAMPLE = `// Define autonomous workflow with Obsidian & Android MCP tools
import { defineAutomation, mcp } from '@contextforge/sdk'

export const dailyBriefingWorkflow = defineAutomation({
  name: 'Executive Morning Briefing',
  trigger: {
    type: 'schedule',
    cron: '0 7 * * 1-5', // Mon-Fri at 07:00 AM
  },
  agent: 'ExecutiveAssist',
  mcpServers: ['obsidian-bridge', 'android-bridge', 'google-calendar'],
  prompt: 'Ingest today calendar events, yesterday Android screen time, and synthesize daily note to Obsidian.',
  guardrails: {
    requireHumanApprovalForWrites: true,
  },
})`

export default function ExtensibilitySection() {
  const [activeTab, setActiveTab] = useState<'visual' | 'code'>('visual')
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(CODE_EXAMPLE)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section id="extensibility" className="py-20 md:py-28 bg-canvas border-t border-hairline">
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-caption text-primary mb-3">
              <span>04 / Integrations & Ecosystem</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-[40px] font-normal text-ink leading-[1.15] tracking-display-lg mb-4">
              Seamlessly connects with your existing toolstack.
            </h2>
            <p className="text-sm sm:text-base text-body leading-relaxed">
              Use pre-built connectors in a single click, or integrate custom enterprise tools
              via the open Model Context Protocol (MCP) standard.
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center p-1 bg-surface-strong rounded-lg self-start md:self-auto border border-hairline">
            <button
              onClick={() => setActiveTab('visual')}
              className={`px-4 py-2 rounded-md text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'visual'
                  ? 'bg-surface-card text-ink shadow-xs'
                  : 'text-body hover:text-ink'
              }`}
            >
              Pre-built Connectors
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`px-4 py-2 rounded-md text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'code'
                  ? 'bg-surface-card text-ink shadow-xs'
                  : 'text-body hover:text-ink'
              }`}
            >
              Developer SDK (MCP)
            </button>
          </div>
        </div>

        {/* Content View 1: Visual Integrations Grid */}
        {activeTab === 'visual' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {INTEGRATIONS.map((item, idx) => {
              const Icon = item.icon
              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  className="bg-surface-card rounded-lg border border-hairline p-5 flex flex-col justify-between hover:border-hairline-strong transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3.5">
                      <div className="w-9 h-9 rounded-md bg-canvas-soft border border-hairline flex items-center justify-center text-ink">
                        <Icon size={18} />
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-strong text-muted">
                        {item.category}
                      </span>
                    </div>

                    <h3 className="text-base font-semibold text-ink mb-1.5">{item.name}</h3>
                    <p className="text-xs text-body leading-relaxed mb-4">{item.desc}</p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-hairline-soft text-[11px]">
                    <span className="text-muted">Connection Status:</span>
                    <span className="text-semantic-success font-medium flex items-center gap-1">
                      <CheckCircle2 size={12} />
                      <span>{item.status}</span>
                    </span>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Content View 2: Developer Code Block */}
        {activeTab === 'code' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-surface-card rounded-lg border border-hairline overflow-hidden shadow-xs"
          >
            <div className="bg-canvas-soft border-b border-hairline px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal size={14} className="text-ink" />
                <span className="text-xs font-mono text-ink">agent.config.ts</span>
                <span className="text-[10px] font-mono text-muted">TypeScript SDK</span>
              </div>

              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 text-xs text-body hover:text-ink font-mono px-2 py-1 rounded hover:bg-surface-strong transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check size={12} className="text-semantic-success" />
                    <span className="text-semantic-success">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-5 bg-ink text-canvas-soft font-mono text-xs leading-relaxed overflow-x-auto">
              <pre>
                <code>{CODE_EXAMPLE}</code>
              </pre>
            </div>

            <div className="bg-canvas-soft border-t border-hairline p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="flex items-center gap-2 text-ink">
                <Sparkles size={14} className="text-primary shrink-0" />
                <span>Automated Schema Validation</span>
              </div>
              <div className="flex items-center gap-2 text-ink">
                <ShieldCheck size={14} className="text-semantic-success shrink-0" />
                <span>Air-Gapped & Secure Execution</span>
              </div>
              <div className="flex items-center gap-2 text-ink">
                <Layers size={14} className="text-timeline-edit shrink-0" />
                <span>Open Model Context Protocol (MCP)</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  )
}


