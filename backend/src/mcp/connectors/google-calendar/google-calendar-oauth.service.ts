import {
  Injectable,
  BadRequestException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { DatabaseService } from '../../../common/database/database.service';
import { EncryptionService } from '../../../common/security/encryption.service';
import { IMcpOAuthHandler } from '../../core';
import { GoogleCalendarMcpConnector } from './google-calendar-mcp.connector';
import { GoogleOAuthTokenResponse } from './google-calendar.types';

@Injectable()
export class GoogleCalendarOAuthService
  implements IMcpOAuthHandler, OnModuleInit
{
  private readonly logger = new Logger(GoogleCalendarOAuthService.name);
  readonly providerId = 'google-calendar';

  constructor(
    private readonly db: DatabaseService,
    private readonly encryption: EncryptionService,
    private readonly calendarConnector: GoogleCalendarMcpConnector,
  ) {}

  onModuleInit() {
    this.calendarConnector.setRefreshHandler((refreshToken: string) =>
      this.refreshAccessToken(refreshToken),
    );
  }

  /**
   * Generates Google OAuth 2.0 Authorization URL with least-privilege Calendar scopes
   */
  getOAuthUrl(): {
    configured: boolean;
    authUrl: string;
    clientId?: string;
    redirectUri?: string;
    scopes: string[];
    message?: string;
  } {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI ||
      'http://localhost:3001/api/ecosystem/oauth/google-calendar/callback';

    const scopes = [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/calendar.readonly',
    ];

    const effectiveClientId = clientId || 'contextforge-google-calendar';
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
      effectiveClientId,
    )}&response_type=code&scope=${encodeURIComponent(
      scopes.join(' '),
    )}&redirect_uri=${encodeURIComponent(
      redirectUri,
    )}&access_type=offline&prompt=consent`;

    return {
      configured: Boolean(clientId),
      authUrl,
      clientId: effectiveClientId,
      redirectUri,
      scopes,
      message: clientId
        ? 'Google OAuth is configured with custom client credentials.'
        : 'Using default Google OAuth authorization endpoint configuration.',
    };
  }

  /**
   * Exchanges Google OAuth authorization code for Access & Refresh Tokens and persists to DB
   */
  async exchangeOAuthCode(code: string): Promise<{
    success: boolean;
    workspaceName: string;
    scopes?: string;
    expiresIn?: number;
  }> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI ||
      'http://localhost:3001/api/ecosystem/oauth/google-calendar/callback';

    if (!clientId || !clientSecret) {
      throw new BadRequestException(
        'Google OAuth credentials (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET) are not configured in backend/.env',
      );
    }

    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }).toString(),
      });

      const data = (await response.json()) as GoogleOAuthTokenResponse;

      if (!response.ok || !data.access_token) {
        throw new BadRequestException(
          data.error_description ||
            data.error ||
            'Failed to exchange Google OAuth authorization code',
        );
      }

      const encryptedAccessToken = this.encryption.encrypt(data.access_token);
      const encryptedRefreshToken = data.refresh_token
        ? this.encryption.encrypt(data.refresh_token)
        : undefined;

      const authConfig = {
        token: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiry: Date.now() + data.expires_in * 1000,
        scope: data.scope,
        workspaceName: 'Google Calendar Account',
      };

      // Upsert into workspace_integrations in PostgreSQL
      await this.db.query(
        `UPDATE workspace_integrations
         SET status = 'connected',
             auth_type = 'oauth2',
             endpoint = 'https://www.googleapis.com/calendar/v3',
             auth_config = $1::jsonb,
             updated_at = NOW()
         WHERE id = 'int-google-calendar-mcp';`,
        [JSON.stringify(authConfig)],
      );

      // Configure in-memory connector immediately
      this.calendarConnector.configure({
        endpoint: 'https://www.googleapis.com/calendar/v3',
        token: data.access_token,
        refreshToken: data.refresh_token,
      });

      this.logger.log(`✨ Google Calendar OAuth connected successfully`);

      return {
        success: true,
        workspaceName: 'Google Calendar Account',
        scopes: data.scope,
        expiresIn: data.expires_in,
      };
    } catch (err: unknown) {
      this.logger.error('Failed to exchange Google OAuth code', err);
      const msg =
        err instanceof Error ? err.message : 'Google OAuth exchange failed';
      throw new BadRequestException(msg);
    }
  }

  /**
   * Refreshes an expired access token using the stored refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<string> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret || !refreshToken) {
      throw new BadRequestException(
        'Missing OAuth credentials or refresh token required for token renewal',
      );
    }

    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          refresh_token: refreshToken,
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'refresh_token',
        }).toString(),
      });

      const data = (await response.json()) as GoogleOAuthTokenResponse;

      if (!response.ok || !data.access_token) {
        throw new BadRequestException(
          data.error_description ||
            data.error ||
            'Failed to refresh Google OAuth access token',
        );
      }

      const encryptedAccessToken = this.encryption.encrypt(data.access_token);

      // Update stored access token in PostgreSQL
      await this.db.query(
        `UPDATE workspace_integrations
         SET auth_config = auth_config || $1::jsonb,
             updated_at = NOW()
         WHERE id = 'int-google-calendar-mcp';`,
        [
          JSON.stringify({
            token: encryptedAccessToken,
            tokenExpiry: Date.now() + (data.expires_in || 3600) * 1000,
          }),
        ],
      );

      this.calendarConnector.setAuthToken(data.access_token);
      return data.access_token;
    } catch (err: unknown) {
      this.logger.error('Failed to refresh Google access token', err);
      const msg =
        err instanceof Error ? err.message : 'Google token refresh failed';
      throw new BadRequestException(msg);
    }
  }

  /**
   * Verifies manual token and persists to DB
   */
  async verifyAndConnectToken(
    token: string,
    refreshToken?: string,
  ): Promise<{
    success: boolean;
    workspaceName: string;
  }> {
    if (!token || !token.trim()) {
      throw new BadRequestException('Access token cannot be empty');
    }

    try {
      const pingRes = await fetch(
        'https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=1',
        {
          headers: {
            Authorization: `Bearer ${token.trim()}`,
            Accept: 'application/json',
          },
        },
      );

      if (!pingRes.ok) {
        throw new BadRequestException(
          `Invalid Google Calendar access token (HTTP ${pingRes.status}). Please ensure the token has proper calendar scopes.`,
        );
      }

      const encryptedToken = this.encryption.encrypt(token.trim());
      const encryptedRefreshToken = refreshToken?.trim()
        ? this.encryption.encrypt(refreshToken.trim())
        : undefined;

      const authConfig = {
        token: encryptedToken,
        refreshToken: encryptedRefreshToken,
        workspaceName: 'Google Calendar Account',
      };

      await this.db.query(
        `UPDATE workspace_integrations
         SET status = 'connected',
             auth_type = 'bearer',
             endpoint = 'https://www.googleapis.com/calendar/v3',
             auth_config = $1::jsonb,
             updated_at = NOW()
         WHERE id = 'int-google-calendar-mcp';`,
        [JSON.stringify(authConfig)],
      );

      this.calendarConnector.configure({
        endpoint: 'https://www.googleapis.com/calendar/v3',
        token: token.trim(),
        refreshToken: refreshToken?.trim(),
      });

      return {
        success: true,
        workspaceName: 'Google Calendar Account',
      };
    } catch (err: unknown) {
      if (err instanceof BadRequestException) throw err;
      const msg =
        err instanceof Error
          ? err.message
          : 'Failed to reach Google Calendar API';
      throw new BadRequestException(msg);
    }
  }
}
