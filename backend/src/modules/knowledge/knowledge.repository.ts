import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';

export interface KnowledgeSourceRow {
  id: string;
  user_id?: string;
  guest_id?: string;
  type: string;
  name: string;
  description: string;
  location: string;
  meta?: string;
  files_count: number;
  chunks_count: number;
  status: 'synced' | 'syncing' | 'disconnected' | 'error';
  icon_type: string;
  color: string;
  last_synced: string;
}

export interface KnowledgeChunkRow {
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

export interface SearchResultChunk extends KnowledgeChunkRow {
  similarity: number;
}

@Injectable()
export class KnowledgeRepository implements OnModuleInit {
  private readonly logger = new Logger(KnowledgeRepository.name);

  constructor(private readonly db: DatabaseService) {}

  async onModuleInit() {
    await this.ensureTables();
  }

  async ensureTables() {
    try {
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS knowledge_sources (
          id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
          user_id UUID,
          guest_id VARCHAR(100) DEFAULT 'default_guest',
          type VARCHAR(50) NOT NULL,
          name VARCHAR(150) NOT NULL,
          description TEXT,
          location TEXT NOT NULL,
          meta TEXT,
          files_count INTEGER DEFAULT 0,
          chunks_count INTEGER DEFAULT 0,
          status VARCHAR(30) DEFAULT 'synced',
          icon_type VARCHAR(50) DEFAULT 'file',
          color VARCHAR(50) DEFAULT 'text-primary',
          last_synced TIMESTAMPTZ DEFAULT NOW(),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        ALTER TABLE knowledge_sources ADD COLUMN IF NOT EXISTS guest_id VARCHAR(100) DEFAULT 'default_guest';
        CREATE INDEX IF NOT EXISTS idx_knowledge_sources_guest ON knowledge_sources(guest_id);

        CREATE TABLE IF NOT EXISTS knowledge_chunks (
          id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
          source_id VARCHAR(100) REFERENCES knowledge_sources(id) ON DELETE CASCADE,
          file_path TEXT NOT NULL,
          chunk_index INTEGER NOT NULL,
          chunk_content TEXT NOT NULL,
          embedding JSONB,
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      this.logger.log('✨ Knowledge sources table verified in PostgreSQL');
    } catch (err: unknown) {
      this.logger.error('Failed to initialize knowledge tables', err);
    }
  }

  async getAllSources(guestId?: string): Promise<KnowledgeSourceRow[]> {
    if (guestId) {
      const res = await this.db.query<KnowledgeSourceRow>(
        `SELECT * FROM knowledge_sources WHERE guest_id = $1 ORDER BY last_synced DESC;`,
        [guestId],
      );
      return res.rows;
    }
    const res = await this.db.query<KnowledgeSourceRow>(
      `SELECT * FROM knowledge_sources ORDER BY last_synced DESC;`,
    );
    return res.rows;
  }

  async getSourceById(
    id: string,
    guestId?: string,
  ): Promise<KnowledgeSourceRow | null> {
    if (guestId) {
      const res = await this.db.query<KnowledgeSourceRow>(
        `SELECT * FROM knowledge_sources WHERE id = $1 AND (guest_id = $2 OR guest_id = 'default_guest');`,
        [id, guestId],
      );
      return res.rows[0] || null;
    }
    const res = await this.db.query<KnowledgeSourceRow>(
      `SELECT * FROM knowledge_sources WHERE id = $1;`,
      [id],
    );
    return res.rows[0] || null;
  }

  async createSource(
    data: {
      type: string;
      name: string;
      description: string;
      location: string;
      meta?: string;
      iconType?: string;
      color?: string;
    },
    guestId?: string,
  ): Promise<KnowledgeSourceRow> {
    const effectiveGuestId = guestId || 'default_guest';
    const res = await this.db.query<KnowledgeSourceRow>(
      `INSERT INTO knowledge_sources (type, name, description, location, meta, icon_type, color, status, guest_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'synced', $8)
       RETURNING *;`,
      [
        data.type,
        data.name,
        data.description,
        data.location,
        data.meta || '',
        data.iconType || 'file',
        data.color || 'text-primary',
        effectiveGuestId,
      ],
    );
    return res.rows[0];
  }

  async updateSource(
    id: string,
    updates: Partial<{
      status: 'synced' | 'syncing' | 'disconnected' | 'error';
      files_count: number;
      chunks_count: number;
      meta: string;
      last_synced: Date;
    }>,
  ): Promise<KnowledgeSourceRow | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (updates.status !== undefined) {
      fields.push(`status = $${idx++}`);
      values.push(updates.status);
    }
    if (updates.files_count !== undefined) {
      fields.push(`files_count = $${idx++}`);
      values.push(updates.files_count);
    }
    if (updates.chunks_count !== undefined) {
      fields.push(`chunks_count = $${idx++}`);
      values.push(updates.chunks_count);
    }
    if (updates.meta !== undefined) {
      fields.push(`meta = $${idx++}`);
      values.push(updates.meta);
    }
    if (updates.last_synced !== undefined) {
      fields.push(`last_synced = $${idx++}`);
      values.push(updates.last_synced);
    } else {
      fields.push(`last_synced = NOW()`);
    }

    if (fields.length === 0) return this.getSourceById(id);

    values.push(id);
    const query = `UPDATE knowledge_sources SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *;`;
    const res = await this.db.query<KnowledgeSourceRow>(query, values);
    return res.rows[0] || null;
  }

  async deleteSource(id: string): Promise<void> {
    await this.db.query(`DELETE FROM knowledge_sources WHERE id = $1;`, [id]);
  }

  async deleteChunksBySourceId(sourceId: string): Promise<void> {
    await this.db.query(`DELETE FROM knowledge_chunks WHERE source_id = $1;`, [
      sourceId,
    ]);
  }

  async insertChunks(
    sourceId: string,
    chunks: Array<{
      filePath: string;
      chunkIndex: number;
      chunkContent: string;
      embedding: number[];
      metadata?: Record<string, unknown>;
    }>,
  ): Promise<void> {
    if (chunks.length === 0) return;

    for (const chunk of chunks) {
      await this.db.query(
        `INSERT INTO knowledge_chunks (source_id, file_path, chunk_index, chunk_content, embedding, metadata)
         VALUES ($1, $2, $3, $4, $5, $6);`,
        [
          sourceId,
          chunk.filePath,
          chunk.chunkIndex,
          chunk.chunkContent,
          JSON.stringify(chunk.embedding),
          JSON.stringify(chunk.metadata || {}),
        ],
      );
    }
  }

  async getChunksBySourceId(
    sourceId: string,
    limit = 50,
  ): Promise<KnowledgeChunkRow[]> {
    const res = await this.db.query<KnowledgeChunkRow>(
      `SELECT c.*, s.name as source_name, s.type as source_type
       FROM knowledge_chunks c
       JOIN knowledge_sources s ON c.source_id = s.id
       WHERE c.source_id = $1
       ORDER BY c.chunk_index ASC
       LIMIT $2;`,
      [sourceId, limit],
    );
    return res.rows.map((row) => ({
      ...row,
      embedding:
        typeof row.embedding === 'string'
          ? (JSON.parse(row.embedding) as number[])
          : row.embedding || [],
    }));
  }

  async getAllChunksWithEmbeddings(
    guestId?: string,
  ): Promise<KnowledgeChunkRow[]> {
    let query = `SELECT c.id, c.source_id, c.file_path, c.chunk_index, c.chunk_content, c.embedding, c.metadata, c.created_at,
              s.name as source_name, s.type as source_type
       FROM knowledge_chunks c
       JOIN knowledge_sources s ON c.source_id = s.id
       WHERE s.status = 'synced'`;
    const params: unknown[] = [];

    if (guestId) {
      query += ` AND (s.guest_id = $1 OR s.guest_id = 'default_guest')`;
      params.push(guestId);
    }

    query += ` ORDER BY c.created_at DESC;`;

    const res = await this.db.query<KnowledgeChunkRow>(query, params);
    return res.rows.map((row) => ({
      ...row,
      embedding:
        typeof row.embedding === 'string'
          ? (JSON.parse(row.embedding) as number[])
          : row.embedding || [],
    }));
  }

  async searchSimilarChunks(
    queryEmbedding: number[],
    limit = 5,
    minSimilarity = 0.15,
    queryText?: string,
    guestId?: string,
  ): Promise<SearchResultChunk[]> {
    const chunks = await this.getAllChunksWithEmbeddings(guestId);
    if (chunks.length === 0) return [];

    const scored: SearchResultChunk[] = [];
    const terms = queryText
      ? queryText
          .toLowerCase()
          .split(/\s+/)
          .filter((w) => w.length >= 3)
      : [];

    for (const chunk of chunks) {
      if (!chunk.embedding || chunk.embedding.length === 0) continue;
      let sim = this.computeCosineSimilarity(queryEmbedding, chunk.embedding);

      // Hybrid keyword boost for exact terms
      if (terms.length > 0) {
        const text = `${chunk.file_path} ${chunk.chunk_content}`.toLowerCase();
        let keywordHits = 0;
        for (const term of terms) {
          if (text.includes(term)) keywordHits++;
        }
        if (keywordHits > 0) {
          sim = Math.max(sim, 0.45 + (keywordHits / terms.length) * 0.45);
        }
      }

      if (sim >= minSimilarity) {
        scored.push({
          ...chunk,
          similarity: Math.round(sim * 1000) / 1000,
        });
      }
    }

    scored.sort((a, b) => b.similarity - a.similarity);
    return scored.slice(0, limit);
  }

  private computeCosineSimilarity(a: number[], b: number[]): number {
    if (!a || !b || a.length === 0 || b.length === 0) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
