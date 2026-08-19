import { API_BASE_URL, handleApiResponse } from './config';
import type { CalendarEvent, UserMemoryItem } from '@/shared/types/workspace';

export interface BackendCalendarEvent {
  id: string;
  user_id?: string;
  title: string;
  event_date: string;
  event_time: string;
  duration: string;
  location?: string;
  status: 'upcoming' | 'in_progress' | 'completed';
  category: 'meeting' | 'task' | 'review' | 'personal';
  attendees?: string[];
  created_at: string;
}

export interface BackendUserMemory {
  id: string;
  user_id?: string;
  category: 'profile' | 'preference' | 'project' | 'workflow';
  key: string;
  value: string;
  updated_at: string;
}

export const personalHubApi = {
  // Calendar
  async getCalendarEvents(): Promise<CalendarEvent[]> {
    const res = await fetch(`${API_BASE_URL}/personal-hub/calendar`);
    const data = await handleApiResponse<BackendCalendarEvent[]>(res);
    return data.map((e) => ({
      id: e.id,
      title: e.title,
      date: e.event_date ? new Date(e.event_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : 'Today',
      time: e.event_time,
      duration: e.duration,
      location: e.location,
      status: e.status,
      category: e.category,
      attendees: e.attendees,
    }));
  },

  async createCalendarEvent(event: {
    title: string;
    eventDate: string;
    eventTime: string;
    duration?: string;
    location?: string;
    category?: 'meeting' | 'task' | 'review' | 'personal';
    attendees?: string[];
  }): Promise<CalendarEvent> {
    const res = await fetch(`${API_BASE_URL}/personal-hub/calendar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });
    const e = await handleApiResponse<BackendCalendarEvent>(res);
    return {
      id: e.id,
      title: e.title,
      date: 'Today',
      time: e.event_time,
      duration: e.duration,
      location: e.location,
      status: e.status,
      category: e.category,
      attendees: e.attendees,
    };
  },

  async updateCalendarStatus(id: string, status: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/personal-hub/calendar/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    await handleApiResponse<{ success: boolean }>(res);
  },

  async deleteCalendarEvent(id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/personal-hub/calendar/${id}`, { method: 'DELETE' });
    await handleApiResponse<{ success: boolean }>(res);
  },

  // Memories
  async getUserMemories(): Promise<UserMemoryItem[]> {
    const res = await fetch(`${API_BASE_URL}/personal-hub/memories`);
    const data = await handleApiResponse<BackendUserMemory[]>(res);
    return data.map((m) => ({
      id: m.id,
      category: m.category,
      key: m.key,
      value: m.value,
      lastUpdated: new Date(m.updated_at).toLocaleDateString(),
    }));
  },

  async createUserMemory(memory: {
    category: 'profile' | 'preference' | 'project' | 'workflow';
    key: string;
    value: string;
  }): Promise<UserMemoryItem> {
    const res = await fetch(`${API_BASE_URL}/personal-hub/memories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(memory),
    });
    const m = await handleApiResponse<BackendUserMemory>(res);
    return {
      id: m.id,
      category: m.category,
      key: m.key,
      value: m.value,
      lastUpdated: 'Just now',
    };
  },

  async deleteUserMemory(id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/personal-hub/memories/${id}`, { method: 'DELETE' });
    await handleApiResponse<{ success: boolean }>(res);
  },
};
