import { useState, useCallback, useEffect } from 'react';
import type { CalendarEvent, UserMemoryItem, ToastType } from '@/shared/types/workspace';
import { INITIAL_CALENDAR_EVENTS, INITIAL_USER_MEMORIES } from '../mockData';
import { personalHubApi } from '@/shared/api/personalHubApi';

export function useCalendarMemory(showToast: (msg: string, type?: ToastType) => void) {
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(INITIAL_CALENDAR_EVENTS);
  const [userMemories, setUserMemories] = useState<UserMemoryItem[]>(INITIAL_USER_MEMORIES);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [events, memories] = await Promise.all([
          personalHubApi.getCalendarEvents().catch(() => null),
          personalHubApi.getUserMemories().catch(() => null),
        ]);

        if (!isMounted) return;

        if (events && events.length > 0) {
          setCalendarEvents(events);
        }
        if (memories && memories.length > 0) {
          setUserMemories(memories);
        }
      } catch {
        // keep fallback
      }
    }

    void loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const addCalendarEvent = useCallback(
    async (eventData: Omit<CalendarEvent, 'id'>) => {
      const tempId = `cal-${Date.now()}`;
      const tempEvent: CalendarEvent = {
        ...eventData,
        id: tempId,
      };
      setCalendarEvents((prev) => [tempEvent, ...prev]);

      try {
        const created = await personalHubApi.createCalendarEvent({
          title: eventData.title,
          eventDate: new Date().toISOString().split('T')[0],
          eventTime: eventData.time,
          duration: eventData.duration,
          location: eventData.location,
          category: eventData.category,
          attendees: eventData.attendees,
        });
        setCalendarEvents((prev) => prev.map((e) => (e.id === tempId ? created : e)));
        showToast(`Event added to Calendar: ${created.title}`, 'success');
        return created;
      } catch {
        showToast(`Event added locally: ${tempEvent.title}`, 'success');
        return tempEvent;
      }
    },
    [showToast],
  );

  const updateCalendarEventStatus = useCallback(
    async (id: string, status: CalendarEvent['status']) => {
      setCalendarEvents((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status } : e)),
      );
      try {
        await personalHubApi.updateCalendarStatus(id, status);
        showToast('Schedule status updated in database', 'info');
      } catch {
        showToast('Schedule status updated locally', 'info');
      }
    },
    [showToast],
  );

  const addUserMemory = useCallback(
    async (memoryData: Omit<UserMemoryItem, 'id' | 'lastUpdated'>) => {
      const tempId = `mem-${Date.now()}`;
      const tempMem: UserMemoryItem = {
        ...memoryData,
        id: tempId,
        lastUpdated: 'Just now',
      };
      setUserMemories((prev) => [tempMem, ...prev]);

      try {
        const created = await personalHubApi.createUserMemory({
          category: memoryData.category,
          key: memoryData.key,
          value: memoryData.value,
        });
        setUserMemories((prev) => prev.map((m) => (m.id === tempId ? created : m)));
        showToast(`Saved to PostgreSQL Memory: ${created.key}`, 'success');
      } catch {
        showToast(`Saved to Personal Memory: ${tempMem.key}`, 'success');
      }
    },
    [showToast],
  );

  const deleteUserMemory = useCallback(
    async (id: string) => {
      setUserMemories((prev) => prev.filter((m) => m.id !== id));
      try {
        await personalHubApi.deleteUserMemory(id);
        showToast('Memory item removed from database', 'warning');
      } catch {
        showToast('Memory item removed', 'warning');
      }
    },
    [showToast],
  );

  return {
    calendarEvents,
    setCalendarEvents,
    userMemories,
    setUserMemories,
    addCalendarEvent,
    updateCalendarEventStatus,
    addUserMemory,
    deleteUserMemory,
  };
}
