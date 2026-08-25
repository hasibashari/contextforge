import { Injectable, Logger } from '@nestjs/common';
import { AgentsService } from './services/agents.service';
import { SkillsService } from './services/skills.service';
import { IntegrationsService } from './services/integrations.service';
import {
  WorkspaceAgentRow,
  WorkspaceSkillRow,
  WorkspaceIntegrationRow,
  CreateSkillDto,
  CreateIntegrationDto,
} from './ecosystem.types';

/**
 * EcosystemService (Unified Facade)
 *
 * Provides a consolidated interface aggregating the 3 core pillars of the Workspace Ecosystem:
 * 1. AI Agent Personas (AgentsService)
 * 2. SOPs & Skills (SkillsService)
 * 3. MCP Integrations & Tool Discovery (IntegrationsService)
 */
@Injectable()
export class EcosystemService {
  private readonly logger = new Logger(EcosystemService.name);

  constructor(
    private readonly agentsService: AgentsService,
    private readonly skillsService: SkillsService,
    private readonly integrationsService: IntegrationsService,
  ) {}

  // ==========================================
  // 1. AGENT PERSONAS (Delegated)
  // ==========================================

  async getAgents(): Promise<WorkspaceAgentRow[]> {
    return this.agentsService.getAgents();
  }

  async getAgentById(id: string): Promise<WorkspaceAgentRow> {
    return this.agentsService.getAgentById(id);
  }

  async updateAgent(
    id: string,
    updates: Partial<WorkspaceAgentRow>,
  ): Promise<WorkspaceAgentRow> {
    return this.agentsService.updateAgent(id, updates);
  }

  // ==========================================
  // 2. SOPS & SKILLS (Delegated)
  // ==========================================

  async getSkills(): Promise<WorkspaceSkillRow[]> {
    return this.skillsService.getSkills();
  }

  async getSkillById(id: string): Promise<WorkspaceSkillRow> {
    return this.skillsService.getSkillById(id);
  }

  async createSkill(data: CreateSkillDto): Promise<WorkspaceSkillRow> {
    return this.skillsService.createSkill(data);
  }

  async toggleSkill(id: string): Promise<WorkspaceSkillRow> {
    return this.skillsService.toggleSkill(id);
  }

  async getActiveSkillsInstructions(): Promise<
    Array<{ name: string; instructions: string }>
  > {
    return this.skillsService.getActiveSkillsInstructions();
  }

  // ==========================================
  // 3. MCP INTEGRATIONS & TOOLS (Delegated)
  // ==========================================

  async getIntegrations(): Promise<WorkspaceIntegrationRow[]> {
    return this.integrationsService.getIntegrations();
  }

  async createIntegration(
    data: CreateIntegrationDto,
  ): Promise<WorkspaceIntegrationRow> {
    return this.integrationsService.createIntegration(data);
  }

  async updateIntegration(
    id: string,
    updates: Partial<WorkspaceIntegrationRow>,
  ): Promise<WorkspaceIntegrationRow> {
    return this.integrationsService.updateIntegration(id, updates);
  }

  async discoverTools(id: string): Promise<{
    id: string;
    tools: any[];
    latencyMs: number;
    message: string;
  }> {
    return this.integrationsService.discoverTools(id);
  }

  async testIntegration(id: string): Promise<{
    id: string;
    status: 'connected' | 'error';
    latencyMs: number;
    message: string;
  }> {
    return this.integrationsService.testIntegration(id);
  }

  async deleteIntegration(id: string): Promise<boolean> {
    return this.integrationsService.deleteIntegration(id);
  }

  async executeTool(
    toolName: string,
    args: Record<string, unknown> = {},
  ): Promise<{
    success: boolean;
    data?: any;
    summary: string;
    error?: string;
  }> {
    return this.integrationsService.executeTool(toolName, args);
  }
}
