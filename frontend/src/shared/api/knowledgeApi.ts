import { API_BASE_URL, handleApiResponse } from './config';
import type { KnowledgeSource } from '@/shared/types/workspace';

export interface BackendKnowledgeSource {
  id: string;
  user_id?: string;
  type: KnowledgeSource['type'];
  name: string;
  description: string;
  location: string;
  meta?: string;
  files_count: number;
  chunks_count: number;
  status: 'synced' | 'syncing' | 'error';
  icon_type: KnowledgeSource['iconType'];
  color: string;
  last_synced: string;
}

export function mapBackendSource(s: BackendKnowledgeSource): KnowledgeSource {
  return {
    id: s.id,
    type: s.type,
    name: s.name,
    description: s.description,
    location: s.location,
    meta: s.meta || '',
    filesCount: s.files_count,
    chunksCount: s.chunks_count,
    status: s.status,
    iconType: s.icon_type || 'file',
    color: s.color || 'text-primary',
    lastSynced: new Date(s.last_synced).toLocaleDateString(),
  };
}

export const knowledgeApi = {
  async getAllSources(): Promise<KnowledgeSource[]> {
    const res = await fetch(`${API_BASE_URL}/knowledge/sources`);
    const data = await handleApiResponse<BackendKnowledgeSource[]>(res);
    return data.map(mapBackendSource);
  },

  async createSource(source: Partial<KnowledgeSource>): Promise<KnowledgeSource> {
    const res = await fetch(`${API_BASE_URL}/knowledge/sources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(source),
    });
    const data = await handleApiResponse<BackendKnowledgeSource>(res);
    return mapBackendSource(data);
  },

  async deleteSource(id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/knowledge/sources/${id}`, { method: 'DELETE' });
    await handleApiResponse<{ success: boolean }>(res);
  },
};
