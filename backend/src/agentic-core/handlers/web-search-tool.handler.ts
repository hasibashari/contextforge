import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { GoogleGenAI } from '@google/genai';
import { GEMINI_CLIENT } from '../gemini-client.provider';
import {
  OrchestrationResult,
  StreamEmitter,
} from '../orchestrator/orchestrator.types';

export interface WebSearchToolArgs {
  query?: string;
}

interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
}

interface CandidateWithGrounding {
  groundingMetadata?: {
    groundingChunks?: GroundingChunk[];
    webSearchQueries?: string[];
  };
}

@Injectable()
export class WebSearchToolHandler {
  private readonly logger = new Logger(WebSearchToolHandler.name);

  constructor(
    @Inject(GEMINI_CLIENT) private readonly ai: GoogleGenAI,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Helper to extract real source domains and titles from Gemini groundingMetadata
   */
  extractGroundingDomains(response: unknown): string[] {
    const candidate = (response as { candidates?: CandidateWithGrounding[] })
      ?.candidates?.[0];
    const chunks = candidate?.groundingMetadata?.groundingChunks;

    if (!chunks || !Array.isArray(chunks)) return [];

    const domains: string[] = [];
    for (const chunk of chunks) {
      if (chunk.web?.title) {
        domains.push(chunk.web.title);
      } else if (chunk.web?.uri) {
        try {
          const url = new URL(chunk.web.uri);
          domains.push(url.hostname.replace(/^www\./, ''));
        } catch {
          domains.push(chunk.web.uri);
        }
      }
    }

    return Array.from(new Set(domains));
  }

  async execute(
    prompt: string,
    args: WebSearchToolArgs,
    emit: StreamEmitter,
  ): Promise<OrchestrationResult> {
    const queryStr = args.query || prompt;
    emit({
      event: 'timeline_stage',
      data: {
        stage: 'reading',
        label: `Web Search: Grounding live facts for "${queryStr}"...`,
      },
    });

    const modelName = this.configService.get<string>(
      'gemini.defaultModel',
      'gemini-3.5-flash',
    );

    try {
      const searchResponse = await this.ai.models.generateContent({
        model: modelName,
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Lakukan pencarian Google dan berikan rangkuman komprehensif, terstruktur, dan akurat untuk query: "${queryStr}". Sertakan fakta-fakta kunci dan analisis teknis.`,
              },
            ],
          },
        ],
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const synthesis =
        searchResponse.text || `Tidak ada hasil untuk: ${queryStr}`;
      const sources = this.extractGroundingDomains(searchResponse);

      emit({
        event: 'tool_call_result',
        data: {
          toolName: 'web_search',
          summary: `Web search completed for "${queryStr}"`,
          sourcesCount: sources.length,
          sources,
        },
      });

      return {
        textContent: synthesis,
        summary: `Web search completed with ${sources.length} sources.`,
        rawResult: {
          query: queryStr,
          synthesis,
          sources,
        },
        sourceDomains: sources.length > 0 ? sources : undefined,
      };
    } catch (searchErr: unknown) {
      this.logger.warn(
        `Live web search grounding unavailable, falling back to direct synthesis: ${String(searchErr)}`,
      );

      // Notify UI that live search is unavailable
      emit({
        event: 'timeline_stage',
        data: {
          stage: 'reading',
          label: `Web Search: Live search unavailable — using training knowledge...`,
        },
      });

      try {
        const fallbackRes = await this.ai.models.generateContent({
          model: modelName,
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `Catatan penting: Kamu TIDAK memiliki akses ke internet secara live saat ini. Jawab query berikut berdasarkan pengetahuan pelatihan kamu hingga batas tanggal yang kamu ketahui. Jika informasi mungkin sudah tidak aktual, sebutkan itu secara eksplisit dalam jawaban.

Query: "${queryStr}"

Berikan jawaban yang jujur, terstruktur, dan akurat. Sebutkan jika data yang kamu berikan mungkin tidak up-to-date.`,
                },
              ],
            },
          ],
        });

        const fallbackText =
          fallbackRes.text || `Hasil analisis untuk: ${queryStr}`;

        emit({
          event: 'tool_call_result',
          data: {
            toolName: 'web_search',
            summary: `Knowledge synthesis (no live search) for "${queryStr}"`,
            sources: ['AI Training Knowledge — may not reflect latest data'],
            isGrounded: false,
          },
        });

        return {
          textContent: fallbackText,
          summary: `Knowledge synthesis completed (live search unavailable).`,
          rawResult: {
            query: queryStr,
            synthesis: fallbackText,
            sources: ['AI Training Knowledge'],
            isGrounded: false,
          },
          sourceDomains: undefined,
        };
      } catch {
        const fallbackSynthesis = `Analisis pengetahuan untuk query: "${queryStr}".`;
        return {
          textContent: fallbackSynthesis,
          summary: fallbackSynthesis,
          rawResult: { query: queryStr, text: fallbackSynthesis },
        };
      }
    }
  }
}
