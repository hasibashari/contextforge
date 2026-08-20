import { Injectable, NotFoundException } from '@nestjs/common';
import {
  EcosystemRepository,
  WorkspaceAgentRow,
  WorkspaceSkillRow,
  WorkspaceIntegrationRow,
  WorkspacePluginRow,
} from './ecosystem.repository';

@Injectable()
export class EcosystemService {
  constructor(private readonly repo: EcosystemRepository) {}

  // ==========================================
  // AGENTS
  // ==========================================

  async getAgents(): Promise<WorkspaceAgentRow[]> {
    return this.repo.getAgents();
  }

  async getAgentById(id: string): Promise<WorkspaceAgentRow> {
    const agent = await this.repo.getAgentById(id);
    if (!agent) {
      throw new NotFoundException(`Agent with ID "${id}" not found`);
    }
    return agent;
  }

  async updateAgent(
    id: string,
    updates: Partial<WorkspaceAgentRow>,
  ): Promise<WorkspaceAgentRow> {
    const updated = await this.repo.updateAgent(id, updates);
    if (!updated) {
      throw new NotFoundException(`Agent with ID "${id}" not found`);
    }
    return updated;
  }

  // ==========================================
  // SKILLS
  // ==========================================

  async getSkills(): Promise<WorkspaceSkillRow[]> {
    return this.repo.getSkills();
  }

  async createSkill(data: {
    name: string;
    description: string;
    category: WorkspaceSkillRow['category'];
    sopSummary: string;
    instructions: string;
    assignedTools: string[];
    icon?: string;
  }): Promise<WorkspaceSkillRow> {
    return this.repo.createSkill(data);
  }

  async toggleSkill(id: string): Promise<WorkspaceSkillRow> {
    const toggled = await this.repo.toggleSkill(id);
    if (!toggled) {
      throw new NotFoundException(`Skill with ID "${id}" not found`);
    }
    return toggled;
  }

  // ==========================================
  // MCP INTEGRATIONS
  // ==========================================

  async getIntegrations(): Promise<WorkspaceIntegrationRow[]> {
    return this.repo.getIntegrations();
  }

  async createIntegration(data: {
    name: string;
    category: WorkspaceIntegrationRow['category'];
    endpoint: string;
    description: string;
    transport?: 'stdio' | 'sse' | 'rest';
    tools?: any[];
  }): Promise<WorkspaceIntegrationRow> {
    return this.repo.createIntegration(data);
  }

  async updateIntegration(
    id: string,
    updates: Partial<WorkspaceIntegrationRow>,
  ): Promise<WorkspaceIntegrationRow> {
    const updated = await this.repo.updateIntegration(id, updates);
    if (!updated) {
      throw new NotFoundException(
        `Integration connector with ID "${id}" not found`,
      );
    }
    return updated;
  }

  async deleteIntegration(id: string): Promise<boolean> {
    const deleted = await this.repo.deleteIntegration(id);
    if (!deleted) {
      throw new NotFoundException(
        `Integration connector with ID "${id}" not found`,
      );
    }
    return true;
  }

  // ==========================================
  // PLUGINS
  // ==========================================

  async getPlugins(): Promise<WorkspacePluginRow[]> {
    return this.repo.getPlugins();
  }

  async installPlugin(id: string): Promise<WorkspacePluginRow> {
    const plugin = await this.repo.getPluginById(id);
    if (!plugin) {
      throw new NotFoundException(`Plugin with ID "${id}" not found`);
    }

    const updated = await this.repo.setPluginInstalled(id, true);

    // Auto-enable bundled skills
    if (plugin.bundled_skill_ids && plugin.bundled_skill_ids.length > 0) {
      for (const skillId of plugin.bundled_skill_ids) {
        await this.repo.setSkillEnabled(skillId, true);
      }
    }

    return updated!;
  }

  async uninstallPlugin(id: string): Promise<WorkspacePluginRow> {
    const updated = await this.repo.setPluginInstalled(id, false);
    if (!updated) {
      throw new NotFoundException(`Plugin with ID "${id}" not found`);
    }
    return updated;
  }
}
