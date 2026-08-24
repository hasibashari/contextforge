import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { EcosystemRepository } from '../ecosystem.repository';
import { WorkspaceSkillRow, CreateSkillDto } from '../ecosystem.types';

@Injectable()
export class SkillsService {
  private readonly logger = new Logger(SkillsService.name);

  constructor(private readonly repo: EcosystemRepository) {}

  async getSkills(): Promise<WorkspaceSkillRow[]> {
    return this.repo.getSkills();
  }

  async getSkillById(id: string): Promise<WorkspaceSkillRow> {
    const skill = await this.repo.getSkillById(id);
    if (!skill) {
      throw new NotFoundException(`Skill with ID "${id}" not found`);
    }
    return skill;
  }

  async createSkill(data: CreateSkillDto): Promise<WorkspaceSkillRow> {
    return this.repo.createSkill(data);
  }

  async toggleSkill(id: string): Promise<WorkspaceSkillRow> {
    const toggled = await this.repo.toggleSkill(id);
    if (!toggled) {
      throw new NotFoundException(`Skill with ID "${id}" not found`);
    }
    return toggled;
  }

  async getActiveSkillsInstructions(): Promise<
    Array<{ name: string; instructions: string }>
  > {
    const active = await this.repo.getActiveSkills();
    return active.map((s) => ({
      name: s.name,
      instructions: s.instructions,
    }));
  }
}
