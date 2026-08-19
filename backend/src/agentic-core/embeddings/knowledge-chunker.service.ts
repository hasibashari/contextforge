import { Injectable } from '@nestjs/common';

export interface TextChunk {
  content: string;
  chunkIndex: number;
  wordCount: number;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class KnowledgeChunkerService {
  /**
   * Split markdown or source code into semantic chunks with overlap
   */
  chunkText(
    text: string,
    chunkSize = 600,
    overlap = 100,
    metadata?: Record<string, unknown>,
  ): TextChunk[] {
    if (!text || text.trim().length === 0) return [];

    const chunks: TextChunk[] = [];
    const paragraphs = text.split(/\n\n+/);
    let currentChunk = '';
    let chunkIdx = 0;

    for (const para of paragraphs) {
      if (
        (currentChunk + '\n\n' + para).length > chunkSize &&
        currentChunk.length > 0
      ) {
        chunks.push({
          content: currentChunk.trim(),
          chunkIndex: chunkIdx++,
          wordCount: currentChunk.split(/\s+/).filter(Boolean).length,
          metadata,
        });

        // Retain overlap from end of current chunk
        const overlapText = currentChunk.slice(-overlap);
        currentChunk = overlapText + '\n\n' + para;
      } else {
        currentChunk = currentChunk ? currentChunk + '\n\n' + para : para;
      }
    }

    if (currentChunk.trim().length > 0) {
      chunks.push({
        content: currentChunk.trim(),
        chunkIndex: chunkIdx,
        wordCount: currentChunk.split(/\s+/).filter(Boolean).length,
        metadata,
      });
    }

    return chunks;
  }
}
