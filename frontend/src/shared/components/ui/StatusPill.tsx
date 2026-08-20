import React from 'react'

export interface StatusPillProps {
  status: string
  label?: string
  showDot?: boolean
  className?: string
}

export const StatusPill: React.FC<StatusPillProps> = ({
  status,
  label,
  showDot = true,
  className = '',
}) => {
  const norm = status.toLowerCase()

  const isSuccess =
    norm === 'connected' ||
    norm === 'synced' ||
    norm === 'enabled' ||
    norm === 'installed' ||
    norm === 'ready'

  const isWarning =
    norm === 'syncing' || norm === 'connecting' || norm === 'executing'

  const isError = norm === 'error' || norm === 'failed'

  const dotColor = isSuccess
    ? 'bg-semantic-success'
    : isWarning
    ? 'bg-[#f59e0b]'
    : isError
    ? 'bg-semantic-error'
    : 'bg-muted'

  const textColor = isSuccess
    ? 'text-semantic-success font-semibold'
    : isWarning
    ? 'text-[#f59e0b] font-semibold'
    : isError
    ? 'text-semantic-error font-semibold'
    : 'text-muted'

  const displayLabel =
    label ||
    (norm === 'connected'
      ? 'Connected'
      : norm === 'disconnected'
      ? 'Disconnected'
      : norm === 'synced'
      ? 'Synced'
      : norm === 'syncing'
      ? 'Syncing...'
      : norm === 'enabled'
      ? 'Active Playbook'
      : norm === 'disabled'
      ? 'Disabled'
      : norm === 'installed'
      ? 'Installed'
      : norm === 'available'
      ? 'Available'
      : status)

  return (
    <span className={`inline-flex items-center gap-1 font-mono text-[11px] ${textColor} ${className}`}>
      {showDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${dotColor} ${
            isWarning ? 'animate-pulse' : ''
          }`}
        />
      )}
      <span>{displayLabel}</span>
    </span>
  )
}
