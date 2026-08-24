import { Injectable, NotFoundException } from '@nestjs/common';
import { ArtifactsRepository, ArtifactRow } from './artifacts.repository';

@Injectable()
export class ArtifactsService {
  constructor(private readonly repo: ArtifactsRepository) {}

  async getAll(): Promise<ArtifactRow[]> {
    return this.repo.getAll();
  }

  async getById(id: string): Promise<ArtifactRow> {
    const art = await this.repo.getById(id);
    if (!art) throw new NotFoundException(`Artifact ${id} not found`);
    return art;
  }

  async updateContent(id: string, content: string): Promise<ArtifactRow> {
    const art = await this.repo.update(id, content);
    if (!art) throw new NotFoundException(`Artifact ${id} not found`);
    return art;
  }

  async delete(id: string): Promise<{ success: boolean }> {
    await this.repo.delete(id);
    return { success: true };
  }
}
