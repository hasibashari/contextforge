import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  Check,
  Copy,
  BookOpen,
  Info,
  Lightbulb,
  AlertTriangle,
  AlertCircle,
  Globe,
  ExternalLink,
  Calendar,
} from 'lucide-react'

interface MarkdownRendererProps {
  content: string
  className?: string
  onWikilinkClick?: (noteName: string) => void
}

// Pre-process markdown: Convert Obsidian wikilinks and remove raw footnote notations ([^1], [^2], [^1]: ...)
function preprocessMarkdown(text: string): string {
  if (!text) return ''

  // 1. Convert Obsidian wikilinks: [[Note Title]] or [[Note Title|Custom Alias]]
  let processed = text.replace(/\[\[(.*?)\]\]/g, (_, match: string) => {
    const parts = match.split('|')
    const noteName = parts[0].trim()
    const alias = parts[1]?.trim() || noteName
    return `[📚 ${alias}](#obsidian-note:${encodeURIComponent(noteName)})`
  })

  // 2. Strip footnote definition lines at bottom (e.g. "[^1]: http..." or "[^1]: Note")
  processed = processed.replace(/^\[\^[\w-]+\]:.*$/gm, '')

  // 3. Strip inline footnote reference markers (e.g. "[^1]", "[^note]")
  processed = processed.replace(/\[\^[\w-]+\]/g, '')

  // 4. Strip accidental bottom reference header, hr dividers, and trailing link lists (e.g. "References\n* [Link]...")
  processed = processed.replace(
    /(?:\n|^)(?:---\s*\n+)?#*\s*(?:References|Referensi|Sumber Informasi|Sources|Daftar Pustaka)[\s\S]*$/i,
    '',
  )

  // 5. Clean up spaces before punctuation marks (e.g. "kalimat ." -> "kalimat.", "kata , " -> "kata, ")
  processed = processed.replace(/[ \t]+([.,;:!?])/g, '$1')

  // 6. Clean up duplicate spaces
  processed = processed.replace(/[ \t]{2,}/g, ' ')

  return processed.trim()
}

/**
 * Clean Document Link for Notion Workspace Pages & Databases
 */
const NotionDocumentLink: React.FC<{ href: string; label: string }> = ({
  href,
  label,
}) => {
  const displayTitle = label.trim() || 'Notion Page'
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={`Open Notion Page: ${displayTitle}`}
      className="inline-flex items-center gap-1.5 font-medium text-ink hover:text-primary transition-colors cursor-pointer no-underline group my-0.5 align-baseline"
    >
      <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-canvas-soft border border-hairline shrink-0 text-[10px] font-bold text-ink group-hover:border-primary/40 group-hover:text-primary transition-colors select-none">
        N
      </span>
      <span className="underline decoration-hairline-strong underline-offset-3 group-hover:decoration-primary group-hover:text-primary transition-colors wrap-break-word">
        {displayTitle}
      </span>
      <ExternalLink
        size={10}
        className="text-muted group-hover:text-primary opacity-60 group-hover:opacity-100 shrink-0 transition-opacity"
      />
    </a>
  )
}

/**
 * Clean Event Link for Google Calendar
 */
const GoogleCalendarLink: React.FC<{ href: string; label: string }> = ({
  href,
  label,
}) => {
  const displayTitle = label.trim() || 'Google Calendar Event'
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={`Open Google Calendar: ${displayTitle}`}
      className="inline-flex items-center gap-1.5 font-medium text-ink hover:text-primary transition-colors cursor-pointer no-underline group my-0.5 align-baseline"
    >
      <Calendar
        size={13}
        className="text-[#4285f4] shrink-0 group-hover:text-primary transition-colors"
      />
      <span className="underline decoration-hairline-strong underline-offset-3 group-hover:decoration-primary group-hover:text-primary transition-colors wrap-break-word">
        {displayTitle}
      </span>
      <ExternalLink
        size={10}
        className="text-muted group-hover:text-primary opacity-60 group-hover:opacity-100 shrink-0 transition-opacity"
      />
    </a>
  )
}

/**
 * Standard Web Link for Documentation, Articles, and Outgoing Links
 */
