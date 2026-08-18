import { useState, useCallback } from 'react'
import type { CalendarEvent, UserMemoryItem, ToastType } from '@/shared/types/workspace'
import { INITIAL_CALENDAR_EVENTS, INITIAL_USER_MEMORIES } from '../mockData'

export function useCalendarMemory(showToast: (msg: string, type?: ToastType) => void) {
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(INITIAL_CALENDAR_EVENTS)
  const [userMemories, setUserMemories] = useState<UserMemoryItem[]>(INITIAL_USER_MEMORIES)

  const addCalendarEvent = useCallback(
    (eventData: Omit<CalendarEvent, 'id'>) => {
      const newEvent: CalendarEvent = {
        ...eventData,
        id: `cal-${Date.now()}`,
      }
      setCalendarEvents((prev) => [newEvent, ...prev])
      showToast(`Event added to Calendar: ${newEvent.title}`, 'success')
      return newEvent
    },
    [showToast]
  )

  const updateCalendarEventStatus = useCallback(
    (id: string, status: CalendarEvent['status']) => {
      setCalendarEvents((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status } : e))
      )
      showToast('Schedule status updated', 'info')
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
      showToast(`Saved to Personal Memory: ${newMem.key}`, 'success')
    },
    [showToast]
  )

  const deleteUserMemory = useCallback(
    (id: string) => {
      setUserMemories((prev) => prev.filter((m) => m.id !== id))
      showToast('Memory item removed', 'warning')
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
