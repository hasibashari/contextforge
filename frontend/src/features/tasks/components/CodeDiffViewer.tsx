import React, { useState } from 'react'
import { FileCode, Plus, Minus, ChevronDown, ChevronUp } from 'lucide-react'
import type { CodeDiffFile } from '../../../shared/types/workspace'

interface CodeDiffViewerProps {
  diffs: CodeDiffFile[]
  branchName?: string
}

export const CodeDiffViewer: React.FC<CodeDiffViewerProps> = ({ diffs, branchName }) => {
  const [expandedIndex, setExpandedIndex] = useState<number>(0)

  if (!diffs || diffs.length === 0) {
    return (
      <div className="p-5 text-center text-xs text-muted bg-canvas-soft border border-hairline rounded-lg">
        No code changes generated yet.
      </div>
    )
  }

  const totalAdditions = diffs.reduce((acc, d) => acc + d.additions, 0)
  const totalDeletions = diffs.reduce((acc, d) => acc + d.deletions, 0)

  return (
    <div className="space-y-3">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs">
          <FileCode size={15} className="text-primary" />
          <span className="font-semibold text-ink">Proposed Code Diffs</span>
          {branchName && (
            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-surface-strong text-body">
              {branchName}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="inline-flex items-center gap-0.5 text-semantic-success font-semibold">
            <Plus size={12} />
            {totalAdditions}
          </span>
          <span className="inline-flex items-center gap-0.5 text-semantic-error font-semibold">
            <Minus size={12} />
            {totalDeletions}
          </span>
        </div>
      </div>

      {/* File Diff Accordions */}
      <div className="space-y-2.5">
        {diffs.map((diff, index) => {
          const isExpanded = expandedIndex === index

          return (
            <div
              key={index}
              className="bg-surface-card border border-hairline rounded-lg overflow-hidden shadow-2xs"
            >
              {/* File Title Bar */}
              <button
                onClick={() => setExpandedIndex(isExpanded ? -1 : index)}
                className="w-full px-3.5 py-2.5 bg-canvas-soft flex items-center justify-between text-left hover:bg-canvas transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 truncate font-mono text-xs text-ink font-medium">
                  <span>{diff.file}</span>
                </div>

                <div className="flex items-center gap-3 shrink-0 text-xs font-mono">
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="text-semantic-success">+{diff.additions}</span>
                    <span className="text-semantic-error">-{diff.deletions}</span>
                  </div>
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              </button>

              {/* Code Blocks */}
              {isExpanded && (
                <div className="p-3 bg-[#1e1e1e] text-canvas font-mono text-xs space-y-3 overflow-x-auto border-t border-hairline-strong">
                  {diff.oldCode && (
                    <div>
                      <div className="text-[10px] text-semantic-error font-semibold mb-1 flex items-center gap-1">
                        <Minus size={11} /> Previous Implementation:
                      </div>
                      <pre className="p-2.5 rounded bg-semantic-error/10 text-[#fca5a5] text-[11px] leading-relaxed overflow-x-auto">
                        {diff.oldCode}
                      </pre>
                    </div>
                  )}

                  {diff.newCode && (
                    <div>
                      <div className="text-[10px] text-semantic-success font-semibold mb-1 flex items-center gap-1">
                        <Plus size={11} /> Agent Proposed Patch:
                      </div>
                      <pre className="p-2.5 rounded bg-semantic-success/10 text-[#86efac] text-[11px] leading-relaxed overflow-x-auto">
                        {diff.newCode}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
