import React from 'react'
import { Activity } from 'lucide-react'
import type { ActivityLogEntry } from '../../../shared/types/workspace'
import { ActivityItemRow } from './ActivityItemRow'

interface ActivityListProps {
  activities: ActivityLogEntry[]
}

export const ActivityList: React.FC<ActivityListProps> = ({ activities }) => {
  if (activities.length === 0) {
    return (
      <div className="p-12 bg-surface-card border border-hairline rounded-xl text-center space-y-2">
        <Activity size={24} className="text-muted mx-auto" />
        <h3 className="text-sm font-semibold text-ink">No activity records found</h3>
        <p className="text-xs text-muted">
          No events match the selected action filter criteria.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-surface-card border border-hairline rounded-xl overflow-hidden shadow-xs">
      <div className="divide-y divide-hairline">
        {activities.map((act) => (
          <ActivityItemRow key={act.id} activity={act} />
        ))}
      </div>
    </div>
  )
}
