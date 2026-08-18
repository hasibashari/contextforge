import React, { useRef, useEffect } from 'react'
import { Terminal, Copy, Check } from 'lucide-react'
import { useState } from 'react'

interface TerminalLogViewerProps {
  logs: string[]
  agentName?: string
  isRunning?: boolean
}

export const TerminalLogViewer: React.FC<TerminalLogViewerProps> = ({
  logs,
  agentName = 'ContextForgeAgent',
  isRunning = false,
}) => {
  const terminalEndRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const copyLogs = () => {
    navigator.clipboard.writeText(logs.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatLogLine = (line: string) => {
    if (line.includes('[Agent:')) {
      return <span className="text-primary font-semibold">{line}</span>
    }
    if (line.includes('[Planning]')) {
      return <span className="text-timeline-thinking">{line}</span>
    }
    if (line.includes('[Context]') || line.includes('[MCP]')) {
      return <span className="text-timeline-grep">{line}</span>
    }
    if (line.includes('[Sandbox]') || line.includes('[AST]')) {
      return <span className="text-timeline-read">{line}</span>
    }
    if (line.includes('✓') || line.includes('Passed') || line.includes('100%')) {
      return <span className="text-semantic-success font-medium">{line}</span>
    }
    if (line.includes('failed') || line.includes('CVE') || line.includes('Error')) {
      return <span className="text-semantic-error font-medium">{line}</span>
    }
    return <span className="text-hairline-soft">{line}</span>
  }

  return (
    <div className="bg-ink text-canvas rounded-xl border border-hairline overflow-hidden shadow-md flex flex-col">
      {/* Terminal Title Bar */}
      <div className="px-4 py-2.5 bg-black/50 border-b border-hairline-strong/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ef6a5b]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#f4be4f]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#61c554]" />
          </div>
          <div className="flex items-center gap-1.5 ml-2 font-mono text-xs text-muted-soft">
            <Terminal size={13} className="text-primary" />
            <span>runtime: {agentName}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isRunning && (
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-semantic-success">
              <span className="w-2 h-2 rounded-full bg-semantic-success animate-pulse" />
              <span>STREAMING</span>
            </div>
          )}
          <button
            onClick={copyLogs}
            className="text-muted-soft hover:text-canvas text-xs font-mono inline-flex items-center gap-1 transition-colors cursor-pointer"
          >
            {copied ? <Check size={12} className="text-semantic-success" /> : <Copy size={12} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Terminal Content */}
      <div className="p-4 font-mono text-xs space-y-1.5 max-h-72 overflow-y-auto min-h-48">
        {logs.length === 0 ? (
          <div className="text-muted-soft italic text-[11px]">
            &gt; Waiting for agent execution stream...
          </div>
        ) : (
          logs.map((log, idx) => (
            <div key={idx} className="leading-relaxed wrap-break-word">
              {formatLogLine(log)}
            </div>
          ))
        )}
        {isRunning && (
          <div className="inline-block w-2 h-3.5 bg-primary animate-pulse ml-1" />
        )}
        <div ref={terminalEndRef} />
      </div>
    </div>
  )
}
