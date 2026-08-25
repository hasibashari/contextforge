import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { EcosystemService } from './ecosystem.service';
import { NotionOAuthService } from '../../mcp/connectors/notion/notion-oauth.service';
import { GoogleCalendarOAuthService } from '../../mcp/connectors/google-calendar/google-calendar-oauth.service';
import type {
  WorkspaceAgentRow,
  WorkspaceSkillRow,
  WorkspaceIntegrationRow,
} from './ecosystem.repository';

@Controller('api/ecosystem')
export class EcosystemController {
  constructor(
    private readonly service: EcosystemService,
    private readonly notionOAuthService: NotionOAuthService,
    private readonly googleCalendarOAuthService: GoogleCalendarOAuthService,
  ) {}

  // ==========================================
  // AGENTS
  // ==========================================

  @Get('agents')
  async getAgents() {
    const data = await this.service.getAgents();
    return { success: true, data };
  }

  @Get('agents/:id')
  async getAgentById(@Param('id') id: string) {
    const data = await this.service.getAgentById(id);
    return { success: true, data };
  }

  @Patch('agents/:id')
  async updateAgent(
    @Param('id') id: string,
    @Body() updates: Partial<WorkspaceAgentRow>,
  ) {
    const data = await this.service.updateAgent(id, updates);
    return {
      success: true,
      data,
      message: `Agent ${id} configuration updated successfully`,
    };
  }

  // ==========================================
  // SKILLS (SOPs)
  // ==========================================

  @Get('skills')
  async getSkills() {
    const data = await this.service.getSkills();
    return { success: true, data };
  }

  @Get('skills/:id')
  async getSkillById(@Param('id') id: string) {
    const data = await this.service.getSkillById(id);
    return { success: true, data };
  }

  @Post('skills')
  async createSkill(
    @Body()
    body: {
      name: string;
      description: string;
      category: WorkspaceSkillRow['category'];
      sopSummary: string;
      instructions: string;
      assignedTools: string[];
      icon?: string;
    },
  ) {
    const data = await this.service.createSkill(body);
    return {
      success: true,
      data,
      message: `Skill SOP "${data.name}" created successfully`,
    };
  }

  @Patch('skills/:id/toggle')
  async toggleSkill(@Param('id') id: string) {
    const data = await this.service.toggleSkill(id);
    return {
      success: true,
      data,
      message: `Skill "${data.name}" is now ${
        data.enabled ? 'active' : 'disabled'
      }`,
    };
  }

  // ==========================================
  // MCP CONNECTORS / INTEGRATIONS
  // ==========================================

  @Get('integrations')
  async getIntegrations() {
    const data = await this.service.getIntegrations();
    return { success: true, data };
  }

  // Alias for semantic clarity in MCP architecture
  @Get('mcp-tools')
  async getMcpTools() {
    const data = await this.service.getIntegrations();
    return { success: true, data };
  }

  @Post('integrations')
  async createIntegration(
    @Body()
    body: {
      name: string;
      category?: string;
      endpoint: string;
      description: string;
      transport?: 'stdio' | 'streamable_http' | 'sse' | 'rest';
      authType?: 'none' | 'bearer' | 'oauth' | 'api_key';
      authConfig?: {
        token?: string;
        headers?: Record<string, string>;
        env?: Record<string, string>;
      };
      tools?: any[];
    },
  ) {
    const data = await this.service.createIntegration(body);
    return {
      success: true,
      data,
      message: `MCP Server "${data.name}" registered successfully`,
    };
  }

  @Patch('integrations/:id')
  async updateIntegration(
    @Param('id') id: string,
    @Body() updates: Partial<WorkspaceIntegrationRow>,
  ) {
    const data = await this.service.updateIntegration(id, updates);
    return {
      success: true,
      data,
      message: `Integration connector ${id} updated successfully`,
    };
  }

  @Post('integrations/:id/discover')
  async discoverTools(@Param('id') id: string) {
    const data = await this.service.discoverTools(id);
    return {
      success: true,
      data,
      message: data.message,
    };
  }

  @Post('integrations/:id/test')
  async testIntegration(@Param('id') id: string) {
    const data = await this.service.testIntegration(id);
    return {
      success: true,
      data,
      message: data.message,
    };
  }

