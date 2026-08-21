import React, { useState } from 'react'
import {
  Calendar,
  Plus,
  CheckCircle2,
  Clock,
  User,
} from 'lucide-react'
import { useWorkspace } from '@/shared/mock'
import {
  EmptyState,
  IconBox,
  Button,
  Input,
  Select,
  Badge,
} from '@/shared/components'
import type { CalendarEvent } from '@/shared/types/workspace'

export const AgendaTab: React.FC = () => {
  const {
    calendarEvents,
    addCalendarEvent,
    updateCalendarEventStatus,
  } = useWorkspace()

  const [showAddEventModal, setShowAddEventModal] = useState(false)
  const [newEventTitle, setNewEventTitle] = useState('')
  const [newEventTime, setNewEventTime] = useState('02:00 PM')
  const [newEventCategory, setNewEventCategory] = useState<CalendarEvent['category']>('meeting')

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEventTitle.trim()) return

    addCalendarEvent({
      title: newEventTitle.trim(),
      time: newEventTime,
      date: 'Today',
      duration: '45 mins',
      status: 'upcoming',
      category: newEventCategory,
      location: 'Google Meet / Online',
    })

    setNewEventTitle('')
    setShowAddEventModal(false)
  }

  const getCategoryBadgeVariant = (cat: CalendarEvent['category']) => {
    switch (cat) {
      case 'meeting':
        return 'primary'
      case 'review':
        return 'blue'
      case 'task':
        return 'success'
      default:
        return 'neutral'
    }
  }

  return (
    <div className="space-y-3">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-mono uppercase tracking-caption text-muted flex items-center gap-1.5">
          <Calendar size={12} className="text-semantic-success" />
          <span>Today's Synced Agenda ({calendarEvents.length})</span>
        </div>

        <Button
          variant="secondary"
          size="xs"
          leftIcon={<Plus size={11} />}
          onClick={() => setShowAddEventModal(!showAddEventModal)}
        >
          Add Event
        </Button>
      </div>

      {/* Inline Add Event Form */}
      {showAddEventModal && (
        <form
          onSubmit={handleCreateEvent}
          className="p-3 bg-surface-card border border-primary/40 rounded-xl space-y-2.5 shadow-xs"
        >
          <div className="font-semibold text-ink text-xs">New Calendar Event</div>
          <Input
            placeholder="Event title (e.g. PR Review with Lead)"
            value={newEventTitle}
            onChange={(e) => setNewEventTitle(e.target.value)}
            required
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              variant="mono"
              placeholder="Time (e.g. 03:30 PM)"
              value={newEventTime}
              onChange={(e) => setNewEventTime(e.target.value)}
            />
            <Select
              value={newEventCategory}
              onChange={(e) => setNewEventCategory(e.target.value as CalendarEvent['category'])}
              options={[
                { label: 'Meeting', value: 'meeting' },
                { label: 'Review', value: 'review' },
                { label: 'Task', value: 'task' },
                { label: 'Personal', value: 'personal' },
              ]}
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => setShowAddEventModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="xs">
              Save Event
            </Button>
          </div>
        </form>
      )}

      {/* Events Timeline List */}
      <div className="space-y-2">
        {calendarEvents.length === 0 ? (
          <EmptyState
            compact
            icon={
              <IconBox
                size="md"
                variant="primary"
                icon={<Calendar size={18} />}
              />
            }
            title="No Events Scheduled"
            description="Schedule meetings, reviews, or tasks for your agentic workflow by clicking '+ New Event'."
          />
        ) : (
          calendarEvents.map((evt) => {
            const isDone = evt.status === 'completed'

            return (
              <div
                key={evt.id}
                className={`p-3 rounded-xl border transition-all shadow-2xs space-y-2 ${
                  isDone
                    ? 'bg-canvas-soft/60 border-hairline opacity-60'
                    : 'bg-surface-card border-hairline hover:border-hairline-strong'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      type="button"
                      onClick={() =>
                        updateCalendarEventStatus(
                          evt.id,
                          isDone ? 'upcoming' : 'completed'
                        )
                      }
                      className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                        isDone
                          ? 'bg-semantic-success border-semantic-success text-white'
                          : 'border-hairline hover:border-primary text-transparent'
                      }`}
                      title={isDone ? 'Mark as Upcoming' : 'Mark as Completed'}
                    >
                      <CheckCircle2 size={12} />
                    </button>

                    <h4
                      className={`font-semibold text-xs text-ink leading-snug truncate ${
                        isDone ? 'line-through text-muted' : ''
                      }`}
                    >
                      {evt.title}
                    </h4>
                  </div>

                  <Badge
                    variant={getCategoryBadgeVariant(evt.category)}
                    size="xs"
                  >
                    {evt.category}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-muted pl-6">
                  <div className="flex items-center gap-1.5">
                    <Clock size={11} className="text-muted shrink-0" />
                    <span>{evt.time}</span>
                    <span>•</span>
                    <span>{evt.duration}</span>
                  </div>
                  {evt.location && (
                    <span className="truncate max-w-30">{evt.location}</span>
                  )}
                </div>

                {evt.attendees && evt.attendees.length > 0 && (
                  <div className="flex items-center gap-1.5 pl-6 text-[10px] font-mono text-muted">
                    <User size={10} />
                    <span className="truncate">{evt.attendees.join(', ')}</span>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
