import { Injectable, Logger } from '@nestjs/common';
import {
  OrchestrationResult,
  StreamEmitter,
} from '../orchestrator/orchestrator.types';
import { DatabaseService } from '../../common/database/database.service';
import { EmbeddingService } from '../embeddings/embedding.service';

export interface KnowledgeSearchArgs {
  query?: string;
}

interface ChunkRow {
  id: string;
  source_id: string;
  file_path: string;
  chunk_index: number;
  chunk_content: string;
  embedding: string | number[];
  source_name?: string;
  source_type?: string;
}

interface ChunkMatch {
  id: string;
  source_id: string;
  file_path: string;
  chunk_index: number;
  chunk_content: string;
  source_name?: string;
  source_type?: string;
  similarity: number;
}

@Injectable()
export class KnowledgeToolHandler {
  private readonly logger = new Logger(KnowledgeToolHandler.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly embeddingService: EmbeddingService,
  ) {}

  async handle(
    prompt: string,
    args: KnowledgeSearchArgs,
    emit: StreamEmitter,
  ): Promise<OrchestrationResult> {
    const queryStr = args.query || prompt;

    emit({
      event: 'timeline_stage',
      data: {
        stage: 'reading',
        label: `Vector RAG: Searching knowledge base for "${queryStr}"...`,
      },
    });

    this.logger.log(`Executing knowledge vector search for: "${queryStr}"`);

    // 1. Generate query embedding (1536 dimensions)
    const queryEmbedding = await this.embeddingService.embedText(queryStr);

    // 2. Fetch all synced chunks from database
    const res = await this.db.query<ChunkRow>(
      `SELECT c.id, c.source_id, c.file_path, c.chunk_index, c.chunk_content, c.embedding,
              s.name as source_name, s.type as source_type
       FROM knowledge_chunks c
       JOIN knowledge_sources s ON c.source_id = s.id
       WHERE s.status = 'synced'
       ORDER BY c.created_at DESC;`,
    );

    const scored: ChunkMatch[] = [];

    for (const row of res.rows) {
      const vec: number[] =
        typeof row.embedding === 'string'
          ? (JSON.parse(row.embedding) as number[])
          : Array.isArray(row.embedding)
            ? row.embedding
            : [];

      if (vec.length === 0) continue;

      const sim = this.computeCosineSimilarity(queryEmbedding, vec);
      if (sim >= 0.2) {
        scored.push({
          id: row.id,
          source_id: row.source_id,
          file_path: row.file_path,
          chunk_index: row.chunk_index,
          chunk_content: row.chunk_content,
          source_name: row.source_name,
          source_type: row.source_type,
          similarity: Math.round(sim * 1000) / 1000,
        });
      }
    }

    scored.sort((a, b) => b.similarity - a.similarity);
    const matchingChunks = scored.slice(0, 4);

    const sourceNames: string[] = [];

    if (matchingChunks.length === 0) {
      const fallbackText = `Saya telah memeriksa basis pengetahuan internal (**Knowledge Base** & **Vault**), namun tidak menemukan dokumen atau catatan teknis yang secara spesifik membahas *"${queryStr}"*.\n\n*Anda dapat mengunggah atau melakukan re-index dokumen terkait pada panel Knowledge Sources.*`;

      emit({ event: 'chat_chunk', data: { delta: fallbackText } });
      emit({
        event: 'timeline_stage',
        data: { stage: 'done', label: 'Completed' },
      });

      return {
        textContent: fallbackText,
        sourceDomains: ['Knowledge Base (0 matches)'],
      };
    }

    // Build synthesized response based on retrieved chunks
    for (const chunk of matchingChunks) {
      const name = `${chunk.source_name || 'Knowledge Source'} · ${chunk.file_path}`;
      if (!sourceNames.includes(name)) {
        sourceNames.push(name);
      }
    }

    const chunkExcerpts = matchingChunks
      .map(
        (c, idx) =>
          `#### 📄 Referensi ${idx + 1}: \`${c.file_path}\` (${Math.round(c.similarity * 100)}% Match)\n${c.chunk_content}`,
      )
      .join('\n\n---\n\n');

    const synthesis = `### 🧠 Knowledge Grounding: ${queryStr}\n\nBerdasarkan penelusuran semantik pada repositori dokumen dan catatan internal:\n\n${chunkExcerpts}\n\n*Informasi di atas diambil secara langsung dari basis pengetahuan terindeks ContextForge.*`;

    const chunkSize = 40;
    for (let i = 0; i < synthesis.length; i += chunkSize) {
      const chunk = synthesis.slice(i, i + chunkSize);
      emit({
        event: 'chat_chunk',
        data: { delta: chunk },
      });
    }

    emit({
      event: 'timeline_stage',
      data: { stage: 'done', label: 'Completed' },
    });

    return {
      textContent: synthesis,
      sourceDomains: sourceNames,
    };
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
