import { Injectable, Logger } from '@nestjs/common';
import {
  GoogleCalendarEntry,
  GoogleCalendarEvent,
  GoogleCalendarFreeBusyRequest,
  GoogleCalendarFreeBusyResponse,
} from './google-calendar.types';

@Injectable()
export class GoogleCalendarApiClient {
  private readonly logger = new Logger(GoogleCalendarApiClient.name);
  private readonly baseUrl = 'https://www.googleapis.com/calendar/v3';

  // ==========================================
  // 1. LIST CALENDARS
  // ==========================================
  async listCalendars(
    authHeaders: Record<string, string>,
    minAccessRole?: string,
  ): Promise<{
    totalCount: number;
    calendars: GoogleCalendarEntry[];
  }> {
    const url = new URL(`${this.baseUrl}/users/me/calendarList`);
    if (minAccessRole) {
      url.searchParams.set('minAccessRole', minAccessRole);
    }

    const response = await this.executeFetch(url.toString(), {
      method: 'GET',
      headers: authHeaders,
    });

    const data = (await response.json()) as {
      items?: Array<{
        id?: string;
        summary?: string;
        description?: string;
        timeZone?: string;
        primary?: boolean;
        accessRole?: string;
        backgroundColor?: string;
        foregroundColor?: string;
        selected?: boolean;
      }>;
    };

    const calendars: GoogleCalendarEntry[] = (data.items || []).map((item) => ({
      id: item.id || '',
      summary: item.summary || '(Untitled Calendar)',
      description: item.description,
      timeZone: item.timeZone,
      primary: Boolean(item.primary),
      accessRole: item.accessRole,
      backgroundColor: item.backgroundColor,
      foregroundColor: item.foregroundColor,
      selected: Boolean(item.selected),
    }));

    return {
      totalCount: calendars.length,
      calendars,
    };
  }

  // ==========================================
  // 2. LIST / SEARCH EVENTS
  // ==========================================
  async listEvents(
    authHeaders: Record<string, string>,
    calendarId = 'primary',
    options: {
      timeMin?: string;
      timeMax?: string;
      query?: string;
      maxResults?: number;
      singleEvents?: boolean;
      orderBy?: string;
    } = {},
  ): Promise<{
    calendarId: string;
    totalCount: number;
    events: GoogleCalendarEvent[];
  }> {
    const encodedCalId = encodeURIComponent(calendarId || 'primary');
    const url = new URL(`${this.baseUrl}/calendars/${encodedCalId}/events`);

    if (options.timeMin) url.searchParams.set('timeMin', options.timeMin);
    if (options.timeMax) url.searchParams.set('timeMax', options.timeMax);
    if (options.query) url.searchParams.set('q', options.query);
    if (options.maxResults) {
      url.searchParams.set(
        'maxResults',
        String(Math.min(options.maxResults, 250)),
      );
    }
    const singleEvents =
      options.singleEvents !== undefined ? options.singleEvents : true;
    url.searchParams.set('singleEvents', String(singleEvents));

    if (options.orderBy) {
      url.searchParams.set('orderBy', options.orderBy);
    } else if (singleEvents) {
      url.searchParams.set('orderBy', 'startTime');
    }

    const response = await this.executeFetch(url.toString(), {
      method: 'GET',
      headers: authHeaders,
    });

    const data = (await response.json()) as {
      items?: GoogleCalendarEvent[];
    };

    const events: GoogleCalendarEvent[] = data.items || [];

    return {
      calendarId,
      totalCount: events.length,
      events,
    };
  }

  // ==========================================
  // 3. GET EVENT DETAILS
  // ==========================================
  async getEvent(
    authHeaders: Record<string, string>,
    calendarId = 'primary',
    eventId: string,
    timeZone?: string,
  ): Promise<GoogleCalendarEvent> {
    if (!eventId || !eventId.trim()) {
      throw new Error('eventId is required to retrieve event details');
    }

    const encodedCalId = encodeURIComponent(calendarId || 'primary');
    const encodedEventId = encodeURIComponent(eventId.trim());
    const url = new URL(
      `${this.baseUrl}/calendars/${encodedCalId}/events/${encodedEventId}`,
    );

    if (timeZone) {
      url.searchParams.set('timeZone', timeZone);
    }

    const response = await this.executeFetch(url.toString(), {
      method: 'GET',
      headers: authHeaders,
    });

    return (await response.json()) as GoogleCalendarEvent;
  }

  // ==========================================
  // 4. CREATE EVENT
  // ==========================================
  async createEvent(
    authHeaders: Record<string, string>,
    calendarId = 'primary',
    eventPayload: Record<string, unknown>,
  ): Promise<GoogleCalendarEvent> {
    const encodedCalId = encodeURIComponent(calendarId || 'primary');
    const url = `${this.baseUrl}/calendars/${encodedCalId}/events`;

    const response = await this.executeFetch(url, {
      method: 'POST',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventPayload),
    });

