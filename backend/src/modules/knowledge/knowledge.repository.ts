import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';

export interface KnowledgeSourceRow {
  id: string;
  user_id?: string;
  type: string;
  name: string;
  description: string;
  location: string;
  meta?: string;
  files_count: number;
  chunks_count: number;
  status: 'synced' | 'syncing' | 'error';
  icon_type: string;
  color: string;
  last_synced: string;
}

@Injectable()
export class KnowledgeRepository {
  constructor(private readonly db: DatabaseService) {}

  async getAllSources(): Promise<KnowledgeSourceRow[]> {
    const res = await this.db.query<KnowledgeSourceRow>(
      `SELECT * FROM knowledge_sources ORDER BY last_synced DESC;`,
    );
    return res.rows;
  }

  async getSourceById(id: string): Promise<KnowledgeSourceRow | null> {
    const res = await this.db.query<KnowledgeSourceRow>(
      `SELECT * FROM knowledge_sources WHERE id = $1;`,
      [id],
    );
    return res.rows[0] || null;
  }

  async createSource(data: {
    type: string;
    name: string;
    description: string;
    location: string;
    meta?: string;
    iconType?: string;
    color?: string;
  }): Promise<KnowledgeSourceRow> {
    const res = await this.db.query<KnowledgeSourceRow>(
      `INSERT INTO knowledge_sources (type, name, description, location, meta, icon_type, color, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'synced')
       RETURNING *;`,
      [
        data.type,
        data.name,
        data.description,
        data.location,
        data.meta || '',
        data.iconType || 'file',
        data.color || 'text-primary',
      ],
    );
    return res.rows[0];
  }

  async deleteSource(id: string): Promise<void> {
    await this.db.query(`DELETE FROM knowledge_sources WHERE id = $1;`, [id]);
  }
}
