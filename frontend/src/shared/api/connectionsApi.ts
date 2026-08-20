import { API_BASE_URL, handleApiResponse } from './config';
import type { WorkspaceConnection } from '@/shared/types/workspace';

interface BackendConnection {
  id: string;
  user_id?: string;
  userId?: string;
  name: string;
  connection_type?: WorkspaceConnection['connectionType'];
  connectionType?: WorkspaceConnection['connectionType'];
  provider: WorkspaceConnection['provider'];
  auth_type?: WorkspaceConnection['authType'];
  authType?: WorkspaceConnection['authType'];
  endpoint_url?: string;
  endpointUrl?: string;
  config_encrypted?: Record<string, unknown>;
  configEncrypted?: Record<string, unknown>;
  status?: WorkspaceConnection['status'];
  is_active?: boolean;
  isActive?: boolean;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

function mapConnectionFromBackend(row: BackendConnection): WorkspaceConnection {
  return {
    id: row.id,
    userId: row.user_id || row.userId,
    name: row.name,
    connectionType: row.connection_type || row.connectionType || 'llm_provider',
    provider: row.provider,
    authType: row.auth_type || row.authType || 'api_key',
    endpointUrl: row.endpoint_url || row.endpointUrl,
    configEncrypted: row.config_encrypted || row.configEncrypted || {},
    status: row.status || 'active',
    isActive: row.is_active !== undefined ? row.is_active : row.isActive !== undefined ? row.isActive : true,
    createdAt: row.created_at || row.createdAt,
    updatedAt: row.updated_at || row.updatedAt,
  };
}

export const connectionsApi = {
  async getConnections(): Promise<WorkspaceConnection[]> {
    const res = await fetch(`${API_BASE_URL}/connections`);
    const data = await handleApiResponse<BackendConnection[]>(res);
    return Array.isArray(data) ? data.map(mapConnectionFromBackend) : [];
  },

  async getConnectionById(id: string): Promise<WorkspaceConnection> {
    const res = await fetch(`${API_BASE_URL}/connections/${encodeURIComponent(id)}`);
    const data = await handleApiResponse<BackendConnection>(res);
    return mapConnectionFromBackend(data);
  },

  async createConnection(data: {
    id?: string;
    name: string;
    connectionType: WorkspaceConnection['connectionType'];
    provider: string;
    authType: WorkspaceConnection['authType'];
    endpointUrl?: string;
    config?: Record<string, unknown>;
  }): Promise<WorkspaceConnection> {
    const payload = {
      id: data.id,
      name: data.name,
      connectionType: data.connectionType,
      provider: data.provider,
      authType: data.authType,
      endpointUrl: data.endpointUrl,
      config: data.config,
    };

    const res = await fetch(`${API_BASE_URL}/connections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await handleApiResponse<BackendConnection>(res);
    return mapConnectionFromBackend(result);
  },

  async updateConnection(
    id: string,
    updates: Partial<WorkspaceConnection>
  ): Promise<WorkspaceConnection> {
    const payload: Record<string, unknown> = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.connectionType !== undefined) payload.connectionType = updates.connectionType;
    if (updates.provider !== undefined) payload.provider = updates.provider;
    if (updates.authType !== undefined) payload.authType = updates.authType;
    if (updates.endpointUrl !== undefined) payload.endpointUrl = updates.endpointUrl;
    if (updates.configEncrypted !== undefined) payload.config_encrypted = updates.configEncrypted;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.isActive !== undefined) payload.is_active = updates.isActive;

    const res = await fetch(`${API_BASE_URL}/connections/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await handleApiResponse<BackendConnection>(res);
    return mapConnectionFromBackend(data);
  },

  async testConnection(id: string): Promise<{
    id: string;
    status: 'active' | 'invalid' | 'testing';
    latencyMs: number;
    message: string;
  }> {
    const res = await fetch(`${API_BASE_URL}/connections/${encodeURIComponent(id)}/test`, {
      method: 'POST',
    });
    return handleApiResponse<{
      id: string;
      status: 'active' | 'invalid' | 'testing';
      latencyMs: number;
      message: string;
    }>(res);
  },

  async deleteConnection(id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/connections/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    await handleApiResponse<{ success: boolean }>(res);
  },
};
