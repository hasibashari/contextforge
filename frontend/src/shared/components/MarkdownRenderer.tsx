import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Check, Copy } from 'lucide-react'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = '',
}) => {
  return (
    <div className={`markdown-body space-y-2 text-ink text-xs sm:text-sm leading-relaxed ${className}`}>
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
            <ul className="list-disc list-inside space-y-1 pl-1 mb-2 text-body">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-1 pl-1 mb-2 text-body">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed text-body">
              {children}
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-3 border-primary/60 bg-canvas-soft/80 px-3 py-2 rounded-r-lg my-2 text-muted italic font-sans text-xs">
              {children}
            </blockquote>
          ),
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
            <tbody className="divide-y divide-hairline">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-canvas-soft/50 transition-colors">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 text-body">
              {children}
            </td>
          ),
          hr: () => (
            <hr className="my-3 border-hairline" />
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="text-primary underline underline-offset-2 hover:text-primary-active transition-colors font-medium"
            >
              {children}
            </a>
          ),
          code: ({ className: codeClassName, children, ...props }) => {
            const match = /language-(\w+)/.exec(codeClassName || '')
            const isInline = !match && !String(children).includes('\n')

            if (isInline) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded bg-canvas-soft border border-hairline font-mono text-[11px] text-primary font-medium"
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
        {content}
      </ReactMarkdown>
    </div>
  )
}

function CodeBlockWithCopy({ codeText, language }: { codeText: string; language: string }) {
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
              <span className="text-semantic-success font-semibold text-[10px]">Copied!</span>
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
