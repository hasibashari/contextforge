import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
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
      message: `Skill "${data.name}" created successfully`,
    };
  }

  @Patch('skills/:id/toggle')
  async toggleSkill(@Param('id') id: string) {
    const data = await this.service.toggleSkill(id);
    return {
      success: true,
      data,
      message: `Skill ${id} status changed to ${data.enabled ? 'enabled' : 'disabled'}`,
    };
  }

  // ==========================================
  // MCP INTEGRATIONS & TOOLS
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
      connectionId?: string;
      name: string;
      category: WorkspaceIntegrationRow['category'];
      endpoint: string;
      description: string;
      transport?: 'stdio' | 'sse' | 'rest';
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
}
