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
    <div className="space-y-1.5 pt-2 border-t border-hairline/60">
      <div className="text-[11px] font-mono font-semibold uppercase tracking-caption text-muted flex items-center justify-between">
        <span className="flex items-center gap-1">
          <Sparkles size={11} className="text-primary" />
          <span>Exposed Server Tools</span>
        </span>
        <Badge variant="neutral" size="xs">
          {tools.length} Tools
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
        {tools.map((tool) => (
          <div
            key={tool.name}
            className="p-2 rounded-lg bg-canvas border border-hairline flex flex-col justify-between"
          >
            <div className="font-semibold text-ink text-[11px] flex items-center gap-1">
              <Terminal size={10} className="text-primary shrink-0" />
              <span className="truncate">{tool.name}</span>
            </div>
            <div className="text-[10px] text-muted truncate font-sans mt-0.5">
              {tool.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
