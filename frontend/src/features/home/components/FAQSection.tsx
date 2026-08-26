import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Plus, Minus } from 'lucide-react'

const FAQS = [
  {
    question: 'Bagaimana ContextForge terhubung ke vault Obsidian saya?',
    answer:
      'ContextForge membaca dan menulis catatan Markdown langsung ke vault lokal Anda dengan format atomic, frontmatter metadata YAML, dan bi-directional backlinks. Anda juga dapat membuka catatan yang dihasilkan langsung di aplikasi Obsidian Desktop dengan 1 klik.',
  },
  {
    question: 'Bagaimana cara kerja Android MCP Bridge?',
    answer:
      'Android Bridge menghubungkan smartphone Android Anda via Termux atau ADB. Ini memungkinkan agen AI memeriksa status baterai, memantau aplikasi yang sedang berjalan, menganalisis statistik Screen Time, dan mengirimkan notifikasi push secara langsung ke ponsel Anda.',
  },
  {
    question: 'Apakah agen AI dapat memodifikasi file atau database tanpa izin?',
    answer:
      'Tidak pernah. ContextForge beroperasi di bawah gerbang keamanan Strict Human-in-the-Loop (HITL). Agen dapat bernalar dan menganalisis secara mandiri, namun setiap aksi penulisan file ke disk, modifikasi database, atau pengiriman data eksternal memerlukan persetujuan eksplisit Anda.',
  },
  {
    question: 'Layanan dan protokol apa saja yang didukung out-of-the-box?',
    answer:
      'ContextForge mendukung Obsidian Vault, Android Mobile Bridge, Google Calendar, Notion Database, dan Live Web Grounding (Tavily). Selain itu, Anda dapat menghubungkan custom tools apa pun yang mematuhi standar Model Context Protocol (MCP).',
  },
  {
    question: 'Dapatkah saya menjadwalkan workflow automasi harian (Cron)?',
    answer:
      'Ya. Modul Automasi ContextForge memungkinkan Anda mengatur jadwal cron berulang (misalnya briefing harian pukul 07:00 pagi yang merangkum agenda rapat Google Calendar dan kebiasaan Screen Time ke dalam daily note Obsidian).',
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


