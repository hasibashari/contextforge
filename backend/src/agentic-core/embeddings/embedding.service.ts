import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { GoogleGenAI } from '@google/genai';
import { GEMINI_CLIENT } from '../gemini-client.provider';

interface EmbedContentResponse {
  embedding?: {
    values?: number[];
  };
}

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);

  constructor(
    @Inject(GEMINI_CLIENT) private readonly ai: GoogleGenAI,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Generate 768-dimensional embedding vector using Google text-embedding-004
   */
  async embedText(text: string): Promise<number[]> {
    const model = this.configService.get<string>(
      'gemini.embeddingModel',
      'text-embedding-004',
    );

    try {
      const response = (await this.ai.models.embedContent({
        model,
        contents: text,
      })) as unknown as EmbedContentResponse;

      const values = response?.embedding?.values;
      if (Array.isArray(values)) {
        return values;
      }
      return new Array<number>(768).fill(0);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to generate embedding: ${errorMsg}`);
      return new Array<number>(768).fill(0);
    }
  }

  /**
   * Batch embed multiple text chunks
   */
  async embedBatch(texts: string[]): Promise<number[][]> {
    const results: number[][] = [];
    for (const text of texts) {
      const vec = await this.embedText(text);
      results.push(vec);
    }
    return results;
  }
}
