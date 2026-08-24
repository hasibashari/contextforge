import { Injectable, Logger } from '@nestjs/common';
import {
  OrchestrationResult,
  StreamEmitter,
} from '../orchestrator/orchestrator.types';
import { WebSearchService } from '../services/web-search.service';

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

  constructor(private readonly webSearchService: WebSearchService) {}

  /**
   * Extracts real source domains and titles from Gemini groundingMetadata
   */
  extractGroundingDomains(response: unknown): string[] {
    const candidate = (response as { candidates?: CandidateWithGrounding[] })
      ?.candidates?.[0];
    const chunks = candidate?.groundingMetadata?.groundingChunks;

    if (!chunks || !Array.isArray(chunks)) return [];

    const sources: string[] = [];
    for (const chunk of chunks) {
      if (chunk.web?.uri) {
        sources.push(chunk.web.uri);
      } else if (chunk.web?.title) {
        sources.push(chunk.web.title);
      }
    }

    return Array.from(new Set(sources));
  }

  /**
   * Executes Agentic Search via WebSearchService
   */
  async execute(
    prompt: string,
    args: WebSearchToolArgs,
    emit: StreamEmitter,
  ): Promise<OrchestrationResult> {
    const queryStr = args.query || prompt;
    this.logger.log(`Executing Agentic Web Search for query: "${queryStr}"`);
    return this.webSearchService.executeAgenticSearch(queryStr, emit);
  }
}