const StandardWebLink: React.FC<{ href: string; label: string }> = ({
  href,
  label,
}) => {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={href}
      className="text-primary font-medium hover:underline underline-offset-2 inline-flex items-center gap-1 wrap-break-word transition-colors cursor-pointer"
    >
      <span>{label}</span>
      <ExternalLink size={10} className="text-muted opacity-60 shrink-0" />
    </a>
  )
}

/**
 * Checks if a link is an inline web search citation pill
 */
function isWebCitationPill(href: string, label: string): boolean {
  const clean = label.trim()
  if (!clean) return true
  // Domain pattern: e.g. "kompas.com", "reuters.com", "detik.com"
  if (/^[a-z0-9-]+\.[a-z]{2,}(?:\.[a-z]{2,})?$/i.test(clean)) return true
  // Bracketed number or plain number: e.g. "[1]", "1"
  if (/^\[?\d+\]?$/.test(clean)) return true
  // Explicit parenthesized domain: e.g. "CNN (cnn.com)"
  if (/\([a-z0-9-]+\.[a-z]{2,}\)$/i.test(clean)) return true
  // Single publisher word matching hostname: e.g. "Reuters", "Wikipedia", "Antara"
  try {
    const urlObj = new URL(href)
    const hostname = urlObj.hostname.replace(/^www\./, '')
    const brand = hostname.split('.')[0]?.toLowerCase()
    if (
      brand &&
      clean.length <= 25 &&
      !clean.includes(' ') &&
      (clean.toLowerCase() === brand || hostname.includes(clean.toLowerCase()))
    ) {
      return true
    }
  } catch {
    // ignore
  }
  return false
}

/**
 * Perplexity-style Inline Source Pill Component for Web Search Citations
 */
