import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';

export interface ChatSessionRow {
  id: string;
  user_id?: string;
  title: string;
  active_artifact_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessageRow {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  intent?: any;
  side_agent?: any;
  action_card?: any;
  artifact_id?: string;
  source_domains?: string[];
  created_at: string;
}

@Injectable()
export class ChatRepository {
  constructor(private readonly db: DatabaseService) {}

  async getSessions(): Promise<ChatSessionRow[]> {
    const res = await this.db.query<ChatSessionRow>(
      `SELECT * FROM chat_sessions ORDER BY updated_at DESC;`,
    );
    return res.rows;
  }

  async getSessionById(id: string): Promise<ChatSessionRow | null> {
    const res = await this.db.query<ChatSessionRow>(
      `SELECT * FROM chat_sessions WHERE id = $1;`,
      [id],
    );
    return res.rows[0] || null;
  }

  async createSession(title = 'New Investigation'): Promise<ChatSessionRow> {
    const res = await this.db.query<ChatSessionRow>(
      `INSERT INTO chat_sessions (title) VALUES ($1) RETURNING *;`,
      [title],
    );
    return res.rows[0];
  }

  async updateSessionTitle(id: string, title: string): Promise<void> {
    await this.db.query(
      `UPDATE chat_sessions SET title = $2, updated_at = NOW() WHERE id = $1;`,
      [id, title],
    );
  }

  async updateActiveArtifact(
    sessionId: string,
    artifactId: string | null,
  ): Promise<void> {
    await this.db.query(
      `UPDATE chat_sessions SET active_artifact_id = $2, updated_at = NOW() WHERE id = $1;`,
      [sessionId, artifactId],
    );
  }

  async deleteSession(id: string): Promise<void> {
    await this.db.query(`DELETE FROM chat_sessions WHERE id = $1;`, [id]);
  }

  async getMessagesBySessionId(sessionId: string): Promise<ChatMessageRow[]> {
    const res = await this.db.query<ChatMessageRow>(
      `SELECT * FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC;`,
      [sessionId],
    );
    return res.rows;
  }

  async createMessage(data: {
    sessionId: string;
    role: 'user' | 'assistant';
    content: string;
    intent?: any;
    sideAgent?: any;
    actionCard?: any;
    artifactId?: string;
    sourceDomains?: string[];
  }): Promise<ChatMessageRow> {
    const res = await this.db.query<ChatMessageRow>(
      `INSERT INTO chat_messages 
        (session_id, role, content, intent, side_agent, action_card, artifact_id, source_domains)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *;`,
      [
        data.sessionId,
        data.role,
        data.content,
        data.intent ? JSON.stringify(data.intent) : null,
        data.sideAgent ? JSON.stringify(data.sideAgent) : null,
        data.actionCard ? JSON.stringify(data.actionCard) : null,
        data.artifactId || null,
        data.sourceDomains || null,
      ],
    );

    // Touch session updated_at
    await this.db.query(
      `UPDATE chat_sessions SET updated_at = NOW() WHERE id = $1;`,
      [data.sessionId],
    );

    return res.rows[0];
  }
}
