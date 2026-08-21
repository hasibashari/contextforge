import React from 'react'
import { cn } from '@/shared/utils/cn'

export interface TabItem {
  id: string
  label: React.ReactNode
  count?: number
  icon?: React.ReactNode
  title?: string
}

export interface SegmentedTabsProps {
  value: string
  onChange: (tabId: string) => void
  tabs: TabItem[]
  className?: string
}

export const SegmentedTabs: React.FC<SegmentedTabsProps> = ({
  value,
  onChange,
  tabs,
  className,
}) => {
  return (
    <div
      style={{
        gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))`,
      }}
      className={cn(
        'grid gap-1 bg-canvas-soft p-1 rounded-xl border border-hairline text-[11px] font-medium w-full overflow-x-auto',
        className,
      )}
    >
      {tabs.map((tab) => {
        const isActive = value === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            title={tab.title}
            className={cn(
              'py-1.5 px-1.5 rounded-lg transition-all text-center truncate cursor-pointer flex items-center justify-center gap-1.5 select-none',
              isActive
                ? 'bg-ink text-canvas shadow-xs font-semibold'
                : 'text-muted hover:text-ink hover:bg-canvas',
            )}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span className="truncate">{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  'text-[10px] font-mono px-1 rounded',
                  isActive ? 'bg-canvas/20 text-canvas' : 'bg-canvas text-muted',
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
