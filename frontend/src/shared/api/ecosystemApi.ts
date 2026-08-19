import { API_BASE_URL, handleApiResponse } from './config';
import type { AgentMetadata, Skill } from '@/shared/types/workspace';

export const ecosystemApi = {
  async getAgents(): Promise<AgentMetadata[]> {
    const res = await fetch(`${API_BASE_URL}/ecosystem/agents`);
    return handleApiResponse<AgentMetadata[]>(res);
  },

  async getSkills(): Promise<Skill[]> {
    const res = await fetch(`${API_BASE_URL}/ecosystem/skills`);
    return handleApiResponse<Skill[]>(res);
  },
};
