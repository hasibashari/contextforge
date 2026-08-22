import { Injectable } from '@nestjs/common';
import {
  PersonalHubRepository,
  UserMemoryRow,
} from './personal-hub.repository';

@Injectable()
export class PersonalHubService {
  constructor(private readonly repo: PersonalHubRepository) {}

  async getUserMemories(): Promise<UserMemoryRow[]> {
    return this.repo.getUserMemories();
  }

  async createUserMemory(data: {
    category: 'profile' | 'preference' | 'project' | 'workflow';
    key: string;
    value: string;
  }): Promise<UserMemoryRow> {
    return this.repo.createUserMemory(data);
  }

  async deleteUserMemory(id: string): Promise<{ success: boolean }> {
    await this.repo.deleteUserMemory(id);
    return { success: true };
  }
}
