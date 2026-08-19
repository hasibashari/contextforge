import { Injectable, NotFoundException } from '@nestjs/common';
import {
  PersonalHubRepository,
  CalendarEventRow,
  UserMemoryRow,
} from './personal-hub.repository';

@Injectable()
export class PersonalHubService {
  constructor(private readonly repo: PersonalHubRepository) {}

  async getCalendarEvents(): Promise<CalendarEventRow[]> {
    return this.repo.getCalendarEvents();
  }

  async createCalendarEvent(data: {
    title: string;
    eventDate: string;
    eventTime: string;
    duration?: string;
    location?: string;
    status?: 'upcoming' | 'in_progress' | 'completed';
    category?: 'meeting' | 'task' | 'review' | 'personal';
    attendees?: string[];
  }): Promise<CalendarEventRow> {
    return this.repo.createCalendarEvent(data);
  }

  async updateCalendarEventStatus(
    id: string,
    status: string,
  ): Promise<CalendarEventRow> {
    const ev = await this.repo.updateCalendarEventStatus(id, status);
    if (!ev) throw new NotFoundException(`Calendar event ${id} not found`);
    return ev;
  }

  async deleteCalendarEvent(id: string): Promise<{ success: boolean }> {
    await this.repo.deleteCalendarEvent(id);
    return { success: true };
  }

  async getUserMemories(): Promise<UserMemoryRow[]> {
    return this.repo.getUserMemories();
  }

  async createUserMemory(data: {
    category: 'profile' | 'preference' | 'project' | 'workflow';
    key: string;
    value: string;
  }): Promise<UserMemoryRow> {
    return this.repo.createUserMemory(data);
  }

  async deleteUserMemory(id: string): Promise<{ success: boolean }> {
    await this.repo.deleteUserMemory(id);
    return { success: true };
  }
}
