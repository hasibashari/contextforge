import { useState, useCallback } from 'react'
import type { CalendarEvent, UserMemoryItem } from '@/shared/types/workspace'
import { INITIAL_CALENDAR_EVENTS, INITIAL_USER_MEMORIES } from '../mockData'

export function useCalendarMemory(showToast: (msg: string) => void) {
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(INITIAL_CALENDAR_EVENTS)
  const [userMemories, setUserMemories] = useState<UserMemoryItem[]>(INITIAL_USER_MEMORIES)

  const addCalendarEvent = useCallback(
    (eventData: Omit<CalendarEvent, 'id'>) => {
      const newEvent: CalendarEvent = {
        ...eventData,
        id: `cal-${Date.now()}`,
      }
      setCalendarEvents((prev) => [newEvent, ...prev])
      showToast(`📅 Event added to Calendar: ${newEvent.title}`)
      return newEvent
    },
    [showToast]
  )

  const updateCalendarEventStatus = useCallback(
    (id: string, status: CalendarEvent['status']) => {
      setCalendarEvents((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status } : e))
      )
      showToast('📅 Schedule status updated')
    },
    [showToast]
  )

  const addUserMemory = useCallback(
    (memoryData: Omit<UserMemoryItem, 'id' | 'lastUpdated'>) => {
      const newMem: UserMemoryItem = {
        ...memoryData,
        id: `mem-${Date.now()}`,
        lastUpdated: 'Just now',
      }
      setUserMemories((prev) => [newMem, ...prev])
      showToast(`🧠 Saved to Personal Memory: ${newMem.key}`)
    },
    [showToast]
  )

  const deleteUserMemory = useCallback(
    (id: string) => {
      setUserMemories((prev) => prev.filter((m) => m.id !== id))
      showToast('🧠 Memory item removed')
    },
    [showToast]
  )

  return {
    calendarEvents,
    setCalendarEvents,
    userMemories,
    setUserMemories,
    addCalendarEvent,
    updateCalendarEventStatus,
    addUserMemory,
    deleteUserMemory,
  }
}
