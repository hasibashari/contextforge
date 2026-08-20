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
import type {
  WorkspaceAgentRow,
  WorkspaceSkillRow,
  WorkspaceIntegrationRow,
} from './ecosystem.repository';

@Controller('api/ecosystem')
export class EcosystemController {
  constructor(private readonly service: EcosystemService) {}

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
  // NOTION OAUTH 2.0 ENDPOINTS
  // ==========================================

  @Get('oauth/notion/authorize')
  getNotionOAuthUrl() {
    const res = this.service.getNotionOAuthUrl();
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

    try {
      const result = await this.service.exchangeNotionOAuthCode(code);
      res.setHeader('Content-Type', 'text/html');
      return res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Notion Connected - ContextForge</title>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; text-align: center; padding: 50px; background: #0b0f19; color: #f8fafc; }
              .card { background: #161e2e; border: 1px solid #334155; border-radius: 16px; padding: 32px; max-width: 420px; margin: auto; }
              .success { color: #10b981; font-size: 24px; font-weight: bold; margin-bottom: 8px; }
              .ws { color: #60a5fa; font-weight: 600; font-size: 16px; margin: 12px 0; }
              .hint { color: #64748b; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="success">✨ Notion Connected!</div>
              <p style="color: #cbd5e1; font-size: 14px;">Your workspace is now paired with ContextForge MCP.</p>
              <div class="ws">Workspace: ${result.workspaceName}</div>
              <p class="hint">This window will close automatically...</p>
            </div>
            <script>
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'NOTION_AUTH_SUCCESS', 
                  workspaceName: ${JSON.stringify(result.workspaceName)}
                }, '*');
                setTimeout(() => window.close(), 1000);
              } else {
                setTimeout(() => { window.location.href = '/integrations?oauth=success'; }, 1500);
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
          <head><title>Notion Authorization Error</title></head>
          <body style="font-family: system-ui, sans-serif; text-align: center; padding: 48px; background: #0b0f19; color: #f87171;">
            <h2>❌ Connection Failed</h2>
            <p style="color: #cbd5e1;">${msg}</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'NOTION_AUTH_ERROR', error: ${JSON.stringify(msg)} }, '*');
                setTimeout(() => window.close(), 2500);
              }
            </script>
          </body>
        </html>
      `);
    }
  }

  @Post('oauth/notion/token')
  async connectNotionToken(
    @Body() body: { token: string; workspaceName?: string },
  ) {
    const data = await this.service.verifyAndConnectNotionToken(
      body.token,
      body.workspaceName,
    );
    return {
      success: true,
      data,
      message: `Notion workspace "${data.workspaceName}" connected successfully`,
    };
  }
}
