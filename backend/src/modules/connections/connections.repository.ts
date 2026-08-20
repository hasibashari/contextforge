import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';

export interface WorkspaceConnectionRow {
  id: string;
  user_id?: string;
  name: string;
  connection_type: 'llm_provider' | 'mcp_server' | 'database' | 'oauth_service';
  provider: string;
  auth_type:
    'api_key' | 'oauth2' | 'connection_string' | 'bearer_token' | 'none';
  endpoint_url?: string;
  config_encrypted: Record<string, any>;
  status: 'active' | 'invalid' | 'testing' | 'disabled';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class ConnectionsRepository implements OnModuleInit {
  private readonly logger = new Logger(ConnectionsRepository.name);

  constructor(private readonly db: DatabaseService) {}

  async onModuleInit() {
    await this.ensureTables();
  }

  async ensureTables() {
    try {
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS workspace_connections (
          id VARCHAR(100) PRIMARY KEY,
          user_id UUID,
          name VARCHAR(150) NOT NULL,
          connection_type VARCHAR(50) NOT NULL,
          provider VARCHAR(50) NOT NULL,
          auth_type VARCHAR(50) NOT NULL,
          endpoint_url TEXT,
          config_encrypted JSONB DEFAULT '{}',
          status VARCHAR(30) DEFAULT 'active',
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      this.logger.log('✨ Workspace connections table verified in PostgreSQL');
    } catch (err: unknown) {
      this.logger.error(
        'Failed to initialize workspace_connections table',
        err,
      );
    }
  }

  async getConnections(): Promise<WorkspaceConnectionRow[]> {
    const res = await this.db.query<WorkspaceConnectionRow>(
      `SELECT * FROM workspace_connections ORDER BY created_at ASC;`,
    );
    return res.rows;
  }

  async getConnectionById(id: string): Promise<WorkspaceConnectionRow | null> {
    const res = await this.db.query<WorkspaceConnectionRow>(
      `SELECT * FROM workspace_connections WHERE id = $1;`,
      [id],
    );
    return res.rows[0] || null;
  }

  async createConnection(data: {
    id?: string;
    name: string;
    connectionType: WorkspaceConnectionRow['connection_type'];
    provider: string;
    authType: WorkspaceConnectionRow['auth_type'];
    endpointUrl?: string;
    config?: Record<string, any>;
  }): Promise<WorkspaceConnectionRow> {
    const id =
      data.id ||
      `conn-${data.provider.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`;
    const config = JSON.stringify(data.config || {});

    const res = await this.db.query<WorkspaceConnectionRow>(
      `INSERT INTO workspace_connections (id, name, connection_type, provider, auth_type, endpoint_url, config_encrypted, status, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, 'active', true)
       RETURNING *;`,
      [
        id,
        data.name,
        data.connectionType,
        data.provider,
        data.authType,
        data.endpointUrl || null,
        config,
      ],
    );
    return res.rows[0];
  }

  async updateConnection(
    id: string,
    updates: Partial<WorkspaceConnectionRow>,
  ): Promise<WorkspaceConnectionRow | null> {
    const current = await this.getConnectionById(id);
    if (!current) return null;

    const name = updates.name ?? current.name;
    const connectionType = updates.connection_type ?? current.connection_type;
    const provider = updates.provider ?? current.provider;
    const authType = updates.auth_type ?? current.auth_type;
    const endpointUrl =
      updates.endpoint_url !== undefined
        ? updates.endpoint_url
        : current.endpoint_url;
    const config = updates.config_encrypted
      ? JSON.stringify(updates.config_encrypted)
      : JSON.stringify(current.config_encrypted);
    const status = updates.status ?? current.status;
    const isActive = updates.is_active ?? current.is_active;

    const res = await this.db.query<WorkspaceConnectionRow>(
      `UPDATE workspace_connections
       SET name = $1,
           connection_type = $2,
           provider = $3,
           auth_type = $4,
           endpoint_url = $5,
           config_encrypted = $6::jsonb,
           status = $7,
           is_active = $8,
           updated_at = NOW()
       WHERE id = $9
       RETURNING *;`,
      [
        name,
        connectionType,
        provider,
        authType,
        endpointUrl,
        config,
        status,
        isActive,
        id,
      ],
    );
    return res.rows[0] || null;
  }

  async deleteConnection(id: string): Promise<boolean> {
    const res = await this.db.query(
      `DELETE FROM workspace_connections WHERE id = $1;`,
      [id],
    );
    return (res.rowCount ?? 0) > 0;
  }
}
