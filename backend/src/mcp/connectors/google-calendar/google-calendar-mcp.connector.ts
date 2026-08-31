import { Injectable } from '@nestjs/common';
import {
  McpTransportType,
  McpToolDefinition,
  McpToolCallResult,
  BaseMcpConnector,
  McpHttpTransport,
} from '../../core';
import { GoogleCalendarApiClient } from './google-calendar-api.client';
import { GOOGLE_CALENDAR_MCP_TOOLS } from './google-calendar-tools.definition';
import {
  DEFAULT_TIMEZONE,
  parseEventDateTime,
  normalizeAttendees,
  validateTimeRange,
  calculateFreeSlots,
  formatEventSummary,
} from './google-calendar-parser.engine';
import {
  GoogleCalendarFreeBusyRequest,
  GoogleCalendarTimePeriod,
} from './google-calendar.types';

@Injectable()
export class GoogleCalendarMcpConnector extends BaseMcpConnector {
  readonly id = 'int-google-calendar-mcp';
  readonly name = 'Google Calendar MCP Server';
  readonly category = 'productivity';
  readonly transportType: McpTransportType = 'streamable_http';
  readonly isInternal = false;

  private endpoint = 'https://www.googleapis.com/calendar/v3';
  private refreshToken = '';
  private refreshHandler?: (refreshToken: string) => Promise<string>;
  private isExplicitlyDisconnected = false;

  constructor(
    private readonly httpTransport: McpHttpTransport,
    private readonly apiClient: GoogleCalendarApiClient,
  ) {
    super(GoogleCalendarMcpConnector.name);
  }

  setEndpoint(endpoint: string, authToken = '') {
    if (endpoint) this.endpoint = endpoint;
    if (authToken !== undefined) this.setAuthToken(authToken);
  }

  override setAuthToken(token: string): void {
    super.setAuthToken(token);
    if (!token && !this.refreshToken) {
      this.isExplicitlyDisconnected = true;
    } else if (token) {
      this.isExplicitlyDisconnected = false;
    }
  }

  setRefreshToken(refreshToken: string) {
    this.refreshToken = refreshToken || '';
    if (!this.refreshToken && !this.authToken) {
      this.isExplicitlyDisconnected = true;
    } else if (this.refreshToken) {
      this.isExplicitlyDisconnected = false;
    }
  }

  override disconnect(): void {
    this.setAuthToken('');
    this.setRefreshToken('');
  }

  getRefreshToken(): string {
    return this.refreshToken;
  }

  setRefreshHandler(handler: (refreshToken: string) => Promise<string>) {
    this.refreshHandler = handler;
  }

  configure(config: {
    endpoint?: string;
    token?: string;
    apiKey?: string;
    refreshToken?: string;
  }) {
    if (config.endpoint) this.endpoint = config.endpoint;
    if (config.refreshToken !== undefined)
      this.setRefreshToken(config.refreshToken);
    if (config.token !== undefined) this.setAuthToken(config.token);
    else if (config.apiKey !== undefined) this.setAuthToken(config.apiKey);
  }

  getTools(): McpToolDefinition[] {
    return GOOGLE_CALENDAR_MCP_TOOLS;
  }

  hasTool(toolName: string): boolean {
    return toolName.startsWith('google_calendar_');
  }

  private getEffectiveToken(): string {
    if (this.isExplicitlyDisconnected) {
      return '';
    }
    if (this.authToken && this.authToken.trim()) {
      return this.authToken.trim();
    }
    if (
      process.env.GOOGLE_ACCESS_TOKEN &&
      process.env.GOOGLE_ACCESS_TOKEN.trim()
    ) {
      return process.env.GOOGLE_ACCESS_TOKEN.trim();
    }
    if (
      process.env.GOOGLE_CALENDAR_TOKEN &&
      process.env.GOOGLE_CALENDAR_TOKEN.trim()
    ) {
      return process.env.GOOGLE_CALENDAR_TOKEN.trim();
    }
    return '';
  }

  override isConnected(): boolean {
    return Boolean(
      this.getEffectiveToken() ||
      (!this.isExplicitlyDisconnected && this.refreshToken),
    );
  }

