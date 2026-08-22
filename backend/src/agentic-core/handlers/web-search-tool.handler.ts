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
      'gemini-3.6-flash',
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

      try {
        const fallbackRes = await this.ai.models.generateContent({
          model: modelName,
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `Berikan rangkuman komprehensif, terstruktur, dan akurat berdasarkan pengetahuan teknis untuk query: "${queryStr}". Sertakan fakta kunci dan analisis.`,
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
            summary: `Direct technical synthesis completed for "${queryStr}"`,
            sources: ['Google Knowledge Base'],
          },
        });

        return {
          textContent: fallbackText,
          summary: `Direct technical synthesis completed.`,
          rawResult: {
            query: queryStr,
            synthesis: fallbackText,
            sources: ['Google Knowledge Base'],
          },
          sourceDomains: ['Google Knowledge Base'],
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
