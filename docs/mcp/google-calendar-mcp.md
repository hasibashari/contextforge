# Google Calendar Model Context Protocol (MCP) Connector

## 1. Overview

The **Google Calendar MCP Connector** extends ContextForge with full calendar scheduling, agenda inspection, availability calculation, and meeting management capabilities. It implements the standard ContextForge `IMcpServer` architecture, allowing agentic models and user workflows to interact securely with Google Calendar v3 REST APIs.

### Key Capabilities
- 📅 **Multi-Calendar Discovery**: List personal, workspace, and secondary calendars.
- 🔍 **Event Search & Filtering**: Query meetings by date range (`timeMin`, `timeMax`), keywords, and calendar IDs.
- ⚡ **Meeting Scheduling**: Create single and recurring events with attendees, reminders, Google Meet links, and explicit timezones.
- 🔄 **Event Lifecycle Management**: Inspect event details, patch event metadata/time, and delete/cancel meetings.
- ⏱️ **Free/Busy Availability Check**: Compute busy intervals and open time slots across multiple team calendars in a single request.
- 🔒 **Enterprise-Grade Security**: OAuth 2.0 PKCE / Authorization Code flow with AES-256-GCM token encryption in PostgreSQL and least-privilege scopes.

---

## 2. Architecture & Directory Layout

The Google Calendar MCP implementation follows the established ContextForge connector conventions (`backend/src/mcp/connectors/google-calendar`):

```
backend/src/mcp/connectors/google-calendar/
├── google-calendar.types.ts            # TypeScript interfaces & DTOs
├── google-calendar-tools.definition.ts # Declarative tool schemas
├── google-calendar-parser.engine.ts    # ISO 8601 parsing, timezone fallback, free/busy calculations
├── google-calendar-api.client.ts       # Google Calendar v3 HTTP Client (fetch)
├── google-calendar-oauth.service.ts    # OAuth 2.0 exchange, token refresh, & AES-256 storage
└── google-calendar-mcp.connector.ts    # IMcpServer connector implementation
```

---

## 3. Tool Reference & Schemas

### 1. `google_calendar_list_calendars`
List all Google Calendars in the authenticated user's account.

- **Type**: Read-only (`readOnly: true`)
- **Parameters**:
  - `minAccessRole` *(string, optional)*: Filter by minimum access role (`freeBusyReader`, `reader`, `writer`, `owner`).
- **Sample Output**:
  ```json
  {
    "totalDiscovered": 2,
    "calendars": [
      {
        "id": "primary",
        "summary": "Engineering Sync",
        "timeZone": "Asia/Jakarta",
        "primary": true,
        "accessRole": "owner"
      }
    ]
  }
  ```

---

### 2. `google_calendar_list_events`
List and search events in a Google Calendar with date range filtering.

- **Type**: Read-only (`readOnly: true`)
- **Parameters**:
  - `calendarId` *(string, optional, default: `'primary'`)*: Target calendar ID.
  - `timeMin` *(string, optional)*: Lower bound for event start time (ISO 8601 string, e.g. `2026-08-25T00:00:00Z`).
  - `timeMax` *(string, optional)*: Upper bound for event start time (ISO 8601 string, e.g. `2026-08-25T23:59:59Z`).
  - `query` *(string, optional)*: Free text search term to filter event titles and descriptions.
  - `maxResults` *(number, optional, default: `50`)*: Maximum number of events to return.
  - `singleEvents` *(boolean, optional, default: `true`)*: Expand recurring events into single instances.
  - `orderBy` *(string, optional, default: `'startTime'`)*: Order by `startTime` or `updated`.

---

### 3. `google_calendar_get_event`
Get complete details of a specific event.

- **Type**: Read-only (`readOnly: true`)
- **Parameters**:
  - `eventId` *(string, required)*: The unique ID of the Google Calendar event.
  - `calendarId` *(string, optional, default: `'primary'`)*: Target calendar ID.
- **Sample Output**:
  ```json
  {
    "id": "ev-101",
    "summary": "ContextForge Sprint Planning",
    "description": "Bi-weekly sprint planning & backlog review",
    "start": { "dateTime": "2026-08-25T10:00:00+07:00", "timeZone": "Asia/Jakarta" },
    "end": { "dateTime": "2026-08-25T11:30:00+07:00", "timeZone": "Asia/Jakarta" },
    "location": "Google Meet",
    "attendees": [
      { "email": "lead@contextforge.ai", "responseStatus": "accepted" }
    ],
    "status": "confirmed"
  }
  ```

---

### 4. `google_calendar_create_event`
Create a new calendar event or meeting.

- **Type**: Mutation (`readOnly: false`)
- **Parameters**:
  - `summary` *(string, required)*: Title of the meeting / event.
  - `start` *(string, required)*: Start datetime (ISO 8601) or date (`YYYY-MM-DD` for all-day events).
  - `end` *(string, required)*: End datetime (ISO 8601) or date (`YYYY-MM-DD` for all-day events).
  - `calendarId` *(string, optional, default: `'primary'`)*: Target calendar ID.
  - `description` *(string, optional)*: Description or meeting agenda notes.
  - `location` *(string, optional)*: Meeting location or virtual link.
  - `attendees` *(array of strings or objects, optional)*: List of attendee email addresses.
  - `timeZone` *(string, optional, default: `'Asia/Jakarta'`)*: Timezone for start/end.
  - `allDay` *(boolean, optional, default: `false`)*: Set to `true` for all-day events.
  - `recurrence` *(array of strings, optional)*: RRULE recurrence rule (e.g. `["RRULE:FREQ=WEEKLY;BYDAY=TU"]`).
  - `createMeetingLink` *(boolean, optional, default: `false`)*: Automatically generate a Google Meet video conference link.

