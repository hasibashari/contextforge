import { Injectable } from '@nestjs/common';
import {
  KnowledgeRepository,
  KnowledgeSourceRow,
} from './knowledge.repository';

@Injectable()
export class KnowledgeService {
  constructor(private readonly repo: KnowledgeRepository) {}

  async getAllSources(): Promise<KnowledgeSourceRow[]> {
    return this.repo.getAllSources();
  }

  async createSource(data: {
    type: string;
    name: string;
    description: string;
    location: string;
    meta?: string;
    iconType?: string;
    color?: string;
  }): Promise<KnowledgeSourceRow> {
    return this.repo.createSource(data);
  }

  async deleteSource(id: string): Promise<{ success: boolean }> {
    await this.repo.deleteSource(id);
    return { success: true };
  }
}
