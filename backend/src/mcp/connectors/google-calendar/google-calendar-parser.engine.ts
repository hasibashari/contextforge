import {
  GoogleCalendarAttendee,
  GoogleCalendarEvent,
  GoogleCalendarEventDateTime,
  GoogleCalendarTimePeriod,
} from './google-calendar.types';

export const DEFAULT_TIMEZONE = process.env.DEFAULT_TIMEZONE || 'Asia/Jakarta';

/**
 * Validates whether a string is a valid ISO 8601 or YYYY-MM-DD format
 */
export function isValidDateTimeString(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  const d = new Date(value);
  return !isNaN(d.getTime());
}

/**
 * Checks if a string represents an all-day date (YYYY-MM-DD)
 */
export function isDateOnlyString(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
}

/**
 * Converts user input into a Google Calendar EventDateTime object
 */
export function parseEventDateTime(
  value: string,
  timeZone = DEFAULT_TIMEZONE,
  isAllDay = false,
): GoogleCalendarEventDateTime {
  const trimmed = (value || '').trim();

  if (isAllDay || isDateOnlyString(trimmed)) {
    // If it's a date-only string or explicitly flagged all-day
    const dateStr = trimmed.includes('T') ? trimmed.split('T')[0] : trimmed;
    return {
      date: dateStr,
    };
  }

  // Ensure valid date
  const parsedDate = new Date(trimmed);
  if (isNaN(parsedDate.getTime())) {
    throw new Error(
      `Invalid datetime format: "${value}". Expected ISO 8601 format (e.g. "2026-08-25T14:00:00+07:00" or "2026-08-25T07:00:00Z")`,
    );
  }

  // If user passed a full ISO with timezone offset, preserve or include timeZone
  return {
    dateTime: parsedDate.toISOString(),
    timeZone: timeZone || DEFAULT_TIMEZONE,
  };
}

/**
 * Normalizes attendees array (accepts string[] of emails or objects)
 */
export function normalizeAttendees(
  rawAttendees: unknown,
): GoogleCalendarAttendee[] | undefined {
  if (!rawAttendees || !Array.isArray(rawAttendees)) return undefined;

  const result: GoogleCalendarAttendee[] = [];
  for (const item of rawAttendees) {
    if (typeof item === 'string' && item.includes('@')) {
      result.push({ email: item.trim() });
    } else if (typeof item === 'object' && item !== null) {
      const obj = item as Record<string, unknown>;
      if (typeof obj.email === 'string' && obj.email.includes('@')) {
        result.push({
          email: obj.email.trim(),
          displayName:
            typeof obj.displayName === 'string' ? obj.displayName : undefined,
          optional: Boolean(obj.optional),
          responseStatus: obj.responseStatus as
            'needsAction' | 'declined' | 'tentative' | 'accepted' | undefined,
        });
      }
    }
  }

  return result.length > 0 ? result : undefined;
}

/**
 * Validates that timeMin is earlier than timeMax
 */
export function validateTimeRange(timeMin: string, timeMax: string): void {
  const start = new Date(timeMin).getTime();
  const end = new Date(timeMax).getTime();

  if (isNaN(start)) {
    throw new Error(`Invalid start time: "${timeMin}"`);
  }
  if (isNaN(end)) {
    throw new Error(`Invalid end time: "${timeMax}"`);
  }
  if (start >= end) {
    throw new Error(
      `Invalid time range: start time (${timeMin}) must be earlier than end time (${timeMax})`,
    );
  }
}

/**
 * Computes available (free) time slots from busy intervals within a window
 */
export function calculateFreeSlots(
  busyIntervals: GoogleCalendarTimePeriod[],
  timeMin: string,
  timeMax: string,
): GoogleCalendarTimePeriod[] {
  const windowStart = new Date(timeMin).getTime();
  const windowEnd = new Date(timeMax).getTime();

  if (busyIntervals.length === 0) {
    return [{ start: timeMin, end: timeMax }];
  }

  // Sort and merge overlapping busy intervals
  const sorted = [...busyIntervals]
    .map((b) => ({
      start: Math.max(windowStart, new Date(b.start).getTime()),
      end: Math.min(windowEnd, new Date(b.end).getTime()),
    }))
    .filter((b) => b.start < b.end)
    .sort((a, b) => a.start - b.start);

  const merged: Array<{ start: number; end: number }> = [];
  for (const current of sorted) {
    if (merged.length === 0) {
      merged.push(current);
    } else {
      const prev = merged[merged.length - 1];
      if (current.start <= prev.end) {
        prev.end = Math.max(prev.end, current.end);
      } else {
        merged.push(current);
      }
    }
  }

  // Find free intervals between merged busy blocks
  const free: GoogleCalendarTimePeriod[] = [];
  let cursor = windowStart;

  for (const busy of merged) {
    if (cursor < busy.start) {
      free.push({
        start: new Date(cursor).toISOString(),
        end: new Date(busy.start).toISOString(),
      });
    }
    cursor = Math.max(cursor, busy.end);
  }

  if (cursor < windowEnd) {
    free.push({
      start: new Date(cursor).toISOString(),
      end: new Date(windowEnd).toISOString(),
    });
  }

  return free;
}

/**
 * Formats a Google Calendar event into a concise, readable summary string
 */
export function formatEventSummary(event: GoogleCalendarEvent): string {
  const title = event.summary || '(Untitled Event)';
  const startStr =
    event.start?.dateTime || event.start?.date || 'Unspecified start';
  const endStr = event.end?.dateTime || event.end?.date || 'Unspecified end';
  const loc = event.location ? ` at ${event.location}` : '';
  const attendeeCount = event.attendees?.length
    ? ` (${event.attendees.length} attendees)`
    : '';

  return `"${title}" from ${startStr} to ${endStr}${loc}${attendeeCount}`;
}
