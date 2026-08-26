import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';

export interface UserMemoryRow {
  id: string;
  user_id?: string;
  category: 'profile' | 'preference' | 'project' | 'workflow';
  key: string;
  value: string;
  embedding?: any;
  updated_at: string;
}

@Injectable()
export class PersonalHubRepository implements OnModuleInit {
  private readonly logger = new Logger(PersonalHubRepository.name);

  constructor(private readonly db: DatabaseService) {}

  async onModuleInit() {
    await this.ensureTables();
  }

  async ensureTables() {
    try {
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS user_memories (
          id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
          user_id UUID,
          category VARCHAR(50) NOT NULL,
          key VARCHAR(100) NOT NULL,
          value TEXT NOT NULL,
          embedding JSONB,
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      this.logger.log('✨ User memories table verified in PostgreSQL');
    } catch (err: unknown) {
      this.logger.error('Failed to initialize user_memories table', err);
    }
  }

  // Memory queries
  async getUserMemories(userId?: string): Promise<UserMemoryRow[]> {
    if (userId) {
      const res = await this.db.query<UserMemoryRow>(
        `SELECT * FROM user_memories WHERE user_id = $1 OR user_id IS NULL ORDER BY updated_at DESC;`,
        [userId],
      );
      return res.rows;
    }
    const res = await this.db.query<UserMemoryRow>(
      `SELECT * FROM user_memories ORDER BY updated_at DESC;`,
    );
    return res.rows;
  }

  async createUserMemory(data: {
    category: 'profile' | 'preference' | 'project' | 'workflow';
    key: string;
    value: string;
    userId?: string;
  }): Promise<UserMemoryRow> {
    const res = await this.db.query<UserMemoryRow>(
      `INSERT INTO user_memories (category, key, value, user_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *;`,
      [data.category, data.key, data.value, data.userId || null],
    );
    return res.rows[0];
  }

  async deleteUserMemory(id: string): Promise<void> {
    await this.db.query(`DELETE FROM user_memories WHERE id = $1;`, [id]);
  }

  async clearAll(userId?: string): Promise<void> {
    if (userId) {
      await this.db.query(`DELETE FROM user_memories WHERE user_id = $1;`, [
        userId,
      ]);
    } else {
      await this.db.query(`DELETE FROM user_memories;`);
    }
  }
}
