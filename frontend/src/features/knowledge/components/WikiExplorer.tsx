import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Search,
  BookOpen,
  Network,
  ShieldCheck,
  Sparkles,
  FileText,
  Layers,
  RefreshCw,
  Folder,
} from 'lucide-react'
import type {
  WikiPage,
  WikiGraphData,
  WikiLintReport,
  WikiIngestResult,
} from '@/shared/types/wiki'
import { useWorkspace } from '@/shared/context'
import { Button } from '@/shared/components'
import { WikiDocumentViewer } from './WikiDocumentViewer'
import { WikiGraphView } from './WikiGraphView'
import { WikiLintModal } from './WikiLintModal'

export const WikiExplorer: React.FC = () => {
  const { knowledgeSources } = useWorkspace()

  const [pages, setPages] = useState<WikiPage[]>([])
  const [selectedSlug, setSelectedSlug] = useState<string>('index')
  const [graphData, setGraphData] = useState<WikiGraphData>({
    nodes: [],
    links: [],
  })
  const [viewMode, setViewMode] = useState<'reader' | 'graph'>('reader')
  const [searchQuery, setSearchQuery] = useState('')

  // Ingestion state
  const [isIngesting, setIsIngesting] = useState(false)
  const [ingestModalOpen, setIngestModalOpen] = useState(false)
  const [selectedSourceForIngest, setSelectedSourceForIngest] =
    useState<string>('')
  const [ingestSummary, setIngestSummary] =
    useState<WikiIngestResult | null>(null)

  // Linting state
  const [isLintModalOpen, setIsLintModalOpen] = useState(false)
  const [isLintLoading, setIsLintLoading] = useState(false)
  const [lintReport, setLintReport] = useState<WikiLintReport | null>(null)

  // Initial Data Fetching with cancellation guard
  useEffect(() => {
    let isMounted = true

    async function loadInitialWiki() {
      try {
        const [pagesRes, graphRes] = await Promise.all([
          fetch('/api/wiki/pages'),
          fetch('/api/wiki/graph'),
        ])

        if (pagesRes.ok) {
          const pData = await pagesRes.json()
          if (isMounted) {
            setPages(pData.data || [])
          }
        }

        if (graphRes.ok) {
          const gData = await graphRes.json()
          if (isMounted) {
            setGraphData(gData.data || { nodes: [], links: [] })
          }
        }
      } catch (err) {
        console.error('Failed to load wiki data:', err)
      }
    }

    void loadInitialWiki()

    return () => {
      isMounted = false
    }
  }, [])

  // Manual Refresh Function for post-ingest / reload
  const refreshWiki = useCallback(async () => {
    try {
      const [pagesRes, graphRes] = await Promise.all([
        fetch('/api/wiki/pages'),
        fetch('/api/wiki/graph'),
      ])

      if (pagesRes.ok) {
        const pData = await pagesRes.json()
        setPages(pData.data || [])
      }

      if (graphRes.ok) {
        const gData = await graphRes.json()
        setGraphData(gData.data || { nodes: [], links: [] })
      }
    } catch (err) {
      console.error('Failed to refresh wiki data:', err)
    }
  }, [])

  // Derive active selected page directly
  const selectedPage = useMemo(() => {
    if (!selectedSlug && pages.length > 0) return pages[0]
    const matched = pages.find(
      (p) =>
        p.slug === selectedSlug ||
        p.slug.toLowerCase() === selectedSlug.toLowerCase() ||
        p.title.toLowerCase() === selectedSlug.toLowerCase(),
    )
    return matched || (pages.length > 0 ? pages[0] : null)
  }, [pages, selectedSlug])

  // Handle Ingest Action
  const handleIngest = async () => {
    if (!selectedSourceForIngest) return
    const src = knowledgeSources.find((s) => s.id === selectedSourceForIngest)
    if (!src) return

    setIsIngesting(true)
    try {
      const res = await fetch('/api/wiki/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceTitle: src.name,
          content: `${src.name}: ${src.description || ''}\nLocation: ${src.location}`,
          tags: ['source-ingest'],
        }),
      })

      if (res.ok) {
        const result = await res.json()
        setIngestSummary(result.data)
        await refreshWiki()
      }
    } catch (err) {
      console.error('Ingest failed:', err)
    } finally {
      setIsIngesting(false)
    }
  }

  // Handle Run Lint Action
  const handleRunLint = async () => {
    setIsLintModalOpen(true)
    setIsLintLoading(true)
    try {
      const res = await fetch('/api/wiki/lint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (res.ok) {
        const data = await res.json()
        setLintReport(data.data)
      }
    } catch (err) {
      console.error('Linting failed:', err)
    } finally {
      setIsLintLoading(false)
    }
  }

  // Filtered pages for sidebar
  const filteredPages = useMemo(() => {
    if (!searchQuery.trim()) return pages
    const q = searchQuery.toLowerCase()
    return pages.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q),
    )
  }, [pages, searchQuery])

  // Group pages by category
  const categorized = useMemo(() => {
    const groups: Record<string, WikiPage[]> = {
      index: [],
      log: [],
      concept: [],
      entity: [],
      synthesis: [],
    }

    filteredPages.forEach((p) => {
      if (groups[p.category]) {
        groups[p.category].push(p)
      } else {
        groups.concept.push(p)
      }
    })

    return groups
  }, [filteredPages])

  const navigateToSlug = (target: string) => {
    const clean = target
      .replace(/\.md$/i, '')
      .toLowerCase()
      .replace(/[/\\_]/g, '-')
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    setSelectedSlug(clean)
    setViewMode('reader')
  }

  return (
    <div className="space-y-6">
      {/* Action Header & View Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-canvas-soft/30 p-3.5 sm:p-4 rounded-2xl border border-hairline backdrop-blur-md">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-canvas-card border border-hairline shadow-2xs">
          <button
            onClick={() => setViewMode('reader')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'reader'
                ? 'bg-primary text-white shadow-xs'
                : 'text-muted hover:text-ink hover:bg-canvas-soft'
            }`}
          >
            <BookOpen size={14} />
            <span>Document Reader</span>
          </button>
          <button
            onClick={() => setViewMode('graph')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'graph'
                ? 'bg-primary text-white shadow-xs'
                : 'text-muted hover:text-ink hover:bg-canvas-soft'
            }`}
          >
            <Network size={14} />
            <span>Knowledge Graph</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<ShieldCheck size={14} className="text-purple-500" />}
            onClick={handleRunLint}
          >
            Audit Health & Lint
          </Button>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Sparkles size={14} />}
            onClick={() => setIngestModalOpen(true)}
          >
            Ingest Source to Wiki
          </Button>
        </div>
      </div>

      {/* Main Two-Column Explorer Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: File Explorer & Search Tree (4 cols) */}
        <div className="lg:col-span-4 bg-canvas-card rounded-2xl p-4 border border-hairline shadow-sm space-y-4">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              type="text"
              placeholder="Search concepts, entities, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-canvas-soft/60 border border-hairline text-xs text-ink placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="space-y-4 max-h-150 overflow-y-auto pr-1">
            {/* Index & Logs */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold text-muted uppercase tracking-wider px-2">
                Core Catalog
              </span>
              {[...categorized.index, ...categorized.log].map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedSlug(p.slug)
                    setViewMode('reader')
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs text-left transition-all cursor-pointer ${
                    selectedSlug === p.slug
                      ? 'bg-primary/10 text-primary font-semibold border border-primary/20 shadow-2xs'
                      : 'text-body hover:bg-canvas-soft hover:text-ink'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <BookOpen size={13} className="shrink-0 text-muted" />
                    <span className="truncate">{p.title}</span>
                  </div>
                  <span className="text-[10px] font-mono text-muted uppercase">
                    {p.category}
                  </span>
                </button>
              ))}
            </div>

            {/* Concepts */}
            {categorized.concept.length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-muted uppercase tracking-wider px-2 flex items-center gap-1">
                  <Folder size={11} className="text-primary" />
                  <span>Concepts ({categorized.concept.length})</span>
                </span>
                {categorized.concept.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedSlug(p.slug)
                      setViewMode('reader')
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs text-left transition-all cursor-pointer ${
                      selectedSlug === p.slug
                        ? 'bg-primary/10 text-primary font-semibold border border-primary/20 shadow-2xs'
                        : 'text-body hover:bg-canvas-soft hover:text-ink'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText size={13} className="shrink-0 text-primary/70" />
                      <span className="truncate">{p.title}</span>
                    </div>
                    <span className="text-[10px] font-mono text-muted">
                      {p.backlinks?.length || 0} links
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Entities & Synthesis */}
            {[...categorized.entity, ...categorized.synthesis].length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-muted uppercase tracking-wider px-2 flex items-center gap-1">
                  <Layers size={11} className="text-purple-500" />
                  <span>Entities & Synthesis</span>
                </span>
                {[...categorized.entity, ...categorized.synthesis].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedSlug(p.slug)
                      setViewMode('reader')
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs text-left transition-all cursor-pointer ${
                      selectedSlug === p.slug
                        ? 'bg-primary/10 text-primary font-semibold border border-primary/20 shadow-2xs'
                        : 'text-body hover:bg-canvas-soft hover:text-ink'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Sparkles size={13} className="shrink-0 text-purple-500" />
                      <span className="truncate">{p.title}</span>
                    </div>
                    <span className="text-[10px] font-mono text-muted uppercase">
                      {p.category}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Active Document Viewer OR Graph View (8 cols) */}
        <div className="lg:col-span-8">
          {viewMode === 'graph' ? (
            <div className="space-y-4">
              <WikiGraphView
                graphData={graphData}
                onSelectNode={(nodeId) => {
                  navigateToSlug(nodeId)
                }}
                activeNodeId={selectedSlug}
              />
              <p className="text-xs text-muted text-center">
                💡 Click and drag any cluster node to inspect its document and backlinks.
              </p>
            </div>
          ) : (
            <WikiDocumentViewer
              page={selectedPage}
              onNavigateToPage={navigateToSlug}
            />
          )}
        </div>
      </div>

      {/* Ingest Source Modal */}
      {ingestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-canvas-card w-full max-w-md rounded-2xl border border-hairline shadow-2xl p-6 space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Sparkles size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-ink">
                  Ingest Raw Source to Wiki
                </h3>
                <p className="text-xs text-muted">
                  Gemini will read the raw source, extract concepts, and cross-link pages.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono font-semibold text-ink">
                Select Connected Source
              </label>
              <select
                value={selectedSourceForIngest}
                onChange={(e) => setSelectedSourceForIngest(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-canvas-soft border border-hairline text-xs text-ink focus:outline-none focus:border-primary"
              >
                <option value="">-- Choose a Knowledge Source --</option>
                {knowledgeSources.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.type})
                  </option>
                ))}
              </select>
            </div>

            {ingestSummary && (
              <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 space-y-1.5 text-xs text-ink font-mono">
                <div className="font-bold text-primary">✅ Ingestion Complete!</div>
                <div>Created: {ingestSummary.pagesCreated.join(', ') || '0'}</div>
                <div>Updated: {ingestSummary.pagesUpdated.join(', ') || '0'}</div>
                <div className="text-muted text-[11px] pt-1">{ingestSummary.summary}</div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIngestModalOpen(false)
                  setIngestSummary(null)
                }}
              >
                Close
              </Button>

              <Button
                variant="primary"
                size="sm"
                disabled={!selectedSourceForIngest || isIngesting}
                onClick={handleIngest}
                leftIcon={
                  isIngesting ? (
                    <RefreshCw size={13} className="animate-spin" />
                  ) : (
                    <Sparkles size={13} />
                  )
                }
              >
                {isIngesting ? 'Compiling Wiki...' : 'Start Ingest'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Wiki Health / Lint Modal */}
      <WikiLintModal
        isOpen={isLintModalOpen}
        onClose={() => setIsLintModalOpen(false)}
        report={lintReport}
        isLoading={isLintLoading}
        onReRunLint={handleRunLint}
        onNavigateToPage={navigateToSlug}
      />
    </div>
  )
}