const InlineSourcePill: React.FC<{ href: string; label: string }> = ({
  href,
  label,
}) => {
  const [faviconFailed, setFaviconFailed] = useState(false)

  let hostname: string
  let displayLabel = label.trim()

  try {
    const urlObj = new URL(href)
    let parsedHost = urlObj.hostname.replace(/^www\./, '')

    // Extract publisher from compound titles like "Mongabay.co.id - Title" or "Title - Kompas.id"
    if (displayLabel.includes(' - ')) {
      const parts = displayLabel.split(' - ')
      if (parts[0].includes('.') || parts[0].length < 20) {
        displayLabel = parts[0].trim()
      } else {
        displayLabel = parts[parts.length - 1].trim()
      }
    }

    // If URL is a Google News redirect, resolve publisher domain from label if present
    if (parsedHost.includes('google.com') && displayLabel.includes('.')) {
      const domainMatch = displayLabel.match(
        /([a-z0-9-]+\.[a-z]{2,}(?:\.[a-z]{2})?)/i,
      )
      if (domainMatch) {
        parsedHost = domainMatch[1].toLowerCase()
      }
    }

    // If the label is just a URL or number or empty, replace with clean domain brand
    if (
      !displayLabel ||
      /^\d+$/.test(displayLabel) ||
      /^https?:\/\//i.test(displayLabel)
    ) {
      displayLabel = parsedHost.split('.')[0]
      displayLabel =
        displayLabel.charAt(0).toUpperCase() + displayLabel.slice(1)
    }

    hostname = parsedHost
  } catch {
    hostname = href
  }

  const faviconUrl = hostname
    ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=32`
    : ''

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={`Open source: ${displayLabel} (${href})`}
      className="inline-flex items-center gap-1.5 px-2 py-0.5 mx-0.5 my-0.5 rounded-full bg-canvas-soft hover:bg-canvas border border-hairline hover:border-hairline-strong text-[11px] font-medium text-ink transition-all shadow-2xs hover:shadow-xs cursor-pointer align-middle no-underline select-none group"
    >
      {!faviconFailed && faviconUrl ? (
        <img
          src={faviconUrl}
          alt=""
          className="w-3.5 h-3.5 rounded-full object-contain shrink-0"
          onError={() => setFaviconFailed(true)}
          loading="lazy"
        />
      ) : (
        <Globe size={11} className="text-[#3b82f6] shrink-0" />
      )}
      <span className="max-w-40 sm:max-w-56 truncate text-[11px] font-semibold text-ink group-hover:text-primary transition-colors">
        {displayLabel}
      </span>
      <ExternalLink
        size={9}
        className="text-muted group-hover:text-primary opacity-50 group-hover:opacity-100 shrink-0 transition-opacity"
      />
    </a>
  )
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = '',
  onWikilinkClick,
}) => {
  const processedContent = preprocessMarkdown(content)

  return (
    <div
      className={`markdown-body space-y-2 text-ink text-xs sm:text-sm leading-relaxed ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-base sm:text-lg font-bold text-ink pt-3 pb-1 border-b border-hairline tracking-tight">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm sm:text-base font-bold text-ink pt-2.5 pb-0.5 tracking-tight flex items-center gap-1.5">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xs sm:text-sm font-semibold text-ink pt-2 pb-0.5 tracking-tight">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="text-body leading-relaxed mb-2 last:mb-0">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-5 space-y-1 my-2 text-body">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 space-y-1.5 my-2 text-body">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed text-body pl-0.5 [&>p]:inline [&>p]:mb-0">
              {children}
            </li>
          ),
          blockquote: ({ children }) => {
            // Check for Callout syntax in text
            const raw = React.Children.toArray(children)
              .map((c) => (typeof c === 'string' ? c : ''))
              .join(' ')

            if (raw.includes('[!NOTE]') || raw.includes('[!INFO]')) {
              return (
                <div className="border-l-3 border-primary bg-primary/5 px-3 py-2.5 rounded-r-xl my-2.5 text-xs text-ink space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-primary font-mono text-[11px] uppercase">
                    <Info size={13} />
                    <span>Note</span>
                  </div>
                  <div className="text-body leading-relaxed">{children}</div>
                </div>
              )
            }
            if (raw.includes('[!TIP]')) {
              return (
                <div className="border-l-3 border-emerald-500 bg-emerald-500/5 px-3 py-2.5 rounded-r-xl my-2.5 text-xs text-ink space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400 font-mono text-[11px] uppercase">
                    <Lightbulb size={13} />
                    <span>Tip</span>
                  </div>
                  <div className="text-body leading-relaxed">{children}</div>
                </div>
              )
            }
            if (raw.includes('[!WARNING]') || raw.includes('[!CAUTION]')) {
              return (
                <div className="border-l-3 border-amber-500 bg-amber-500/5 px-3 py-2.5 rounded-r-xl my-2.5 text-xs text-ink space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400 font-mono text-[11px] uppercase">
                    <AlertTriangle size={13} />
                    <span>Warning</span>
                  </div>
                  <div className="text-body leading-relaxed">{children}</div>
                </div>
              )
            }
            if (raw.includes('[!IMPORTANT]')) {
              return (
                <div className="border-l-3 border-purple-500 bg-purple-500/5 px-3 py-2.5 rounded-r-xl my-2.5 text-xs text-ink space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-purple-600 dark:text-purple-400 font-mono text-[11px] uppercase">
                    <AlertCircle size={13} />
                    <span>Important</span>
                  </div>
                  <div className="text-body leading-relaxed">{children}</div>
                </div>
              )
            }

            return (
              <blockquote className="border-l-3 border-primary/60 bg-canvas-soft/80 px-3 py-2 rounded-r-lg my-2 text-muted italic font-sans text-xs">
                {children}
              </blockquote>
            )
          },
          table: ({ children }) => (
            <div className="overflow-x-auto my-3 rounded-lg border border-hairline shadow-2xs">
              <table className="w-full text-left text-xs font-sans border-collapse">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-canvas-soft border-b border-hairline text-ink font-semibold text-[11px] uppercase font-mono">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-hairline">{children}</tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-canvas-soft/50 transition-colors">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 font-semibold">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 text-body">{children}</td>
          ),
          hr: () => <hr className="my-3 border-hairline" />,
          section: ({ className: sectionClass, children, ...props }) => {
            // Completely suppress GFM footnotes section
            if (sectionClass?.includes('footnotes')) {
              return null
            }
            return (
              <section className={sectionClass} {...props}>
                {children}
              </section>
            )
          },
          sup: () => {
            // Suppress footnote superscripts
            return null
          },
          a: ({ href, children, ...props }) => {
            const hrefStr = href || ''

            // 1. Obsidian Wikilink
            if (hrefStr.startsWith('#obsidian-note:')) {
              const noteName = decodeURIComponent(
                hrefStr.replace('#obsidian-note:', ''),
              )
              return (
                <span
                  onClick={(e) => {
                    e.preventDefault()
                    if (onWikilinkClick) {
                      onWikilinkClick(noteName)
                    }
                  }}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#7c3aed]/10 text-[#7c3aed] border border-[#7c3aed]/25 font-mono text-[11px] font-semibold hover:bg-[#7c3aed]/25 hover:border-[#7c3aed]/50 transition-colors cursor-pointer select-none"
                >
                  <BookOpen size={11} className="shrink-0" />
                  <span>{String(children).replace(/^📚\s*/, '')}</span>
                </span>
              )
            }

            // 2. Hide Footnote internal jump links and [↩] backreferences
            if (
              hrefStr.startsWith('#fn') ||
              hrefStr.startsWith('#user-content-fn') ||
              String(children).includes('↩')
            ) {
              return null
            }

            // 3. In-page anchor link
            if (hrefStr.startsWith('#')) {
              return (
                <a
                  href={hrefStr}
                  className="text-primary font-mono text-[11px] font-bold px-1 py-0.2 rounded hover:bg-primary/10 transition-colors cursor-pointer no-underline inline-block"
                  onClick={(e) => {
                    e.preventDefault()
                    const targetId = hrefStr.replace(/^#/, '')
                    const targetEl =
                      document.getElementById(targetId) ||
                      document.getElementById(decodeURIComponent(targetId)) ||
                      document.querySelector(`[id="${targetId}"]`)
                    if (targetEl) {
                      targetEl.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                      })
                    }
                  }}
                  {...props}
                >
                  {children}
                </a>
              )
            }

            const labelText = typeof children === 'string'
              ? children
              : Array.isArray(children)
                ? children.map(c => typeof c === 'string' ? c : '').join('')
                : String(children || '')

            // 4. Notion Workspace Document Link
            if (hrefStr.includes('notion.so') || hrefStr.includes('notion.site')) {
              return <NotionDocumentLink href={hrefStr} label={labelText} />
            }

            // 5. Google Calendar Link
            if (hrefStr.includes('calendar.google.com')) {
              return <GoogleCalendarLink href={hrefStr} label={labelText} />
            }

            // 6. Web Search Source Citation Pill (short domain citations / [1] pills)
            if (isWebCitationPill(hrefStr, labelText)) {
              return <InlineSourcePill href={hrefStr} label={labelText} />
            }

            // 7. Standard Web Link (Documentation, Articles, Repositories)
            return <StandardWebLink href={hrefStr} label={labelText} />
          },
          code: ({ className: codeClassName, children, ...props }) => {
            const match = /language-(\w+)/.exec(codeClassName || '')
            const isInline = !match && !String(children).includes('\n')

            if (isInline) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded bg-canvas-soft border border-hairline font-mono text-[11px] text-ink font-medium"
                  {...props}
                >
                  {children}
                </code>
              )
            }

            const codeText = String(children).replace(/\n$/, '')
            const language = match ? match[1] : 'text'

            return (
              <CodeBlockWithCopy codeText={codeText} language={language} />
            )
          },
          input: ({ type, checked, ...props }) => {
            if (type === 'checkbox') {
              return (
                <input
                  type="checkbox"
                  checked={checked}
                  readOnly
                  className="mr-2 rounded border-hairline text-primary focus:ring-0 cursor-default align-middle"
                  {...props}
                />
              )
            }
            return <input type={type} {...props} />
          },
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  )
}

function CodeBlockWithCopy({
  codeText,
  language,
}: {
  codeText: string
  language: string
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard?.writeText(codeText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-[#30363d] bg-[#0d1117] text-[#e6edf3] font-mono text-xs shadow-md">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#161b22] border-b border-[#30363d] text-[11px] text-[#8b949e]">
        <span className="font-semibold uppercase tracking-wider text-[#58a6ff]">
          {language}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded hover:bg-[#30363d] text-[#c9d1d9] hover:text-white transition-colors cursor-pointer"
          title="Copy Code"
        >
          {copied ? (
            <>
              <Check size={12} className="text-semantic-success" />
              <span className="text-semantic-success font-semibold text-[10px]">
                Copied!
              </span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span className="text-[10px]">Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Text */}
      <pre className="p-3.5 overflow-x-auto leading-relaxed text-[11.5px] text-[#e6edf3]">
        <code>{codeText}</code>
      </pre>
    </div>
  )
}