  private async executeWithAuthRetry<T>(
    operation: (headers: Record<string, string>) => Promise<T>,
  ): Promise<T> {
    let token = this.getEffectiveToken();

    // If no access token but refresh token is available, attempt refresh first
    if (!token && this.refreshToken && this.refreshHandler) {
      try {
        token = await this.refreshHandler(this.refreshToken);
        this.setAuthToken(token);
      } catch (err: unknown) {
        this.logger.warn(`Initial token refresh failed: ${String(err)}`);
      }
    }

    if (!token) {
      throw new Error(
        'Authentication failed: Google Calendar token is not configured or expired.',
      );
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    try {
      return await operation(headers);
    } catch (err: unknown) {
      const isAuthError =
        err instanceof Error &&
        (err.message.includes('401') ||
          err.message.includes('Authentication failed') ||
          err.message.includes('unauthorized') ||
          err.message.includes('Invalid Credentials') ||
          err.message.includes('UNAUTHENTICATED'));

      if (isAuthError && this.refreshToken && this.refreshHandler) {
        this.logger.log(
          'Google Calendar access token expired or rejected. Auto-refreshing token...',
        );
        try {
          const newToken = await this.refreshHandler(this.refreshToken);
          if (newToken) {
            this.setAuthToken(newToken);
            headers.Authorization = `Bearer ${newToken}`;
            return await operation(headers);
          }
        } catch (refreshErr) {
          this.logger.error(
            `Failed to auto-refresh Google Calendar token: ${String(refreshErr)}`,
          );
        }
      }

      throw err;
    }
  }

  async executeTool(
    toolName: string,
    params: Record<string, unknown>,
  ): Promise<McpToolCallResult> {
    const token = this.getEffectiveToken();
    if (!token && !this.refreshToken) {
      return this.disconnectedResult(toolName, 'Google Calendar');
    }

    return this.safeExecute(toolName, async () => {
      switch (toolName) {
        // 1. LIST CALENDARS
        case 'google_calendar_list_calendars': {
          const minAccessRole = params.minAccessRole as string | undefined;
          const res = await this.executeWithAuthRetry((headers) =>
            this.apiClient.listCalendars(headers, minAccessRole),
          );
          const calendars = res.calendars || [];
          return {
            data: {
              totalDiscovered: calendars.length,
              calendars: calendars.map((cal) => ({
                id: cal.id,
                summary: cal.summary,
                description: cal.description,
                timeZone: cal.timeZone,
                primary: Boolean(cal.primary),
                accessRole: cal.accessRole,
                backgroundColor: cal.backgroundColor,
                foregroundColor: cal.foregroundColor,
              })),
            },
            summary: `📅 Successfully retrieved ${calendars.length} calendar(s) from Google Calendar account.`,
          };
        }

        // 2. LIST / SEARCH EVENTS
        case 'google_calendar_list_events': {
          const calendarId = (
            (params.calendarId as string) || 'primary'
          ).trim();
          const timeMin = params.timeMin as string | undefined;
          const timeMax = params.timeMax as string | undefined;
          const query = params.query as string | undefined;
          const maxResults =
            typeof params.maxResults === 'number'
              ? params.maxResults
              : typeof params.maxResults === 'string'
                ? parseInt(params.maxResults, 10)
                : 50;
          const singleEvents =
            params.singleEvents !== undefined
              ? Boolean(params.singleEvents)
              : true;
          const orderBy = params.orderBy as string | undefined;

          if (timeMin && timeMax) {
            validateTimeRange(timeMin, timeMax);
          }

          const res = await this.executeWithAuthRetry((headers) =>
            this.apiClient.listEvents(headers, calendarId, {
              timeMin,
              timeMax,
              query,
              maxResults,
              singleEvents,
              orderBy,
            }),
          );

          const events = res.events || [];
          const formattedList = events
            .map((ev) => `- ${formatEventSummary(ev)} (ID: \`${ev.id}\`)`)
            .join('\n');

          return {
            data: {
              calendarId,
              totalEvents: events.length,
              events,
            },
            summary:
              events.length > 0
                ? `📅 Found ${events.length} event(s) in calendar "${calendarId}":\n${formattedList}`
                : `📅 No events found in calendar "${calendarId}" for the given time range.`,
          };
        }

        // 3. GET SPECIFIC EVENT
        case 'google_calendar_get_event': {
          const calendarId = (
            (params.calendarId as string) || 'primary'
          ).trim();
          const eventId = params.eventId as string;
          if (!eventId) {
            throw new Error('Parameter "eventId" is required.');
          }

          const event = await this.executeWithAuthRetry((headers) =>
            this.apiClient.getEvent(headers, calendarId, eventId),
          );

          return {
            data: event as unknown as Record<string, unknown>,
            summary: `📌 Event Details: ${formatEventSummary(event)} (Status: ${event.status || 'confirmed'})`,
          };
        }

        // 4. CREATE EVENT
        case 'google_calendar_create_event': {
          const calendarId = (
            (params.calendarId as string) || 'primary'
          ).trim();
          const summary = (
            (params.summary as string) || 'Untitled Event'
          ).trim();
          const startStr = params.start as string;
          const endStr = params.end as string;
          const description = params.description as string | undefined;
          const location = params.location as string | undefined;
          const isAllDay = Boolean(params.allDay);
          const timeZone = (params.timeZone as string) || DEFAULT_TIMEZONE;
          const recurrence = params.recurrence as string[] | undefined;
          const attendees = normalizeAttendees(params.attendees);
          const createMeetingLink = Boolean(params.createMeetingLink);

          if (!startStr || !endStr) {
            throw new Error('Parameters "start" and "end" are required.');
          }

          if (!isAllDay) {
            validateTimeRange(startStr, endStr);
          }

          const start = parseEventDateTime(startStr, timeZone, isAllDay);
          const end = parseEventDateTime(endStr, timeZone, isAllDay);

          const eventPayload: Record<string, unknown> = {
            summary,
            start,
            end,
            description,
            location,
            attendees,
            recurrence,
          };

          if (createMeetingLink) {
            eventPayload.conferenceData = {
              createRequest: {
                requestId: `meet-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                conferenceSolutionKey: { type: 'hangoutsMeet' },
              },
            };
          }

          const created = await this.executeWithAuthRetry((headers) =>
            this.apiClient.createEvent(headers, calendarId, eventPayload),
          );

          const meetLink: string | undefined =
            created.conferenceData?.entryPoints?.find(
              (ep) => ep.entryPointType === 'video',
            )?.uri || (created.hangoutLink as string | undefined);

          return {
            data: created as unknown as Record<string, unknown>,
            summary: `✨ Successfully created new event: "${created.summary || 'Untitled Event'}" at ${formatEventSummary(created)}.${meetLink ? `\n🔗 Google Meet: ${meetLink}` : ''}`,
          };
        }

        // 5. UPDATE EVENT
        case 'google_calendar_update_event': {
          const calendarId = (
            (params.calendarId as string) || 'primary'
          ).trim();
          const eventId = params.eventId as string;
          if (!eventId) {
            throw new Error('Parameter "eventId" is required.');
          }

          const patchPayload: Record<string, unknown> = {};
          if (params.summary) patchPayload.summary = params.summary;
          if (params.description !== undefined)
            patchPayload.description = params.description;
          if (params.location !== undefined)
            patchPayload.location = params.location;

          const timeZone = (params.timeZone as string) || DEFAULT_TIMEZONE;
          const isAllDay = Boolean(params.allDay);

          if (params.start && params.end) {
            if (!isAllDay) {
              validateTimeRange(params.start as string, params.end as string);
            }
            patchPayload.start = parseEventDateTime(
              params.start as string,
              timeZone,
              isAllDay,
            );
            patchPayload.end = parseEventDateTime(
              params.end as string,
              timeZone,
              isAllDay,
            );
          } else if (params.start) {
            patchPayload.start = parseEventDateTime(
              params.start as string,
              timeZone,
              isAllDay,
            );
          } else if (params.end) {
            patchPayload.end = parseEventDateTime(
              params.end as string,
              timeZone,
              isAllDay,
            );
          }

          if (params.attendees) {
            patchPayload.attendees = normalizeAttendees(params.attendees);
          }
          if (params.recurrence) {
            patchPayload.recurrence = params.recurrence;
          }

          const updated = await this.executeWithAuthRetry((headers) =>
            this.apiClient.updateEvent(
              headers,
              calendarId,
              eventId,
              patchPayload,
            ),
          );

          return {
            data: updated as unknown as Record<string, unknown>,
            summary: `✏️ Successfully updated event "${updated.summary}": ${formatEventSummary(updated)}`,
          };
        }

        // 6. DELETE EVENT
        case 'google_calendar_delete_event': {
          const calendarId = (
            (params.calendarId as string) || 'primary'
          ).trim();
          const eventId = params.eventId as string;
          if (!eventId) {
            throw new Error('Parameter "eventId" is required.');
          }

          await this.executeWithAuthRetry((headers) =>
            this.apiClient.deleteEvent(headers, calendarId, eventId),
          );

          return {
            data: {
              success: true,
              deletedEventId: eventId,
              calendarId,
            },
            summary: `🗑️ Successfully deleted event (ID: \`${eventId}\`) from calendar "${calendarId}".`,
          };
        }

        // 7. CHECK AVAILABILITY / FREE-BUSY
        case 'google_calendar_check_availability': {
          const timeMin = params.timeMin as string;
          const timeMax = params.timeMax as string;
          if (!timeMin || !timeMax) {
            throw new Error('Parameters "timeMin" and "timeMax" are required.');
          }

          validateTimeRange(timeMin, timeMax);

          let calendarIds: string[] = ['primary'];
          if (Array.isArray(params.calendarIds) && params.calendarIds.length) {
            calendarIds = (params.calendarIds as string[]).map((c) =>
              String(c).trim(),
            );
          } else if (typeof params.calendarId === 'string') {
            calendarIds = [params.calendarId.trim()];
          }

          const timeZone = (params.timeZone as string) || DEFAULT_TIMEZONE;

          const requestPayload: GoogleCalendarFreeBusyRequest = {
            timeMin,
            timeMax,
            timeZone,
            items: calendarIds.map((id) => ({ id })),
          };

          const freeBusyRes = await this.executeWithAuthRetry((headers) =>
            this.apiClient.queryFreeBusy(headers, requestPayload),
          );

          const availabilityReport: Record<
            string,
            {
              busy: GoogleCalendarTimePeriod[];
              free: GoogleCalendarTimePeriod[];
            }
          > = {};

          let totalBusySlots = 0;
          let totalFreeSlots = 0;

          for (const calId of calendarIds) {
            const calData = freeBusyRes.calendars[calId];
            const busy = calData?.busy || [];
            const free = calculateFreeSlots(busy, timeMin, timeMax);

            totalBusySlots += busy.length;
            totalFreeSlots += free.length;

            availabilityReport[calId] = { busy, free };
          }

          return {
            data: {
              timeRange: { start: timeMin, end: timeMax, timeZone },
              calendars: availabilityReport,
            },
            summary: `⏱️ Availability Check (${timeMin} to ${timeMax}): Found ${totalBusySlots} busy slot(s) and ${totalFreeSlots} free slot(s) across ${calendarIds.length} calendar(s).`,
          };
        }

        default:
          throw new Error(
            `Tool "${toolName}" is not supported by Google Calendar MCP Connector.`,
          );
      }
    });
  }

  override async ping(): Promise<{
    status: 'connected' | 'disconnected' | 'error';
    message?: string;
    latencyMs: number;
  }> {
    let token = this.getEffectiveToken();
    if (!token) {
      if (this.refreshToken && this.refreshHandler) {
        try {
          token = await this.refreshHandler(this.refreshToken);
          this.setAuthToken(token);
        } catch {
          // Token refresh failed
        }
      }
      if (!token) {
        return {
          status: 'disconnected',
          message: 'Google Calendar access token is not set.',
          latencyMs: 0,
        };
      }
    }

    let probe = await this.apiClient.ping(token);
    if (
      probe.status === 'disconnected' &&
      this.refreshToken &&
      this.refreshHandler
    ) {
      try {
        const refreshedToken = await this.refreshHandler(this.refreshToken);
        if (refreshedToken) {
          this.setAuthToken(refreshedToken);
          probe = await this.apiClient.ping(refreshedToken);
        }
      } catch (err: unknown) {
        this.logger.debug(`Auto-refresh during ping failed: ${String(err)}`);
      }
    }
    return probe;
  }
}