    return (await response.json()) as GoogleCalendarEvent;
  }

  // ==========================================
  // 5. UPDATE EVENT
  // ==========================================
  async updateEvent(
    authHeaders: Record<string, string>,
    calendarId = 'primary',
    eventId: string,
    eventPayload: Record<string, unknown>,
  ): Promise<GoogleCalendarEvent> {
    if (!eventId || !eventId.trim()) {
      throw new Error('eventId is required to update an event');
    }

    const encodedCalId = encodeURIComponent(calendarId || 'primary');
    const encodedEventId = encodeURIComponent(eventId.trim());
    const url = `${this.baseUrl}/calendars/${encodedCalId}/events/${encodedEventId}`;

    const response = await this.executeFetch(url, {
      method: 'PATCH',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventPayload),
    });

    return (await response.json()) as GoogleCalendarEvent;
  }

  // ==========================================
  // 6. DELETE EVENT
  // ==========================================
  async deleteEvent(
    authHeaders: Record<string, string>,
    calendarId = 'primary',
    eventId: string,
  ): Promise<{ success: boolean; eventId: string; calendarId: string }> {
    if (!eventId || !eventId.trim()) {
      throw new Error('eventId is required to delete an event');
    }

    const encodedCalId = encodeURIComponent(calendarId || 'primary');
    const encodedEventId = encodeURIComponent(eventId.trim());
    const url = `${this.baseUrl}/calendars/${encodedCalId}/events/${encodedEventId}`;

    await this.executeFetch(url, {
      method: 'DELETE',
      headers: authHeaders,
    });

    return {
      success: true,
      eventId,
      calendarId,
    };
  }

  // ==========================================
  // 7. FREE / BUSY AVAILABILITY
  // ==========================================
  async queryFreeBusy(
    authHeaders: Record<string, string>,
    request: GoogleCalendarFreeBusyRequest,
  ): Promise<GoogleCalendarFreeBusyResponse> {
    const url = `${this.baseUrl}/freeBusy`;

    const response = await this.executeFetch(url, {
      method: 'POST',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    return (await response.json()) as GoogleCalendarFreeBusyResponse;
  }

  // ==========================================
  // PING / HEALTH CHECK
  // ==========================================
  async ping(token: string): Promise<{
    status: 'connected' | 'disconnected' | 'error';
    message: string;
    latencyMs: number;
  }> {
    if (!token) {
      return {
        status: 'disconnected',
        message: 'Google Calendar integration requires OAuth 2.0 token',
        latencyMs: 0,
      };
    }

    const start = Date.now();
    try {
      const response = await fetch(
        `${this.baseUrl}/users/me/calendarList?maxResults=1`,
        {
          headers: {
            Authorization: `Bearer ${token.trim()}`,
            Accept: 'application/json',
          },
        },
      );

      const latencyMs = Date.now() - start;

      if (response.ok) {
        return {
          status: 'connected',
          message: 'Google Calendar API live connection established',
          latencyMs,
        };
      }

      if (response.status === 401) {
        return {
          status: 'disconnected',
          message: 'Google Calendar OAuth token expired or invalid (HTTP 401)',
          latencyMs,
        };
      }

      return {
        status: 'disconnected',
        message: `Google Calendar API returned status HTTP ${response.status}`,
        latencyMs,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        status: 'error',
        message: `Failed to reach Google Calendar API: ${msg}`,
        latencyMs: Date.now() - start,
      };
    }
  }

  // ==========================================
  // HELPER: EXECUTE FETCH WITH ERROR SANITIZATION
  // ==========================================
  private async executeFetch(
    url: string,
    options: RequestInit,
  ): Promise<Response> {
    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        let errorDetails = `HTTP ${response.status} ${response.statusText}`;
        try {
          const errBody = (await response.json()) as {
            error?: {
              message?: string;
              errors?: Array<{ reason: string; message: string }>;
              status?: string;
            };
          };
          if (errBody?.error?.message) {
            errorDetails = `${errBody.error.message} (${errBody.error.status || response.status})`;
          }
        } catch {
          // Fallback to status text
        }

        if (response.status === 401) {
          throw new Error(
            `Authentication failed: Google Calendar token is expired or unauthorized. (${errorDetails})`,
          );
        }

        if (response.status === 404) {
          throw new Error(
            `Resource not found in Google Calendar: ${errorDetails}`,
          );
        }

        if (response.status === 403) {
          throw new Error(
            `Access forbidden or quota exceeded on Google Calendar: ${errorDetails}`,
          );
        }

        if (response.status === 429) {
          throw new Error(
            `Google Calendar rate limit exceeded. Please retry after a brief delay. (${errorDetails})`,
          );
        }

        throw new Error(`Google Calendar API error: ${errorDetails}`);
      }

      return response;
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw err;
      }
      throw new Error(`Network error communicating with Google Calendar API`);
    }
  }
}
