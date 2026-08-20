import React from 'react'
import { Activity } from 'lucide-react'
import type { ActivityLogEntry } from '@/shared/types/workspace'
import { ActivityItemRow } from '@/features/activity/components/ActivityItemRow'
import { EmptyState, IconBox } from '@/shared/components'

interface ActivityListProps {
  activities: ActivityLogEntry[]
}

export const ActivityList: React.FC<ActivityListProps> = ({ activities }) => {
  if (activities.length === 0) {
    return (
      <EmptyState
        compact
        icon={
          <IconBox
            size="md"
            variant="neutral"
            icon={<Activity size={18} className="text-muted" />}
          />
        }
        title="No Activity Records Yet"
        description="Agent executions, document syncs, and tool invocations will appear here in real-time."
      />
    )
  }

  return (
    <div className="bg-surface-card border border-hairline rounded-xl sm:rounded-2xl overflow-hidden shadow-xs">
      <div className="divide-y divide-hairline">
        {activities.map((act) => (
          <ActivityItemRow key={act.id} activity={act} />
        ))}
      </div>
    </div>
  )
}
