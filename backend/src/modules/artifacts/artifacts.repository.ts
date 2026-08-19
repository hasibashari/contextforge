import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';

export interface ArtifactRow {
  id: string;
  session_id?: string;
  type: string;
  title: string;
  content: string;
  location_path?: string;
  service_origin?: string;
  diffs?: any;
  image_url?: string;
  image_prompt?: string;
  word_count: number;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class ArtifactsRepository {
  constructor(private readonly db: DatabaseService) {}

  async getAll(): Promise<ArtifactRow[]> {
    const res = await this.db.query<ArtifactRow>(
      `SELECT * FROM artifacts ORDER BY updated_at DESC;`,
    );
    return res.rows;
  }

  async getById(id: string): Promise<ArtifactRow | null> {
    const res = await this.db.query<ArtifactRow>(
      `SELECT * FROM artifacts WHERE id = $1;`,
      [id],
    );
    return res.rows[0] || null;
  }

  async create(data: {
    sessionId?: string;
    type: string;
    title: string;
    content: string;
    locationPath?: string;
    serviceOrigin?: string;
    diffs?: any;
    imageUrl?: string;
    imagePrompt?: string;
  }): Promise<ArtifactRow> {
    const wordCount = data.content
      ? data.content.split(/\s+/).filter(Boolean).length
      : 0;
    const res = await this.db.query<ArtifactRow>(
      `INSERT INTO artifacts 
        (session_id, type, title, content, location_path, service_origin, diffs, image_url, image_prompt, word_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *;`,
      [
        data.sessionId || null,
        data.type,
        data.title,
        data.content,
        data.locationPath || null,
        data.serviceOrigin || null,
        data.diffs ? JSON.stringify(data.diffs) : null,
        data.imageUrl || null,
        data.imagePrompt || null,
        wordCount,
      ],
    );
    return res.rows[0];
  }

  async update(id: string, content: string): Promise<ArtifactRow | null> {
    const wordCount = content.split(/\s+/).filter(Boolean).length;
    const res = await this.db.query<ArtifactRow>(
      `UPDATE artifacts 
       SET content = $2, word_count = $3, updated_at = NOW() 
       WHERE id = $1 
       RETURNING *;`,
      [id, content, wordCount],
    );
    return res.rows[0] || null;
  }

  async delete(id: string): Promise<void> {
    await this.db.query(`DELETE FROM artifacts WHERE id = $1;`, [id]);
  }
}