---

### 5. `google_calendar_update_event`
Update or reschedule an existing event.

- **Type**: Mutation (`readOnly: false`)
- **Parameters**:
  - `eventId` *(string, required)*: The ID of the event to update.
  - `calendarId` *(string, optional, default: `'primary'`)*: Target calendar ID.
  - `summary` *(string, optional)*: Updated event title.
  - `start` *(string, optional)*: Updated start datetime.
  - `end` *(string, optional)*: Updated end datetime.
  - `description` *(string, optional)*: Updated description.
  - `location` *(string, optional)*: Updated location.
  - `attendees` *(array, optional)*: Updated attendee list.
  - `timeZone` *(string, optional)*: Updated timezone.

---

### 6. `google_calendar_delete_event`
Delete / cancel an event from Google Calendar.

- **Type**: Mutation (`readOnly: false`)
- **Parameters**:
  - `eventId` *(string, required)*: The ID of the event to delete.
  - `calendarId` *(string, optional, default: `'primary'`)*: Target calendar ID.

---

### 7. `google_calendar_check_availability`
Query Free/Busy intervals and compute open time slots across one or more calendars.

- **Type**: Read-only (`readOnly: true`)
- **Parameters**:
  - `timeMin` *(string, required)*: Start of the query window (ISO 8601).
  - `timeMax` *(string, required)*: End of the query window (ISO 8601).
  - `calendarIds` *(array of strings, optional, default: `['primary']`)*: Calendar IDs to query.
  - `timeZone` *(string, optional, default: `'Asia/Jakarta'`)*: Timezone for availability calculation.
- **Sample Output**:
  ```json
  {
    "timeRange": {
      "start": "2026-08-25T08:00:00.000Z",
      "end": "2026-08-25T18:00:00.000Z"
    },
    "calendars": {
      "primary": {
        "busy": [
          { "start": "2026-08-25T10:00:00.000Z", "end": "2026-08-25T11:00:00.000Z" }
        ],
        "free": [
          { "start": "2026-08-25T08:00:00.000Z", "end": "2026-08-25T10:00:00.000Z" },
          { "start": "2026-08-25T11:00:00.000Z", "end": "2026-08-25T18:00:00.000Z" }
        ]
      }
    }
  }
  ```

---

## 4. Google Cloud Console Setup (OAuth 2.0)

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (e.g. `ContextForge`).
3. Enable the **Google Calendar API**:
   - Go to **APIs & Services** > **Library**.
   - Search for **Google Calendar API** and click **Enable**.
4. Configure **OAuth Consent Screen**:
   - User Type: **External** (or **Internal** for Google Workspace orgs).
   - App Name: `ContextForge MCP`.
   - Add Scopes:
     - `https://www.googleapis.com/auth/calendar.events` (Manage events)
     - `https://www.googleapis.com/auth/calendar.readonly` (Read calendars & availability)
5. Create **OAuth 2.0 Credentials**:
   - Go to **APIs & Services** > **Credentials** > **Create Credentials** > **OAuth Client ID**.
   - Application Type: **Web application**.
   - Name: `ContextForge Backend`.
   - Authorized redirect URIs:
     - `http://localhost:3001/api/ecosystem/oauth/google-calendar/callback`
     - Production URI: `https://your-domain.com/api/ecosystem/oauth/google-calendar/callback`
6. Copy `Client ID` and `Client Secret` into your `.env` file.

---

## 5. Environment Variables Configuration

Add the following variables to `backend/.env`:

```bash
# Google Calendar OAuth 2.0
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-your-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3001/api/ecosystem/oauth/google-calendar/callback"

# Optional Direct Access Token (Overrides database token for local dev/testing)
# GOOGLE_ACCESS_TOKEN="ya29.a0AfH..."

# System Default Timezone (Defaults to Asia/Jakarta if unset)
DEFAULT_TIMEZONE="Asia/Jakarta"
```

---

## 6. Security & Token Management

- **Least-Privilege Scopes**: The connector requests only `calendar.events` and `calendar.readonly`, avoiding full calendar administrative access.
- **AES-256-GCM Encryption**: Tokens stored in PostgreSQL `workspace_integrations` (`id = 'int-google-calendar-mcp'`) are encrypted using `EncryptionService` before persisting.
- **Zero Log Leakage**: Access tokens, refresh tokens, and credentials are never emitted in logs, timeline events, or error responses.
- **Automatic Token Refresh**: The `GoogleCalendarOAuthService` refreshes expired tokens transparently before API operations.

---

## 7. Troubleshooting & Error Codes

| Status Code | Description | Root Cause & Resolution |
| :--- | :--- | :--- |
| **401 Unauthorized** | Token expired or invalid | Token has expired or was revoked. Re-authenticate via `/api/ecosystem/oauth/google-calendar/authorize`. |
| **403 Forbidden** | Scope mismatch or quota exceeded | Ensure `calendar.events` scope was granted during OAuth consent. |
| **404 Not Found** | Calendar or event not found | Verify `calendarId` (e.g. `'primary'`) and `eventId`. |
| **400 Bad Request** | Invalid datetime range | Verify that `start` datetime is earlier than `end` datetime and conforms to ISO 8601 (`YYYY-MM-DDTHH:mm:ssZ`). |
| **Unauthenticated State** | Disconnected | No active token in DB or environment. Connect integration via UI or API. |
