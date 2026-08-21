import { useState, useMemo } from 'react'
import { Download } from 'lucide-react'
import { useWorkspace } from '@/shared/mock'
import { PageHeader, Button, SegmentedTabs } from '@/shared/components'
import { ActivityList } from '@/features/activity/components/ActivityList'

const FILTER_TABS = [
  { id: 'all', label: 'All Events' },
  { id: 'task_dispatched', label: 'Task Dispatched' },
  { id: 'tool_invoked', label: 'Tool Invoked' },
  { id: 'ast_verified', label: 'AST Verified' },
  { id: 'human_approved', label: 'Human Approved' },
  { id: 'pr_created', label: 'PR Created' },
]

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
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
      {/* Top Banner Header */}
      <PageHeader
        eyebrow="Immutable Audit Trail & Observability"
        title="Activity & Execution Logs"
        description="Review detailed telemetry, tool invocation timestamps, human approval decisions, and token consumption history."
        actions={
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Download size={14} />}
            onClick={handleExport}
          >
            Export Audit Log
          </Button>
        }
      />

      {/* Action Filter Segmented Tabs */}
      <div className="p-2 sm:p-3 bg-canvas-soft border border-hairline rounded-xl sm:rounded-2xl shadow-2xs">
        <SegmentedTabs
          value={filterType}
          onChange={setFilterType}
          tabs={FILTER_TABS}
        />
      </div>

      {/* Activity Timeline List */}
      <ActivityList activities={filteredActivities} />
    </div>
  )
}
