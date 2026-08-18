import { useState, useMemo } from 'react'
import { useWorkspace } from '../../../shared/mock'
import { ActivityHeader } from '../components/ActivityHeader'
import { ActivityFilterBar } from '../components/ActivityFilterBar'
import { ActivityList } from '../components/ActivityList'

export default function ActivityView() {
  const { activities } = useWorkspace()
  const [filterType, setFilterType] = useState<string>('all')

  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      if (filterType === 'all') return true
      return act.actionType === filterType
    })
  }, [activities, filterType])

  const handleExport = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(activities, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', 'contextforge_activity_audit.json')
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner Header */}
      <ActivityHeader onExport={handleExport} />

      {/* Action Filter Bar */}
      <ActivityFilterBar
        selectedFilter={filterType}
        onSelectFilter={setFilterType}
      />

      {/* Activity Timeline List */}
      <ActivityList activities={filteredActivities} />
    </div>
  )
}
