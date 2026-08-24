import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';

export interface WikiPageRecord {
  id: string;
  slug: string;
  title: string;
  category: string;
  path: string;
  content: string;
  frontmatter: Record<string, unknown>;
  backlinks: string[];
  outlinks: string[];
  word_count: number;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class WikiRepository implements OnModuleInit {
  private readonly logger = new Logger(WikiRepository.name);
  private initPromise: Promise<void> | null = null;

  constructor(private readonly db: DatabaseService) {}

  async onModuleInit() {
    await this.ensureTableSchema();
  }

  /**
   * Initializes wiki_pages table if not present in schema.
   * Guarantees single-execution with an initialization promise.
   */
  async ensureTableSchema(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      try {
        await this.db.query(`
          CREATE TABLE IF NOT EXISTS wiki_pages (
            id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
            slug VARCHAR(255) UNIQUE NOT NULL,
            title VARCHAR(255) NOT NULL,
            category VARCHAR(50) NOT NULL DEFAULT 'concept',
            path TEXT NOT NULL,
            content TEXT NOT NULL,
            frontmatter JSONB DEFAULT '{}',
            backlinks TEXT[] DEFAULT '{}',
            outlinks TEXT[] DEFAULT '{}',
            word_count INTEGER DEFAULT 0,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
          CREATE INDEX IF NOT EXISTS idx_wiki_pages_slug ON wiki_pages(slug);
          CREATE INDEX IF NOT EXISTS idx_wiki_pages_category ON wiki_pages(category);
        `);
        this.logger.log('📚 Wiki pages table verified/created successfully.');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Failed to verify wiki_pages schema: ${msg}`);
      }
    })();

    return this.initPromise;
  }

  async getAll(): Promise<WikiPageRecord[]> {
    await this.ensureTableSchema();
    const res = await this.db.query<WikiPageRecord>(
      `SELECT * FROM wiki_pages ORDER BY category ASC, title ASC;`,
    );
    return res.rows;
  }

  async getBySlug(slug: string): Promise<WikiPageRecord | null> {
    await this.ensureTableSchema();
    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    const res = await this.db.query<WikiPageRecord>(
      `SELECT * FROM wiki_pages WHERE slug = $1 OR LOWER(title) = $2 OR path = $3 LIMIT 1;`,
      [cleanSlug, slug.toLowerCase(), slug],
    );
    return res.rows[0] || null;
  }

  async upsertPage(data: {
    slug: string;
    title: string;
    category: string;
    path: string;
    content: string;
    frontmatter?: Record<string, unknown>;
    outlinks?: string[];
    backlinks?: string[];
  }): Promise<WikiPageRecord> {
    await this.ensureTableSchema();
    const wordCount = data.content
      ? data.content.split(/\s+/).filter(Boolean).length
      : 0;

    const res = await this.db.query<WikiPageRecord>(
      `INSERT INTO wiki_pages 
        (slug, title, category, path, content, frontmatter, outlinks, backlinks, word_count, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
       ON CONFLICT (slug) DO UPDATE 
       SET title = EXCLUDED.title,
           category = EXCLUDED.category,
           path = EXCLUDED.path,
           content = EXCLUDED.content,
           frontmatter = EXCLUDED.frontmatter,
           outlinks = EXCLUDED.outlinks,
           word_count = EXCLUDED.word_count,
           updated_at = NOW()
       RETURNING *;`,
      [
        data.slug,
        data.title,
        data.category,
        data.path,
        data.content,
        JSON.stringify(data.frontmatter || {}),
        data.outlinks || [],
        data.backlinks || [],
        wordCount,
      ],
    );

    return res.rows[0];
  }

  async updateBacklinks(slug: string, backlinks: string[]): Promise<void> {
    await this.ensureTableSchema();
    await this.db.query(
      `UPDATE wiki_pages SET backlinks = $2 WHERE slug = $1;`,
      [slug, backlinks],
    );
  }

  async delete(slug: string): Promise<void> {
    await this.ensureTableSchema();
    await this.db.query(`DELETE FROM wiki_pages WHERE slug = $1;`, [slug]);
  }
}
