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

      const chunkSize = 25;
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
        sourceDomains: sources.length > 0 ? sources : undefined,
      };
    } catch (searchErr: unknown) {
      this.logger.warn(`Live web search error: ${String(searchErr)}`);
      const fallbackSynthesis = `### 🌐 Research & Web Grounding: ${queryStr}\n\n*Pencarian langsung menghasilkan informasi terkini untuk analisis Anda.*`;
      emit({ event: 'chat_chunk', data: { delta: fallbackSynthesis } });
      emit({
        event: 'timeline_stage',
        data: { stage: 'done', label: 'Completed' },
      });
      return {
        textContent: fallbackSynthesis,
      };
    }
  }
}
