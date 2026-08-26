import React from 'react'
import { Sparkles, Terminal } from 'lucide-react'
import type { McpTool } from '@/shared/types/workspace'
import { Badge } from '@/shared'

export interface McpToolsPreviewProps {
  tools?: McpTool[]
}

export const McpToolsPreview: React.FC<McpToolsPreviewProps> = ({
  tools = [],
}) => {
  if (!tools || tools.length === 0) return null

  return (
    <div className="space-y-2 pt-2 border-t border-hairline/60">
      <div className="text-[11px] font-mono font-semibold uppercase tracking-caption text-muted flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-ink">
          <Sparkles size={11} className="text-primary" />
          <span>Exposed Server Tools</span>
        </span>
        <Badge variant="neutral" size="xs">
          {tools.length} Tools
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
        {tools.map((tool) => (
          <div
            key={tool.name}
            className="p-2 rounded-lg bg-canvas-soft border border-hairline hover:border-hairline/90 flex flex-col justify-between transition-colors"
          >
            <div className="font-semibold text-ink text-[11px] font-mono flex items-center gap-1.5 min-w-0">
              <Terminal size={11} className="text-primary shrink-0" />
              <span className="truncate">{tool.name}</span>
            </div>
            <div className="text-[10px] text-muted truncate font-sans mt-1">
              {tool.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
