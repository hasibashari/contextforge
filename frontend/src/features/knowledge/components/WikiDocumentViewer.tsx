import React from 'react'
import {
  FileText,
  Clock,
  Tag,
  Link as LinkIcon,
  ArrowUpRight,
  Sparkles,
  Layers,
  BookOpen,
} from 'lucide-react'
import type { WikiPage } from '@/shared/types/wiki'
import { MarkdownRenderer } from '@/shared/components/MarkdownRenderer'

interface WikiDocumentViewerProps {
  page: WikiPage | null
  onNavigateToPage: (slugOrTitle: string) => void
}

export const WikiDocumentViewer: React.FC<WikiDocumentViewerProps> = ({
  page,
  onNavigateToPage,
}) => {
  if (!page) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100 text-center p-8 bg-canvas-soft/30 rounded-2xl border border-hairline border-dashed">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-3 shadow-inner">
          <BookOpen size={28} />
        </div>
        <h3 className="text-base font-semibold text-ink">No Wiki Document Selected</h3>
        <p className="text-xs text-muted max-w-sm mt-1">
          Select a concept, entity, or index from the left sidebar to explore your compiled knowledge graph.
        </p>
      </div>
    )
  }

  const categoryColorMap: Record<string, string> = {
    index: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/30',
    log: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
    concept: 'bg-primary/10 text-primary border-primary/30',
    entity: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
    synthesis: 'bg-purple-500/10 text-purple-500 border-purple-500/30',
    overview: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
  }

  const badgeStyle =
    categoryColorMap[page.category] ||
    'bg-canvas-soft text-ink border-hairline'

  return (
    <div className="space-y-6">
      {/* Header Metadata Bar */}
      <div className="bg-canvas-soft/40 backdrop-blur-md rounded-2xl p-5 border border-hairline shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider border ${badgeStyle}`}
            >
              {page.category}
            </span>
            <span className="text-xs font-mono text-muted flex items-center gap-1">
              <Layers size={13} />
              {page.path}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted font-mono">
            <div className="flex items-center gap-1">
              <Clock size={13} />
              <span>{page.updatedAt ? new Date(page.updatedAt).toLocaleDateString() : 'Active'}</span>
            </div>
            <div className="flex items-center gap-1">
              <FileText size={13} />
              <span>{page.wordCount || 0} words</span>
            </div>
          </div>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-ink tracking-tight flex items-center gap-2">
          {page.title}
        </h1>

        {/* Tags & Sources Frontmatter */}
        {page.frontmatter?.tags && Array.isArray(page.frontmatter.tags) && page.frontmatter.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <Tag size={12} className="text-muted mr-0.5" />
            {page.frontmatter.tags.map((tag: string, i: number) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-md bg-canvas-soft text-muted hover:text-ink text-[11px] font-mono border border-hairline transition-colors"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Main Markdown Body */}
      <div className="bg-canvas-card rounded-2xl p-6 sm:p-8 border border-hairline shadow-sm min-h-87.5">
        <MarkdownRenderer
          content={page.content}
          onWikilinkClick={(target) => onNavigateToPage(target)}
        />
      </div>

      {/* Backlinks & Connected Graph Insights Footer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Inbound Backlinks */}
        <div className="bg-canvas-soft/30 rounded-2xl p-4 border border-hairline space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold text-ink">
            <div className="flex items-center gap-1.5">
              <LinkIcon size={14} className="text-primary" />
              <span>Referenced In (Inbound Backlinks)</span>
            </div>
            <span className="font-mono text-[11px] text-muted">
              {page.backlinks?.length || 0} notes
            </span>
          </div>

          {page.backlinks && page.backlinks.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {page.backlinks.map((linkTitle, idx) => (
                <button
                  key={idx}
                  onClick={() => onNavigateToPage(linkTitle)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-canvas-card hover:bg-primary/10 text-xs text-ink hover:text-primary border border-hairline hover:border-primary/30 transition-all font-mono shadow-2xs group cursor-pointer"
                >
                  <ArrowUpRight size={11} className="text-muted group-hover:text-primary transition-colors" />
                  <span>{linkTitle}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted italic">
              No inbound backlinks yet. This page is referenced as a leaf concept.
            </p>
          )}
        </div>

        {/* Outbound Wikilinks */}
        <div className="bg-canvas-soft/30 rounded-2xl p-4 border border-hairline space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold text-ink">
            <div className="flex items-center gap-1.5">
              <Sparkles size={14} className="text-purple-500" />
              <span>Referenced Concepts (Outlinks)</span>
            </div>
            <span className="font-mono text-[11px] text-muted">
              {page.outlinks?.length || 0} links
            </span>
          </div>

          {page.outlinks && page.outlinks.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {page.outlinks.map((linkTarget, idx) => (
                <button
                  key={idx}
                  onClick={() => onNavigateToPage(linkTarget)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/5 hover:bg-purple-500/15 text-xs text-purple-600 dark:text-purple-400 border border-purple-500/20 hover:border-purple-500/40 transition-all font-mono shadow-2xs cursor-pointer"
                >
                  <BookOpen size={11} />
                  <span>{linkTarget}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted italic">
              No outbound links found in this document.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
