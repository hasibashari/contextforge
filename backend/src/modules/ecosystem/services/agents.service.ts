import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { EcosystemRepository } from '../ecosystem.repository';
import { WorkspaceAgentRow } from '../ecosystem.types';

@Injectable()
export class AgentsService {
  private readonly logger = new Logger(AgentsService.name);

  constructor(private readonly repo: EcosystemRepository) {}

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
}
