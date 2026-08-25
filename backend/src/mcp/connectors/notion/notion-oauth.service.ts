import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { DatabaseService } from '../../../common/database/database.service';
import { EncryptionService } from '../../../common/security/encryption.service';
import { IMcpOAuthHandler } from '../../core';
import { NotionMcpConnector } from './notion-mcp.connector';

@Injectable()
export class NotionOAuthService implements IMcpOAuthHandler {
  private readonly logger = new Logger(NotionOAuthService.name);
  readonly providerId = 'notion';

  constructor(
    private readonly db: DatabaseService,
    private readonly encryption: EncryptionService,
    private readonly notionConnector: NotionMcpConnector,
  ) {}

  /**
   * Generate Notion OAuth 2.0 Authorization URL
   */
  getOAuthUrl(): {
    configured: boolean;
    authUrl: string;
    clientId?: string;
    redirectUri?: string;
    message?: string;
  } {
    const clientId = process.env.NOTION_CLIENT_ID;
    const redirectUri =
      process.env.NOTION_REDIRECT_URI ||
      'http://localhost:3001/api/ecosystem/oauth/notion/callback';

    const effectiveClientId = clientId || 'contextforge-workspace';
    const authUrl = `https://api.notion.com/v1/oauth/authorize?client_id=${encodeURIComponent(
      effectiveClientId,
    )}&response_type=code&owner=user&redirect_uri=${encodeURIComponent(
      redirectUri,
    )}`;

    return {
      configured: Boolean(clientId),
      authUrl,
      clientId: effectiveClientId,
      redirectUri,
      message: clientId
        ? 'Notion OAuth is configured with custom client credentials.'
        : 'Using default Notion OAuth authorization endpoint.',
    };
  }

  /**
   * Exchange Notion OAuth code for Access Token and persist to DB
   */
  async exchangeOAuthCode(code: string): Promise<{
    success: boolean;
    workspaceName: string;
    workspaceId?: string;
    workspaceIcon?: string;
    botId?: string;
  }> {
    const clientId = process.env.NOTION_CLIENT_ID;
    const clientSecret = process.env.NOTION_CLIENT_SECRET;
    const redirectUri =
      process.env.NOTION_REDIRECT_URI ||
      'http://localhost:3001/api/ecosystem/oauth/notion/callback';

    if (!clientId || !clientSecret) {
      throw new BadRequestException(
        'Notion OAuth credentials (NOTION_CLIENT_ID / NOTION_CLIENT_SECRET) are not configured in backend/.env',
      );
    }

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
      'base64',
    );

    try {
      const response = await fetch('https://api.notion.com/v1/oauth/token', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basicAuth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
        }),
      });

      const data = (await response.json()) as {
        access_token?: string;
        workspace_name?: string;
        workspace_id?: string;
        workspace_icon?: string;
        bot_id?: string;
        error?: string;
        error_description?: string;
      };

      if (!response.ok || !data.access_token) {
        throw new BadRequestException(
          data.error_description ||
            data.error ||
            'Failed to exchange Notion OAuth code',
        );
      }

      const workspaceName = data.workspace_name || 'Notion Workspace';
      const encryptedToken = this.encryption.encrypt(data.access_token);

      const authConfig = {
        token: encryptedToken,
        workspaceName,
        workspaceId: data.workspace_id,
        workspaceIcon: data.workspace_icon,
        botId: data.bot_id,
      };

      // Upsert into workspace_integrations in PostgreSQL
      await this.db.query(
        `UPDATE workspace_integrations
         SET status = 'connected',
             auth_type = 'oauth',
             endpoint = 'https://api.notion.com/v1',
             auth_config = $1::jsonb,
             updated_at = NOW()
         WHERE id = 'int-notion-mcp';`,
        [JSON.stringify(authConfig)],
      );

      // Configure in-memory connector immediately
      this.notionConnector.configure({
        endpoint: 'https://api.notion.com/v1',
        token: data.access_token,
      });

      this.logger.log(
        `✨ Notion OAuth connected to workspace: ${workspaceName}`,
      );

      return {
        success: true,
        workspaceName,
        workspaceId: data.workspace_id,
        workspaceIcon: data.workspace_icon,
        botId: data.bot_id,
      };
    } catch (err: unknown) {
      this.logger.error('Failed to exchange Notion OAuth code', err);
      const msg =
        err instanceof Error ? err.message : 'Notion OAuth exchange failed';
      throw new BadRequestException(msg);
    }
  }

  /**
   * Verify manual Notion token and persist to DB
   */
  async verifyAndConnectToken(
    token: string,
    workspaceName?: string,
  ): Promise<{
    success: boolean;
    workspaceName: string;
    bot?: any;
  }> {
    if (!token || !token.trim()) {
      throw new BadRequestException('Token cannot be empty');
    }

    try {
      const res = await fetch('https://api.notion.com/v1/users/me', {
        headers: {
          Authorization: `Bearer ${token.trim()}`,
          'Notion-Version': '2022-06-28',
        },
      });

      if (!res.ok) {
        const errJson = (await res.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new BadRequestException(
          errJson.message ||
            'Invalid Notion token. Please verify your token at notion.so/my-integrations',
        );
      }

      const botData = (await res.json()) as {
        name?: string;
        bot?: { owner?: { type?: string; workspace?: boolean } };
      };

      const resolvedWorkspaceName =
        workspaceName?.trim() || botData.name || 'Notion Workspace';

      const encryptedToken = this.encryption.encrypt(token.trim());
      const authConfig = {
        token: encryptedToken,
        workspaceName: resolvedWorkspaceName,
      };

      await this.db.query(
        `UPDATE workspace_integrations
         SET status = 'connected',
             auth_type = 'bearer',
             endpoint = 'https://api.notion.com/v1',
             auth_config = $1::jsonb,
             updated_at = NOW()
         WHERE id = 'int-notion-mcp';`,
        [JSON.stringify(authConfig)],
      );

      this.notionConnector.configure({
        endpoint: 'https://api.notion.com/v1',
        token: token.trim(),
      });

      return {
        success: true,
        workspaceName: resolvedWorkspaceName,
        bot: botData,
      };
    } catch (err: unknown) {
      if (err instanceof BadRequestException) throw err;
      const msg =
        err instanceof Error ? err.message : 'Failed to reach Notion API';
      throw new BadRequestException(msg);
    }
  }
}
