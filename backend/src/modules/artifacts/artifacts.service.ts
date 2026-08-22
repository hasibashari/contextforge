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
    const art = await this.repo.getById(id);
    if (art?.location_path) {
      try {
        const fs = await import('fs/promises');
        if (await fs.stat(art.location_path).catch(() => null)) {
          await fs.unlink(art.location_path).catch(() => null);
        }
      } catch {
        // Silently handle filesystem unlink if file was already moved/deleted on disk
      }
    }
    await this.repo.delete(id);
    return { success: true };
  }
}
