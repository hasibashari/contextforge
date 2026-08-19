import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';

export interface CalendarEventRow {
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

export interface UserMemoryRow {
  id: string;
  user_id?: string;
  category: 'profile' | 'preference' | 'project' | 'workflow';
  key: string;
  value: string;
  embedding?: any;
  updated_at: string;
}

@Injectable()
export class PersonalHubRepository {
  constructor(private readonly db: DatabaseService) {}

  // Calendar queries
  async getCalendarEvents(): Promise<CalendarEventRow[]> {
    const res = await this.db.query<CalendarEventRow>(
      `SELECT * FROM calendar_events ORDER BY event_date ASC, event_time ASC;`,
    );
    return res.rows;
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
    const res = await this.db.query<CalendarEventRow>(
      `INSERT INTO calendar_events (title, event_date, event_time, duration, location, status, category, attendees)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *;`,
      [
        data.title,
        data.eventDate,
        data.eventTime,
        data.duration || '30m',
        data.location || null,
        data.status || 'upcoming',
        data.category || 'task',
        data.attendees || [],
      ],
    );
    return res.rows[0];
  }

  async updateCalendarEventStatus(
    id: string,
    status: string,
  ): Promise<CalendarEventRow | null> {
    const res = await this.db.query<CalendarEventRow>(
      `UPDATE calendar_events SET status = $2 WHERE id = $1 RETURNING *;`,
      [id, status],
    );
    return res.rows[0] || null;
  }

  async deleteCalendarEvent(id: string): Promise<void> {
    await this.db.query(`DELETE FROM calendar_events WHERE id = $1;`, [id]);
  }

  // Memory queries
  async getUserMemories(): Promise<UserMemoryRow[]> {
    const res = await this.db.query<UserMemoryRow>(
      `SELECT * FROM user_memories ORDER BY updated_at DESC;`,
    );
    return res.rows;
  }

  async createUserMemory(data: {
    category: 'profile' | 'preference' | 'project' | 'workflow';
    key: string;
    value: string;
  }): Promise<UserMemoryRow> {
    const res = await this.db.query<UserMemoryRow>(
      `INSERT INTO user_memories (category, key, value)
       VALUES ($1, $2, $3)
       RETURNING *;`,
      [data.category, data.key, data.value],
    );
    return res.rows[0];
  }

  async deleteUserMemory(id: string): Promise<void> {
    await this.db.query(`DELETE FROM user_memories WHERE id = $1;`, [id]);
  }
}
