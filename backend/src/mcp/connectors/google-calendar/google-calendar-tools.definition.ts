import { McpToolDefinition } from '../../core';

/**
 * Declarative Tool Definitions for the Google Calendar Remote MCP Server
 */
export const GOOGLE_CALENDAR_MCP_TOOLS: McpToolDefinition[] = [
  {
    id: 't-gcal-1',
    name: 'google_calendar_list_calendars',
    description:
      'Lists all Google Calendars in the authenticated user account, including the primary calendar and any secondary or subscribed calendars.',
    parametersSchema: {
      type: 'object',
      properties: {
        minAccessRole: {
          type: 'string',
          description:
            'The minimum access role for the user: "freeBusyReader", "reader", "writer", or "owner" (default: all)',
        },
      },
    },
    readOnly: true,
  },
  {
    id: 't-gcal-2',
    name: 'google_calendar_list_events',
    description:
      'Lists, searches, or filters events in a Google Calendar. Supports filtering by date range (timeMin, timeMax), text search (query), and expanding recurring events into single instances.',
    parametersSchema: {
      type: 'object',
      properties: {
        calendarId: {
          type: 'string',
          description:
            'Calendar identifier. Use "primary" for the primary calendar of the logged-in user (default: "primary")',
        },
        timeMin: {
          type: 'string',
          description:
            'Lower bound (exclusive) for an event end time to filter by (ISO 8601 string, e.g. "2026-08-25T00:00:00Z" or "2026-08-25T00:00:00+07:00")',
        },
        timeMax: {
          type: 'string',
          description:
            'Upper bound (exclusive) for an event start time to filter by (ISO 8601 string, e.g. "2026-08-31T23:59:59Z")',
        },
        query: {
          type: 'string',
          description:
            'Free text search terms to find events matching summary, description, attendee, or location',
        },
        maxResults: {
          type: 'string',
          description:
            'Maximum number of events returned on one page (default: 50, max: 250)',
        },
        singleEvents: {
          type: 'boolean',
          description:
            'Whether to expand recurring events into instances and sort by start time (default: true)',
        },
        orderBy: {
          type: 'string',
          description:
            'Order of events: "startTime" (requires singleEvents=true) or "updated"',
        },
      },
    },
    readOnly: true,
  },
  {
    id: 't-gcal-3',
    name: 'google_calendar_get_event',
    description:
      'Retrieves full details for a single Google Calendar event by eventId and calendarId, including attendees, recurrence rules, conference links, and reminders.',
    parametersSchema: {
      type: 'object',
      properties: {
        eventId: {
          type: 'string',
          description: 'Unique Google Calendar event identifier',
        },
        calendarId: {
          type: 'string',
          description:
            'Calendar identifier containing the event (default: "primary")',
        },
        timeZone: {
          type: 'string',
          description:
            'Time zone used in the response (default: user calendar timeZone or "Asia/Jakarta")',
        },
      },
      required: ['eventId'],
    },
    readOnly: true,
  },
  {
    id: 't-gcal-4',
    name: 'google_calendar_create_event',
    description:
      'Creates a new event in Google Calendar. Supports timed meetings with start/end ISO datetimes, all-day events, timezone specification, attendees, location, description, and recurrence rules.',
    parametersSchema: {
      type: 'object',
      properties: {
        calendarId: {
          type: 'string',
          description:
            'Calendar identifier to create the event in (default: "primary")',
        },
        summary: {
          type: 'string',
          description: 'Title or summary of the event',
        },
        description: {
          type: 'string',
          description: 'Detailed description or notes for the event',
        },
        location: {
          type: 'string',
          description: 'Geographic location or virtual meeting room/link',
        },
        start: {
          type: 'string',
          description:
            'Start time as ISO 8601 string (e.g. "2026-08-25T14:00:00+07:00") or Date string ("2026-08-25") for all-day events',
        },
        end: {
          type: 'string',
          description:
            'End time as ISO 8601 string (e.g. "2026-08-25T15:00:00+07:00") or Date string ("2026-08-26") for all-day events',
        },
        allDay: {
          type: 'boolean',
          description:
            'Set to true if this is an all-day event (start and end will be treated as dates)',
        },
        timeZone: {
          type: 'string',
          description:
            'Time zone for the event (e.g. "Asia/Jakarta", "America/New_York"). Defaults to "Asia/Jakarta" if not provided.',
        },
        attendees: {
          type: 'array',
          description:
            'Array of attendee email addresses or attendee objects with email and displayName',
        },
        recurrence: {
          type: 'array',
          description:
            'List of RRULE, EXRULE, RDATE, and EXDATE lines for recurring events (e.g. ["RRULE:FREQ=WEEKLY;COUNT=10"])',
        },
      },
      required: ['summary', 'start', 'end'],
    },
    readOnly: false,
  },
  {
    id: 't-gcal-5',
    name: 'google_calendar_update_event',
    description:
      'Updates an existing Google Calendar event. Allows modifying title, times, description, location, attendees, or recurrence.',
    parametersSchema: {
      type: 'object',
      properties: {
        eventId: {
          type: 'string',
          description: 'Unique Google Calendar event identifier to update',
        },
        calendarId: {
          type: 'string',
          description:
            'Calendar identifier containing the event (default: "primary")',
        },
        summary: {
          type: 'string',
          description: 'Updated title or summary of the event',
        },
        description: {
          type: 'string',
          description: 'Updated detailed description or notes',
        },
        location: {
          type: 'string',
          description: 'Updated location or meeting URL',
        },
        start: {
          type: 'string',
          description:
            'Updated start time as ISO 8601 string or Date string (YYYY-MM-DD)',
        },
        end: {
          type: 'string',
          description:
            'Updated end time as ISO 8601 string or Date string (YYYY-MM-DD)',
        },
        allDay: {
          type: 'boolean',
          description: 'Whether the event is an all-day event',
        },
        timeZone: {
          type: 'string',
          description: 'Time zone for the event (default: "Asia/Jakarta")',
        },
        attendees: {
          type: 'array',
          description: 'Updated list of attendee email addresses',
        },
        recurrence: {
          type: 'array',
          description: 'Updated list of RRULE recurrence strings',
        },
      },
      required: ['eventId'],
    },
    readOnly: false,
  },
  {
    id: 't-gcal-6',
    name: 'google_calendar_delete_event',
    description:
      'Permanently removes or cancels an event from Google Calendar by eventId.',
    parametersSchema: {
      type: 'object',
      properties: {
        eventId: {
          type: 'string',
          description: 'Unique Google Calendar event identifier to delete',
        },
        calendarId: {
          type: 'string',
          description:
            'Calendar identifier containing the event (default: "primary")',
        },
      },
      required: ['eventId'],
    },
    readOnly: false,
  },
  {
    id: 't-gcal-7',
    name: 'google_calendar_check_availability',
    description:
      'Checks free/busy availability schedule across one or more calendars or users within a specified time window to find open meeting slots.',
    parametersSchema: {
      type: 'object',
      properties: {
        timeMin: {
          type: 'string',
          description:
            'Start of the evaluation window (ISO 8601 string, e.g. "2026-08-25T08:00:00+07:00")',
        },
        timeMax: {
          type: 'string',
          description:
            'End of the evaluation window (ISO 8601 string, e.g. "2026-08-25T18:00:00+07:00")',
        },
        calendarIds: {
          type: 'array',
          description:
            'List of calendar identifiers or user email addresses to check availability for (default: ["primary"])',
        },
        timeZone: {
          type: 'string',
          description:
            'Time zone used for calculating availability intervals (default: "Asia/Jakarta")',
        },
      },
      required: ['timeMin', 'timeMax'],
    },
    readOnly: true,
  },
];
