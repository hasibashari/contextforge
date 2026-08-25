import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Res,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import type { Response } from 'express';
import { McpRegistryService } from '../core';

@Controller('api/mcp/oauth')
export class McpOAuthController {
  constructor(private readonly registry: McpRegistryService) {}

  @Get(':provider/authorize')
  getAuthorizeUrl(@Param('provider') provider: string) {
    const handler = this.registry.getOAuthHandler(provider);
    if (!handler) {
      throw new NotFoundException(
        `OAuth provider "${provider}" is not registered in MCP Registry.`,
      );
    }

    const data = handler.getOAuthUrl();
    return {
      success: true,
      data,
    };
  }

  @Get(':provider/callback')
  async handleCallback(
    @Param('provider') provider: string,
    @Query('code') code: string,
    @Query('error') error: string,
    @Res() res: Response,
  ) {
    const handler = this.registry.getOAuthHandler(provider);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    if (!handler) {
      res.setHeader('Content-Type', 'text/html');
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
          <body style="font-family: system-ui, sans-serif; text-align: center; padding: 48px; background: #0b0f19; color: #f87171;">
            <h2>❌ Unknown OAuth Provider</h2>
            <p style="color: #94a3b8;">Provider "${provider}" is not registered.</p>
          </body>
        </html>
      `);
    }

    if (error || !code) {
      res.setHeader('Content-Type', 'text/html');
      return res.send(`
        <!DOCTYPE html>
        <html>
          <head><title>${provider} Authorization Cancelled</title></head>
          <body style="font-family: system-ui, sans-serif; text-align: center; padding: 48px; background: #0b0f19; color: #f87171;">
            <h2>⚠️ Authorization Cancelled</h2>
            <p style="color: #94a3b8;">${error || 'No authorization code returned'}</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'MCP_AUTH_ERROR', provider: '${provider}', error: '${error || 'Cancelled'}' }, '*');
                setTimeout(() => window.close(), 1500);
              }
            </script>
          </body>
        </html>
      `);
    }

    try {
      const result = await handler.exchangeOAuthCode(code);
      const displayName = result.workspaceName || result.email || provider;

      res.setHeader('Content-Type', 'text/html');
      return res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${provider} Connected - ContextForge</title>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; text-align: center; padding: 50px; background: #0b0f19; color: #f8fafc; }
              .card { background: #161e2e; border: 1px solid #334155; border-radius: 16px; padding: 32px; max-width: 440px; margin: auto; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
              .success { color: #10b981; font-size: 24px; font-weight: bold; margin-bottom: 8px; }
              .ws { color: #60a5fa; font-weight: 600; font-size: 16px; margin: 16px 0; background: #1e293b; padding: 10px; border-radius: 8px; }
              .hint { color: #64748b; font-size: 12px; margin-top: 16px; }
              .btn { display: inline-block; background: #3b82f6; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 13px; margin-top: 16px; }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="success">✨ ${provider} Connected!</div>
              <p style="color: #cbd5e1; font-size: 14px;">Your ${provider} integration is now paired with ContextForge MCP.</p>
              <div class="ws">🔗 ${displayName}</div>
              <a href="${frontendUrl}/integrations" class="btn">Return to ContextForge</a>
              <p class="hint">Redirecting back to dashboard automatically...</p>
            </div>
            <script>
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'MCP_AUTH_SUCCESS', 
                  provider: '${provider}',
                  account: ${JSON.stringify(result)}
                }, '*');
                setTimeout(() => window.close(), 1200);
              } else {
                setTimeout(() => { window.location.href = '${frontendUrl}/integrations?oauth=${provider}_success'; }, 1500);
              }
            </script>
          </body>
        </html>
      `);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'OAuth exchange failed';
      res.setHeader('Content-Type', 'text/html');
      return res.send(`
        <!DOCTYPE html>
        <html>
          <head><title>${provider} Authorization Error</title></head>
          <body style="font-family: system-ui, sans-serif; text-align: center; padding: 48px; background: #0b0f19; color: #f87171;">
            <div style="background: #161e2e; border: 1px solid #334155; border-radius: 16px; padding: 32px; max-width: 440px; margin: auto;">
              <h2>❌ Connection Failed</h2>
              <p style="color: #cbd5e1; font-size: 14px;">${msg}</p>
              <a href="${frontendUrl}/integrations" style="display: inline-block; background: #3b82f6; color: white; padding: 8px 16px; border-radius: 8px; text-decoration: none; font-size: 13px; margin-top: 16px;">Back to Integrations</a>
            </div>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'MCP_AUTH_ERROR', provider: '${provider}', error: ${JSON.stringify(msg)} }, '*');
                setTimeout(() => window.close(), 2500);
              }
            </script>
          </body>
        </html>
      `);
    }
  }

  @Post(':provider/token')
  async connectToken(
    @Param('provider') provider: string,
    @Body()
    body: {
      token: string;
      param?: string;
      workspaceName?: string;
      refreshToken?: string;
    },
  ) {
    const handler = this.registry.getOAuthHandler(provider);
    if (!handler) {
      throw new NotFoundException(
        `OAuth provider "${provider}" is not registered in MCP Registry.`,
      );
    }

    if (!body.token) {
      throw new BadRequestException(
        `Token is required to connect ${provider}.`,
      );
    }

    const additionalParam =
      body.param || body.workspaceName || body.refreshToken;
    const data = await handler.verifyAndConnectToken(
      body.token,
      additionalParam,
    );

    return {
      success: true,
      data,
      message: `${provider} connected successfully`,
    };
  }
}
