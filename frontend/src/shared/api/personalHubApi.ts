import { API_BASE_URL, handleApiResponse, getApiHeaders } from './config';
import type { UserMemoryItem } from '@/shared/types/workspace';

export interface BackendUserMemory {
  id: string;
  user_id?: string;
  category: 'profile' | 'preference' | 'project' | 'workflow';
  key: string;
  value: string;
  updated_at: string;
}

export const personalHubApi = {
  // Memories
  async getUserMemories(): Promise<UserMemoryItem[]> {
    const res = await fetch(`${API_BASE_URL}/personal-hub/memories`, {
      headers: getApiHeaders(),
    });
    const data = await handleApiResponse<BackendUserMemory[]>(res);
    return data.map((m) => ({
      id: m.id,
      category: m.category,
      key: m.key,
      value: m.value,
      lastUpdated: new Date(m.updated_at).toLocaleDateString(),
    }));
  },

  async createUserMemory(memory: {
    category: 'profile' | 'preference' | 'project' | 'workflow';
    key: string;
    value: string;
  }): Promise<UserMemoryItem> {
    const res = await fetch(`${API_BASE_URL}/personal-hub/memories`, {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify(memory),
    });
    const m = await handleApiResponse<BackendUserMemory>(res);
    return {
      id: m.id,
      category: m.category,
      key: m.key,
      value: m.value,
      lastUpdated: 'Just now',
    };
  },

  async getMemorySummary(): Promise<string> {
    const res = await fetch(`${API_BASE_URL}/personal-hub/memory-summary`, {
      headers: getApiHeaders(),
    });
    const data = await handleApiResponse<{ summary: string }>(res);
    return data.summary || '';
  },

  async clearAllMemories(): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/personal-hub/memories`, {
      method: 'DELETE',
      headers: getApiHeaders(),
    });
    await handleApiResponse<{ success: boolean }>(res);
  },

  async deleteUserMemory(id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/personal-hub/memories/${id}`, {
      method: 'DELETE',
      headers: getApiHeaders(),
    });
    await handleApiResponse<{ success: boolean }>(res);
  },
};
