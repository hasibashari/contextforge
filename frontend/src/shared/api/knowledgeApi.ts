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
  status: 'synced' | 'syncing' | 'disconnected' | 'error';
  icon_type: KnowledgeSource['iconType'];
  color: string;
  last_synced: string;
}

export interface BackendKnowledgeChunk {
  id: string;
  source_id: string;
  file_path: string;
  chunk_index: number;
  chunk_content: string;
  embedding: number[];
  metadata?: Record<string, unknown>;
  created_at: string;
  source_name?: string;
  source_type?: string;
}

export interface SearchKnowledgeResult extends BackendKnowledgeChunk {
  similarity: number;
}

export function mapBackendSource(s: BackendKnowledgeSource): KnowledgeSource {
  if (!s) {
    return {
      id: `fallback-${Date.now()}`,
      type: 'document_upload',
      name: 'Knowledge Source',
      description: '',
      location: '',
      meta: '',
      filesCount: 0,
      chunksCount: 0,
      status: 'synced',
      iconType: 'file',
      color: 'text-primary',
      lastSynced: 'Just now',
    };
  }
  return {
    id: s.id,
    type: s.type || 'document_upload',
    name: s.name || 'Untitled Source',
    description: s.description || '',
    location: s.location || '',
    meta: s.meta || '',
    filesCount: s.files_count ?? 0,
    chunksCount: s.chunks_count ?? 0,
    status: s.status || 'synced',
    iconType: s.icon_type || 'file',
    color: s.color || 'text-primary',
    lastSynced: s.last_synced
      ? new Date(s.last_synced).toLocaleDateString()
      : 'Just now',
  };
}

export const knowledgeApi = {
  async getAllSources(): Promise<KnowledgeSource[]> {
    const res = await fetch(`${API_BASE_URL}/knowledge/sources`);
    const data = await handleApiResponse<BackendKnowledgeSource[]>(res);
    return (data || []).map(mapBackendSource);
  },

  async getSourceById(id: string): Promise<KnowledgeSource> {
    const res = await fetch(`${API_BASE_URL}/knowledge/sources/${id}`);
    const data = await handleApiResponse<BackendKnowledgeSource>(res);
    return mapBackendSource(data);
  },

  async createSource(source: {
    type: string;
    name: string;
    description: string;
    location: string;
    meta?: string;
    iconType?: string;
    color?: string;
  }): Promise<KnowledgeSource> {
    const res = await fetch(`${API_BASE_URL}/knowledge/sources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(source),
    });
    const data = await handleApiResponse<BackendKnowledgeSource>(res);
    return mapBackendSource(data);
  },

  async uploadDocuments(
    files: File[],
    name: string,
    sourceId?: string,
  ): Promise<KnowledgeSource> {
    const formData = new FormData();
    for (const file of files) {
      formData.append('files', file);
    }
    formData.append('name', name);
    if (sourceId) {
      formData.append('sourceId', sourceId);
    }

    const res = await fetch(`${API_BASE_URL}/knowledge/upload`, {
      method: 'POST',
      body: formData,
    });
    const data = await handleApiResponse<BackendKnowledgeSource>(res);
    return mapBackendSource(data);
  },

  async ingestDocumentsDirectly(payload: {
    sourceId?: string;
    name: string;
    type: string;
    location: string;
    description?: string;
    documents: Array<{
      filePath: string;
      title: string;
      content: string;
    }>;
  }): Promise<KnowledgeSource> {
    const res = await fetch(`${API_BASE_URL}/knowledge/ingest-documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await handleApiResponse<BackendKnowledgeSource>(res);
    return mapBackendSource(data);
  },

  async syncSource(
    id: string,
  ): Promise<{ success: boolean; chunksCount: number; filesCount: number }> {
    const res = await fetch(`${API_BASE_URL}/knowledge/sources/${id}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleApiResponse<{
      success: boolean;
      chunksCount: number;
      filesCount: number;
    }>(res);
  },

  async getSourceChunks(
    id: string,
    limit = 50,
  ): Promise<BackendKnowledgeChunk[]> {
    const res = await fetch(
      `${API_BASE_URL}/knowledge/sources/${id}/chunks?limit=${limit}`,
    );
    const data = await handleApiResponse<BackendKnowledgeChunk[]>(res);
    return data || [];
  },

  async searchKnowledge(
    query: string,
    limit = 5,
  ): Promise<SearchKnowledgeResult[]> {
    const res = await fetch(
      `${API_BASE_URL}/knowledge/search?q=${encodeURIComponent(query)}&limit=${limit}`,
    );
    const data = await handleApiResponse<SearchKnowledgeResult[]>(res);
    return data || [];
  },

  async updateSourceStatus(
    id: string,
    status: 'synced' | 'disconnected',
  ): Promise<KnowledgeSource> {
    const res = await fetch(`${API_BASE_URL}/knowledge/sources/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const data = await handleApiResponse<BackendKnowledgeSource>(res);
    return mapBackendSource(data);
  },

  async deleteSource(id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/knowledge/sources/${id}`, {
      method: 'DELETE',
    });
    await handleApiResponse<{ success: boolean }>(res);
  },
};
