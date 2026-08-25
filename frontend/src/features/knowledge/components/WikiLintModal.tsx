import React from 'react'
import {
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  X,
  RefreshCw,
  Sparkles,
  ArrowRight,
} from 'lucide-react'
import type { WikiLintReport } from '@/shared/types/wiki'
import { Button } from '@/shared'

interface WikiLintModalProps {
  isOpen: boolean
  onClose: () => void
  report: WikiLintReport | null
  isLoading: boolean
  onReRunLint: () => void
  onNavigateToPage: (pagePath: string) => void
}

export const WikiLintModal: React.FC<WikiLintModalProps> = ({
  isOpen,
  onClose,
  report,
  isLoading,
  onReRunLint,
  onNavigateToPage,
}) => {
  if (!isOpen) return null

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30'
    if (score >= 65) return 'text-amber-500 bg-amber-500/10 border-amber-500/30'
    return 'text-red-500 bg-red-500/10 border-red-500/30'
  }

  const scoreBadge = report ? getScoreColor(report.healthScore) : ''

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-canvas-card w-full max-w-2xl rounded-2xl border border-hairline shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-hairline bg-canvas-soft/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-ink">
                LLM Wiki Health & Contradiction Audit
              </h2>
              <p className="text-xs text-muted">
                Continuous knowledge graph linting, contradiction detection, and gap analysis.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-canvas-soft transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
              <RefreshCw size={28} className="text-primary animate-spin" />
              <p className="text-sm font-medium text-ink">
                AI is inspecting cross-references and detecting contradictions...
              </p>
              <p className="text-xs text-muted max-w-md">
                Analyzing knowledge consistency, orphan notes, and unexplored graph clusters.
              </p>
            </div>
          ) : report ? (
            <>
              {/* Summary Metric Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-canvas-soft/40 border border-hairline text-center space-y-1">
                  <span className="text-[11px] font-mono text-muted uppercase">Health Score</span>
                  <div className="flex items-center justify-center">
                    <span className={`px-3 py-1 rounded-full text-base font-mono font-bold border ${scoreBadge}`}>
                      {report.healthScore}/100
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-canvas-soft/40 border border-hairline text-center space-y-1">
                  <span className="text-[11px] font-mono text-muted uppercase">Total Notes</span>
                  <div className="text-lg font-bold font-mono text-ink">
                    {report.totalPages}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-canvas-soft/40 border border-hairline text-center space-y-1">
                  <span className="text-[11px] font-mono text-muted uppercase">Connections</span>
                  <div className="text-lg font-bold font-mono text-purple-500">
                    {report.totalConnections}
                  </div>
                </div>
              </div>

              {/* Detected Issues */}
              <div className="space-y-3">
                <h3 className="text-xs font-mono font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle size={13} className="text-amber-500" />
                  <span>Detected Issues & Discrepancies ({report.issues.length})</span>
                </h3>

                {report.issues.length > 0 ? (
                  <div className="space-y-2.5">
                    {report.issues.map((issue, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-canvas-soft/30 border border-hairline space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            {issue.title}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-canvas-soft text-muted border border-hairline">
                            {issue.severity}
                          </span>
                        </div>

                        <p className="text-xs text-body leading-relaxed">
                          {issue.description}
                        </p>

                        {issue.suggestion && (
                          <div className="text-[11px] font-mono text-primary bg-primary/5 p-2 rounded-lg border border-primary/20 flex items-center gap-1.5">
                            <Sparkles size={12} className="shrink-0" />
                            <span>Suggestion: {issue.suggestion}</span>
                          </div>
                        )}

                        {issue.pagesInvolved && issue.pagesInvolved.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="text-[10px] font-mono text-muted">Pages:</span>
                            {issue.pagesInvolved.map((p, pi) => (
                              <button
                                key={pi}
                                onClick={() => {
                                  onNavigateToPage(p)
                                  onClose()
                                }}
                                className="text-[11px] font-mono text-ink hover:text-primary underline flex items-center gap-0.5 cursor-pointer"
                              >
                                <span>{p}</span>
                                <ArrowRight size={10} />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400">
                    🎉 Excellent! No contradictions, broken links, or orphan notes found.
                  </div>
                )}
              </div>

              {/* Suggested Questions / Knowledge Exploration */}
              {report.suggestedQuestions && report.suggestedQuestions.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-mono font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                    <HelpCircle size={13} className="text-purple-500" />
                    <span>Suggested Next Research Questions</span>
                  </h3>

                  <div className="space-y-2">
                    {report.suggestedQuestions.map((q, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20 text-xs text-ink flex items-start gap-2"
                      >
                        <span className="font-mono text-purple-500 font-bold">
                          {idx + 1}.
                        </span>
                        <span>{q}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-hairline bg-canvas-soft/40">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw size={13} />}
            onClick={onReRunLint}
            disabled={isLoading}
          >
            Re-run Audit
          </Button>

          <Button variant="primary" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  )
}