  @Post('mcp-tools/:id/test')
  async testMcpTool(@Param('id') id: string) {
    const data = await this.service.testIntegration(id);
    return {
      success: true,
      data,
      message: data.message,
    };
  }

  @Delete('integrations/:id')
  async deleteIntegration(@Param('id') id: string) {
    await this.service.deleteIntegration(id);
    return {
      success: true,
      message: `Integration connector ${id} deleted successfully`,
    };
  }

  // ==========================================
  // NOTION OAUTH 2.0 ENDPOINTS (Delegated to McpModule)
  // ==========================================

  @Get('oauth/notion/authorize')
  getNotionOAuthUrl() {
    const res = this.notionOAuthService.getOAuthUrl();
    return {
      success: true,
      data: res,
    };
  }

  @Get('oauth/notion/callback')
  async handleNotionOAuthCallback(
    @Query('code') code: string,
    @Query('error') error: string,
    @Res() res: Response,
  ) {
    if (error || !code) {
      res.setHeader('Content-Type', 'text/html');
      return res.send(`
        <!DOCTYPE html>
        <html>
          <head><title>Notion Authorization Cancelled</title></head>
          <body style="font-family: system-ui, sans-serif; text-align: center; padding: 48px; background: #0b0f19; color: #f87171;">
            <h2>⚠️ Notion Authorization Cancelled</h2>
            <p style="color: #94a3b8;">${error || 'No authorization code returned'}</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'NOTION_AUTH_ERROR', error: '${error || 'Cancelled'}' }, '*');
                setTimeout(() => window.close(), 1500);
              }
            </script>
          </body>
        </html>
      `);
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    try {
      const result = await this.notionOAuthService.exchangeOAuthCode(code);
      return res.redirect(
        `${frontendUrl}/oauth/callback?status=success&provider=notion&account=${encodeURIComponent(
          result.workspaceName || 'Notion Workspace',
        )}`,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'OAuth exchange failed';
      return res.redirect(
        `${frontendUrl}/oauth/callback?status=error&provider=notion&error=${encodeURIComponent(
          msg,
        )}`,
      );
    }
  }

  @Post('oauth/notion/token')
  async connectNotionToken(
    @Body() body: { token: string; workspaceName?: string },
  ) {
    const data = await this.notionOAuthService.verifyAndConnectToken(
      body.token,
      body.workspaceName,
    );
    return {
      success: true,
      data,
      message: `Notion workspace "${data.workspaceName}" connected successfully`,
    };
  }

  // ==========================================
  // GOOGLE CALENDAR OAUTH 2.0 ENDPOINTS
  // ==========================================

  @Get('oauth/google-calendar/authorize')
  getGoogleCalendarOAuthUrl() {
    const res = this.googleCalendarOAuthService.getOAuthUrl();
    return {
      success: true,
      data: res,
    };
  }

  @Get('oauth/google-calendar/callback')
  async handleGoogleCalendarOAuthCallback(
    @Query('code') code: string,
    @Query('error') error: string,
    @Res() res: Response,
  ) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    if (error || !code) {
      return res.redirect(
        `${frontendUrl}/oauth/callback?status=error&provider=google-calendar&error=${encodeURIComponent(
          error || 'No authorization code returned',
        )}`,
      );
    }

    try {
      const result =
        await this.googleCalendarOAuthService.exchangeOAuthCode(code);
      return res.redirect(
        `${frontendUrl}/oauth/callback?status=success&provider=google-calendar&account=${encodeURIComponent(
          result.workspaceName || 'Google Calendar Account',
        )}`,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'OAuth exchange failed';
      return res.redirect(
        `${frontendUrl}/oauth/callback?status=error&provider=google-calendar&error=${encodeURIComponent(
          msg,
        )}`,
      );
    }
  }

  @Post('oauth/google-calendar/token')
  async connectGoogleCalendarToken(
    @Body() body: { token: string; refreshToken?: string },
  ) {
    const data = await this.googleCalendarOAuthService.verifyAndConnectToken(
      body.token,
      body.refreshToken,
    );
    return {
      success: true,
      data,
      message: `Google Calendar connected successfully`,
    };
  }
}
