import React from 'react'
import { ShieldCheck, GitPullRequest, XCircle, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react'
import type { TaskDeliverable } from '../../../shared/types/workspace'

interface HumanApprovalGateProps {
  deliverable?: TaskDeliverable
  status: string
  onApprove: () => void
  onReject: () => void
}

export const HumanApprovalGate: React.FC<HumanApprovalGateProps> = ({
  deliverable,
  status,
  onApprove,
  onReject,
}) => {
  if (!deliverable) {
    return (
      <div className="p-5 bg-surface-card border border-hairline rounded-xl text-center space-y-2">
        <AlertTriangle size={24} className="text-timeline-thinking mx-auto" />
        <div className="text-xs font-semibold text-ink">Action Plan In Progress</div>
        <p className="text-[11px] text-muted max-w-sm mx-auto">
          The agent is currently executing AST validation and grounding checks. The approval gate will unlock once the deliverable is assembled.
        </p>
      </div>
    )
  }

  const isApproved = status === 'completed'
  const isRejected = status === 'failed'

  return (
    <div className="bg-surface-card border border-hairline rounded-xl p-5 space-y-5 shadow-xs">
      {/* Top Banner Status */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck
              size={18}
              className={
                isApproved
                  ? 'text-semantic-success'
                  : isRejected
                  ? 'text-semantic-error'
                  : 'text-primary'
              }
            />
            <span className="text-xs font-mono font-bold uppercase tracking-caption text-ink">
              Human-in-the-Loop Sign-Off Gate
            </span>
          </div>
          <h2 className="text-sm sm:text-base font-semibold text-ink">
            {deliverable.title}
          </h2>
        </div>

        <span
          className={`px-2.5 py-1 rounded text-xs font-mono font-semibold shrink-0 ${
            isApproved
              ? 'bg-semantic-success/15 text-semantic-success'
              : isRejected
              ? 'bg-semantic-error/15 text-semantic-error'
              : 'bg-primary/10 text-primary animate-pulse'
          }`}
        >
          {isApproved ? '✓ Dispatched & Merged' : isRejected ? '✕ Rejected' : '● Awaiting Review'}
        </span>
      </div>

      {/* Summary Box */}
      <div className="p-3.5 bg-canvas-soft rounded-lg border border-hairline text-xs space-y-1.5">
        <div className="flex items-center justify-between text-muted text-[11px]">
          <span className="font-semibold text-ink">Executive Summary:</span>
          <span>Impact: <strong className="text-primary">{deliverable.impactLevel}</strong></span>
        </div>
        <p className="text-body leading-relaxed">{deliverable.summary}</p>
        <div className="text-[11px] text-muted pt-1">
          <strong>Affected Systems:</strong> {deliverable.impactArea}
        </div>
      </div>

      {/* Verification Checkpoints */}
      <div className="space-y-2">
        <div className="text-xs font-mono uppercase tracking-caption text-muted">
          Pre-flight AST & Safety Checkpoints:
        </div>
        <div className="space-y-1.5">
          {deliverable.checkpoints.map((cp) => (
            <div
              key={cp.id}
              className="flex items-start gap-2.5 p-2.5 rounded-lg bg-canvas border border-hairline text-xs"
            >
              <CheckCircle2
                size={16}
                className={cp.done ? 'text-semantic-success shrink-0 mt-0.5' : 'text-muted shrink-0 mt-0.5'}
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-ink">{cp.text}</div>
                {cp.details && (
                  <div className="text-[11px] text-muted mt-0.5">{cp.details}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-hairline flex flex-wrap items-center justify-between gap-3">
        {deliverable.pullRequestUrl && (
          <a
            href={deliverable.pullRequestUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-ink font-medium transition-colors"
          >
            <span>Inspect Branch / Pull Request</span>
            <ExternalLink size={13} />
          </a>
        )}

        <div className="flex items-center gap-2.5 ml-auto">
          {isApproved ? (
            <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-semantic-success">
              <span>✓ Signed off by Human Reviewer</span>
            </div>
          ) : isRejected ? (
            <button
              onClick={onApprove}
              className="px-3 py-1.5 rounded-md bg-canvas-soft border border-hairline hover:border-hairline-strong text-ink text-xs font-medium cursor-pointer"
            >
              Retry / Re-approve
            </button>
          ) : (
            <>
              <button
                onClick={onReject}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-canvas-soft hover:bg-canvas border border-hairline text-semantic-error hover:border-semantic-error/40 text-xs font-medium transition-colors cursor-pointer"
              >
                <XCircle size={14} />
                <span>Reject & Rollback</span>
              </button>

              <button
                onClick={onApprove}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary hover:bg-primary-active text-on-primary text-xs font-semibold transition-colors shadow-xs cursor-pointer"
              >
                <GitPullRequest size={15} />
                <span>Approve & Dispatch PR</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
