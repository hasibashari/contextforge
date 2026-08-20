import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { GoogleGenAI } from '@google/genai';
import { GEMINI_CLIENT } from '../gemini-client.provider';

interface EmbedContentResponse {
  embedding?: {
    values?: number[];
  };
  embeddings?: Array<{
    values?: number[];
  }>;
}

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);

  constructor(
    @Inject(GEMINI_CLIENT) private readonly ai: GoogleGenAI,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Generate 1536-dimensional embedding vector using Google gemini-embedding-002
   */
  async embedText(text: string): Promise<number[]> {
    const model = this.configService.get<string>(
      'gemini.embeddingModel',
      'gemini-embedding-002',
    );
    const dimension = this.configService.get<number>(
      'gemini.embeddingDimension',
      1536,
    );

    try {
      const response = (await this.ai.models.embedContent({
        model,
        contents: text,
        config: {
          outputDimensionality: dimension,
        },
      })) as unknown as EmbedContentResponse;

      const values =
        response?.embedding?.values || response?.embeddings?.[0]?.values;
      if (Array.isArray(values) && values.length > 0) {
        return values;
      }
      return new Array<number>(dimension).fill(0);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Failed to generate embedding with ${model}: ${errorMsg}`,
      );
      return new Array<number>(dimension).fill(0);
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
