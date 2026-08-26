import { API_BASE_URL, handleApiResponse, getApiHeaders } from './config';
import type { Artifact } from '@/shared/types/workspace';

export interface BackendArtifact {
  id: string;
  session_id?: string;
  type: Artifact['type'];
  title: string;
  content: string;
  location_path?: string;
  service_origin?: Artifact['serviceOrigin'];
  diffs?: unknown;
  image_url?: string;
  image_prompt?: string;
  word_count: number;
  created_at: string;
  updated_at: string;
}

export function mapBackendArtifact(a: BackendArtifact): Artifact {
  return {
    id: a.id,
    type: a.type,
    title: a.title,
    content: a.content,
    locationPath: a.location_path,
    serviceOrigin: a.service_origin || 'obsidian',
    diffs: a.diffs as Artifact['diffs'],
    imageUrl: a.image_url,
    imagePrompt: a.image_prompt,
    wordCount: a.word_count,
    createdAt: new Date(a.created_at).toLocaleDateString(),
    updatedAt: new Date(a.updated_at).toLocaleDateString(),
  };
}

export const artifactsApi = {
  async getAll(): Promise<Artifact[]> {
    const res = await fetch(`${API_BASE_URL}/artifacts`, {
      headers: getApiHeaders(),
    });
    const data = await handleApiResponse<BackendArtifact[]>(res);
    return data.map(mapBackendArtifact);
  },

  async getById(id: string): Promise<Artifact> {
    const res = await fetch(`${API_BASE_URL}/artifacts/${id}`, {
      headers: getApiHeaders(),
    });
    const data = await handleApiResponse<BackendArtifact>(res);
    return mapBackendArtifact(data);
  },

  async updateContent(id: string, content: string): Promise<Artifact> {
    const res = await fetch(`${API_BASE_URL}/artifacts/${id}`, {
      method: 'PUT',
      headers: getApiHeaders(),
      body: JSON.stringify({ content }),
    });
    const data = await handleApiResponse<BackendArtifact>(res);
    return mapBackendArtifact(data);
  },

  async delete(id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/artifacts/${id}`, {
      method: 'DELETE',
      headers: getApiHeaders(),
    });
    await handleApiResponse<{ success: boolean }>(res);
  },
};
