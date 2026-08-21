import React from 'react'
import { FileText, ExternalLink } from 'lucide-react'
import type { Artifact } from '@/shared/types/workspace'

interface CompactArtifactPillProps {
  artifact: Artifact
  onOpen: () => void
}

export const CompactArtifactPill: React.FC<CompactArtifactPillProps> = ({
  artifact,
  onOpen,
}) => {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-card hover:bg-canvas-soft border border-hairline hover:border-primary/40 text-xs font-mono text-ink transition-colors cursor-pointer group shadow-2xs"
    >
      <FileText size={13} className="text-primary shrink-0" />
      <span className="font-semibold truncate max-w-xs">{artifact.title}</span>
      <span className="text-muted">·</span>
      <span className="text-[11px] text-primary flex items-center gap-0.5 group-hover:underline">
        <span>Open Aside</span>
        <ExternalLink size={11} />
      </span>
    </button>
  )
}
