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
    const terms = queryStr
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length >= 3);

    for (const row of res.rows) {
      const vec: number[] =
        typeof row.embedding === 'string'
          ? (JSON.parse(row.embedding) as number[])
          : Array.isArray(row.embedding)
            ? row.embedding
            : [];

      if (vec.length === 0) continue;

      let sim = this.computeCosineSimilarity(queryEmbedding, vec);

      // Hybrid keyword boost for exact terms
      if (terms.length > 0) {
        const text = `${row.file_path} ${row.chunk_content}`.toLowerCase();
        let keywordHits = 0;
        for (const term of terms) {
          if (text.includes(term)) keywordHits++;
        }
        if (keywordHits > 0) {
          sim = Math.max(sim, 0.45 + (keywordHits / terms.length) * 0.45);
        }
      }

      if (sim >= 0.15) {
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
      const fallbackMsg = `No relevant documents found in knowledge base for query: "${queryStr}".`;

      emit({
        event: 'tool_call_result',
        data: {
          toolName: 'search_knowledge_vault',
          summary: 'Knowledge search completed (0 matches)',
          resultsCount: 0,
        },
      });

      return {
        textContent: fallbackMsg,
        summary: fallbackMsg,
        rawResult: { query: queryStr, matchesCount: 0, results: [] },
        sourceDomains: ['Knowledge Base (0 matches)'],
      };
    }

    // Build source names
    for (const chunk of matchingChunks) {
      const name = `${chunk.source_name || 'Knowledge Source'} · ${chunk.file_path}`;
      if (!sourceNames.includes(name)) {
        sourceNames.push(name);
      }
    }

    const chunkResults = matchingChunks.map((c) => ({
      filePath: c.file_path,
      sourceName: c.source_name,
      similarity: c.similarity,
      content: c.chunk_content,
    }));

    const summaryText = `Found ${matchingChunks.length} relevant document chunk(s) across ${sourceNames.length} source(s).`;

    emit({
      event: 'tool_call_result',
      data: {
        toolName: 'search_knowledge_vault',
        summary: summaryText,
        matchesCount: matchingChunks.length,
        sources: sourceNames,
      },
    });

    return {
      textContent: summaryText,
      summary: summaryText,
      rawResult: {
        query: queryStr,
        matchesCount: matchingChunks.length,
        documents: chunkResults,
      },
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
