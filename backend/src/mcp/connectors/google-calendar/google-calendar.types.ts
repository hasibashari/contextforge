/**
 * Google Calendar Model Context Protocol (MCP) Types & Contracts
 */

export interface GoogleCalendarEntry {
  id: string;
  summary: string;
  description?: string;
  timeZone?: string;
  primary?: boolean;
  accessRole?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  selected?: boolean;
  [key: string]: unknown;
}

export interface GoogleCalendarEventDateTime {
  dateTime?: string; // ISO 8601 string (e.g. 2026-08-25T14:00:00+07:00)
  date?: string; // YYYY-MM-DD for all-day events
  timeZone?: string;
}

export interface GoogleCalendarAttendee {
  email: string;
  displayName?: string;
  responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  optional?: boolean;
  organizer?: boolean;
  self?: boolean;
}

export interface GoogleCalendarEvent {
  id: string;
  status?: string;
  htmlLink?: string;
  created?: string;
  updated?: string;
  summary?: string;
  description?: string;
  location?: string;
  start: GoogleCalendarEventDateTime;
  end: GoogleCalendarEventDateTime;
  recurrence?: string[];
  recurringEventId?: string;
  attendees?: GoogleCalendarAttendee[];
  creator?: { email?: string; displayName?: string; self?: boolean };
  organizer?: { email?: string; displayName?: string; self?: boolean };
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{ method: string; minutes: number }>;
  };
  conferenceData?: {
    entryPoints?: Array<{
      entryPointType: string;
      uri: string;
      label?: string;
    }>;
  };
  [key: string]: unknown;
}

export interface GoogleCalendarTimePeriod {
  start: string;
  end: string;
}

export interface GoogleCalendarFreeBusyCalendar {
  errors?: Array<{ domain: string; reason: string }>;
  busy: GoogleCalendarTimePeriod[];
}

export interface GoogleCalendarFreeBusyRequest {
  timeMin: string;
  timeMax: string;
  timeZone?: string;
  items: Array<{ id: string }>;
}

export interface GoogleCalendarFreeBusyResponse {
  kind: 'calendar#freeBusy';
  timeMin: string;
  timeMax: string;
  calendars: Record<string, GoogleCalendarFreeBusyCalendar>;
}

export interface GoogleOAuthTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  id_token?: string;
  error?: string;
  error_description?: string;
}

export interface GoogleCalendarAuthConfig {
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: number;
  email?: string;
  primaryCalendarId?: string;
  timeZone?: string;
}
