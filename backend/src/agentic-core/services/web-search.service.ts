import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { GoogleGenAI } from '@google/genai';
import { GEMINI_CLIENT } from '../gemini-client.provider';
import {
  OrchestrationResult,
  StreamEmitter,
} from '../orchestrator/orchestrator.types';
import {
  WEB_SEARCH_AGENT_SYSTEM_PROMPT,
  getSearchDecompositionPrompt,
  getEvidenceSynthesisPrompt,
  SearchIntentClassification,
  SourceEvaluation,
  SourceTier,
  ConfidenceLevel,
} from '../prompts/web-search.prompt';

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

interface OpenWebArticle {
  title: string;
  url: string;
  source: string;
  pubDate: string;
  snippet: string;
}

@Injectable()
export class WebSearchService {
  private readonly logger = new Logger(WebSearchService.name);

  constructor(
    @Inject(GEMINI_CLIENT) private readonly ai: GoogleGenAI,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Main Autonomous Web Search Agent Entrypoint
   * Implements 5-Phase Agentic Search:
   * 1. Query Understanding & Decomposition
   * 2. Progressive Retrieval via Gemini Google Search Grounding
   * 3. Source Evaluation & Tiering (Tier 1/2/3)
   * 4. Multi-Source Triangulation & Verification
   * 5. Epistemic Structured Synthesis (Facts vs Inference)
   */
  async executeAgenticSearch(
    query: string,
    emit: StreamEmitter,
  ): Promise<OrchestrationResult> {
    const modelName = this.configService.get<string>(
      'gemini.defaultModel',
      'gemini-3.5-flash',
    );

    this.logger.log(
      `[WebSearchService] Initiating Agentic Search lifecycle for: "${query}"`,
    );

    // =========================================================================
    // PHASE 1: Query Understanding & Decomposition
    // =========================================================================
    emit({
      event: 'timeline_stage',
      data: {
        stage: 'thinking',
        label: `Web Search: Decomposing & planning search strategy for "${query.slice(0, 45)}..."`,
      },
    });

    emit({
      event: 'side_agent_log',
      data: {
        sideAgentId: 'agent-search',
        log: `[Phase 1: Understanding] Analyzing query intent, entities, and decomposition strategy...`,
        riskLevel: 'low_risk',
      },
    });

    const decomposition = await this.decomposeQuery(query, modelName);
    const subQueries =
      decomposition.sub_queries.length > 0
        ? decomposition.sub_queries
        : [query];

    this.logger.log(
      `[WebSearchService] Intent: ${decomposition.intent} (${decomposition.required_depth} depth) -> ${subQueries.length} sub-queries: ${JSON.stringify(subQueries)}`,
    );

    emit({
      event: 'side_agent_log',
      data: {
        sideAgentId: 'agent-search',
        log: `[Phase 1 Complete] Intent: ${decomposition.intent}. Decomposed into ${subQueries.length} focused search tasks.`,
        riskLevel: 'low_risk',
      },
    });

    // =========================================================================
    // PHASE 2: Progressive Multi-Query Grounded Retrieval
    // =========================================================================
    const groundingEvidenceBlocks: string[] = [];
    const discoveredSources: SourceEvaluation[] = [];
    const sourceUrls: Set<string> = new Set();
    let isNativeGroundingSuccessful = false;

    for (let i = 0; i < subQueries.length; i++) {
      const currentSubQuery = subQueries[i];

      emit({
        event: 'timeline_stage',
        data: {
          stage: 'reading',
          label: `Web Search: Grounding task ${i + 1}/${subQueries.length}: "${currentSubQuery}"`,
        },
      });

      emit({
        event: 'side_agent_log',
        data: {
          sideAgentId: 'agent-search',
          log: `[Phase 2: Progressive Search] Executing Google Search Grounding for: "${currentSubQuery}"`,
          riskLevel: 'low_risk',
        },
      });

      try {
        const searchResponse = await this.ai.models.generateContent({
          model: modelName,
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `Perform an in-depth, rigorous, and accurate search for the following sub-task: "${currentSubQuery}". Include specific facts, technical data, recent versions/dates, and authoritative primary sources.`,
                },
              ],
            },
          ],
          config: {
            tools: [{ googleSearch: {} }],
          },
        });

        const groundedText = searchResponse.text || '';
        const evaluatedSources =
          this.extractAndTierGroundingSources(searchResponse);

        if (groundedText.trim().length > 0) {
          isNativeGroundingSuccessful = true;
          groundingEvidenceBlocks.push(
            `### Sub-Task ${i + 1}: ${currentSubQuery}\n${groundedText}\n*Sumber Ditemukan: ${evaluatedSources.map((s) => s.url).join(', ') || 'Google Search Index'}*`,
          );

          for (const src of evaluatedSources) {
            if (!sourceUrls.has(src.url)) {
              sourceUrls.add(src.url);
              discoveredSources.push(src);
            }
          }
        }
      } catch (err) {
        this.logger.warn(
          `[WebSearchService] Error during sub-query grounding ("${currentSubQuery}"): ${String(err)}`,
        );
      }
    }

    // =========================================================================
    // PHASE 3 & 4: Resilience & Open Web Fallback (If native grounding empty)
    // =========================================================================
    if (!isNativeGroundingSuccessful || groundingEvidenceBlocks.length === 0) {
      this.logger.warn(
        `[WebSearchService] Native Grounding returned empty or rate-limited. Activating Open-Source Web Feed fallback...`,
      );

      emit({
        event: 'timeline_stage',
        data: {
          stage: 'reading',
          label: `Web Search: Querying live Open News & RSS Feeds for verification...`,
        },
      });

      const openArticles = await this.fetchOpenWebArticles(query);
      if (openArticles.length > 0) {
        const openEvidence = openArticles
          .map(
            (a, idx) =>
              `${idx + 1}. [${a.source}] ${a.title}\n   Dipublikasikan: ${a.pubDate}\n   Ringkasan: ${a.snippet}\n   Sumber: ${a.url}`,
          )
          .join('\n\n');

        groundingEvidenceBlocks.push(
          `### Live Open Web Feeds Evidence:\n${openEvidence}`,
        );

        for (const art of openArticles) {
          if (!sourceUrls.has(art.url)) {
            sourceUrls.add(art.url);
            discoveredSources.push({
              title: art.title,
              url: art.url,
              source_type: 'News Feed',
              tier: 'tier_2_secondary',
              authority: 'medium',
              published_at: art.pubDate,
              relevance: 'high',
            });
          }
        }
      }
    }

    // =========================================================================
    // PHASE 5: Epistemic Evidence Synthesis & Triangulation
    // =========================================================================
    emit({
      event: 'timeline_stage',
      data: {
        stage: 'thinking',
        label: `Web Search: Triangulating facts & synthesizing verified evidence...`,
      },
    });

    emit({
      event: 'side_agent_log',
      data: {
        sideAgentId: 'agent-search',
        log: `[Phase 5: Synthesis] Distinguishing Facts vs Inferences across ${discoveredSources.length} evaluated sources...`,
        riskLevel: 'low_risk',
      },
    });

    const compiledEvidence =
      groundingEvidenceBlocks.length > 0
        ? groundingEvidenceBlocks.join('\n\n---\n\n')
        : `No specific search results found for: "${query}". Utilizing verified parametric knowledge.`;

    const synthesisPrompt = getEvidenceSynthesisPrompt(
      query,
      decomposition.intent,
      compiledEvidence,
    );

    let synthesizedMarkdown = '';
    try {
      const finalSynthesisRes = await this.ai.models.generateContent({
        model: modelName,
        contents: [
          {
            role: 'user',
            parts: [{ text: synthesisPrompt }],
          },
        ],
        config: {
          systemInstruction: WEB_SEARCH_AGENT_SYSTEM_PROMPT,
          temperature: 0.2,
        },
      });
      synthesizedMarkdown = (finalSynthesisRes.text || '').trim();
    } catch (synthErr) {
      this.logger.warn(
        `[WebSearchService] Gemini Synthesis failed (${String(synthErr)}). Generating direct structured summary...`,
      );
    }

    // Safety fallback: If synthesis failed or returned an empty/lazy response
    if (
      !synthesizedMarkdown ||
      synthesizedMarkdown.length < 100 ||
      /^(\s*#*\s*References|\s*#*\s*Sources:?|\s*[-*]\s*\[.*?\]\(.*?\)\s*)+$/is.test(
        synthesizedMarkdown,
      )
    ) {
      const topEvidence = discoveredSources.slice(0, 5);
      const bulletPoints = topEvidence
        .map(
          (s) =>
            `- **${s.title}**: ${s.key_evidence || s.relevance} [${s.source_type || 'Source'}](${s.url})`,
        )
        .join('\n');

      synthesizedMarkdown = `### 🔍 Search Summary & Key Findings\n\nBased on verified findings regarding **"${query}"**, here is the synthesized intelligence:\n\n${bulletPoints}`;
    }

    // Sanitize output: Strip any trailing References/Sources list generated by the LLM
    synthesizedMarkdown = synthesizedMarkdown
      .replace(
        /(?:\n|^)(?:---\s*\n+)?#*\s*(?:References|Referensi|Sumber Informasi|Sources|Daftar Pustaka)[\s\S]*$/i,
        '',
      )
      .trim();

    const tier1Count = discoveredSources.filter(
      (s) => s.tier === 'tier_1_primary',
    ).length;
    const tier2Count = discoveredSources.filter(
      (s) => s.tier === 'tier_2_secondary',
    ).length;
    const tier3Count = discoveredSources.filter(
      (s) => s.tier === 'tier_3_community',
    ).length;

    const sourcesList = discoveredSources.map((s) => s.url);

    emit({
      event: 'tool_call_result',
      data: {
        toolName: 'web_search',
        summary: `Agentic Search completed: ${discoveredSources.length} sources evaluated (Tier 1: ${tier1Count}, Tier 2: ${tier2Count}, Tier 3: ${tier3Count})`,
        sources: sourcesList,
        intent: decomposition.intent,
        isGrounded: discoveredSources.length > 0,
      },
    });

    return {
      textContent: synthesizedMarkdown,
      summary: `Agentic Search completed (${discoveredSources.length} sources, Intent: ${decomposition.intent})`,
      rawResult: {
        query,
        intent: decomposition.intent,
        subQueries,
        sourcesCount: discoveredSources.length,
        sources: discoveredSources,
        synthesized_markdown: synthesizedMarkdown,
        isGrounded: discoveredSources.length > 0,
      },
      sourceDomains: sourcesList.length > 0 ? sourcesList : undefined,
    };
  }

  /**
   * Decomposes user query into structured intent and targeted sub-queries
   */
  private async decomposeQuery(
    query: string,
    modelName: string,
  ): Promise<SearchIntentClassification> {
    try {
      const decompositionResponse = await this.ai.models.generateContent({
        model: modelName,
        contents: [
          {
            role: 'user',
            parts: [{ text: getSearchDecompositionPrompt(query) }],
          },
        ],
        config: {
          systemInstruction: WEB_SEARCH_AGENT_SYSTEM_PROMPT,
          temperature: 0.1,
        },
      });

      const text = decompositionResponse.text || '';
      const cleanJson = text
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

      const parsed = JSON.parse(cleanJson) as SearchIntentClassification;
      if (parsed.sub_queries && Array.isArray(parsed.sub_queries)) {
        return parsed;
      }
    } catch (err) {
      this.logger.warn(
        `[WebSearchService] Decomposition parsing failed, using fallback query: ${String(err)}`,
      );
    }

    return {
      intent: 'TECHNICAL_RESEARCH',
      user_intent: query,
      entities: [],
      important_constraints: [],
      time_sensitivity: false,
      required_depth: 'moderate',
      sub_queries: [query],
    };
  }

  /**
   * Extracts URLs and titles from Gemini Grounding and classifies into Tiers 1/2/3
   */
  private extractAndTierGroundingSources(
    response: unknown,
  ): SourceEvaluation[] {
    const candidate = (response as { candidates?: CandidateWithGrounding[] })
      ?.candidates?.[0];
    const chunks = candidate?.groundingMetadata?.groundingChunks;

    if (!chunks || !Array.isArray(chunks)) return [];

    const results: SourceEvaluation[] = [];

    for (const chunk of chunks) {
      const uri = chunk.web?.uri;
      const title = chunk.web?.title || uri || 'Web Source';

      if (!uri) continue;

      const tier = this.classifySourceTier(uri);
      const authority: ConfidenceLevel =
        tier === 'tier_1_primary'
          ? 'high'
          : tier === 'tier_2_secondary'
            ? 'medium'
            : 'low';

      results.push({
        title,
        url: uri,
        source_type: tier.replace(/_/g, ' ').toUpperCase(),
        tier,
        authority,
        relevance: 'high',
      });
    }

    return results;
  }

  /**
   * Classifies a domain/URL into Tier 1 (Primary/Authoritative), Tier 2 (High Quality Secondary), or Tier 3 (Community)
   */
  private classifySourceTier(url: string): SourceTier {
    try {
      const parsedUrl = new URL(url);
      const hostname = parsedUrl.hostname.toLowerCase();

      // Tier 1: Official docs, government, academic, primary sources
      if (
        hostname.endsWith('.gov') ||
        hostname.endsWith('.edu') ||
        hostname.endsWith('.ac.id') ||
        hostname.includes('arxiv.org') ||
        hostname.includes('rfc-editor.org') ||
        hostname.includes('w3.org') ||
        hostname.includes('ietf.org') ||
        hostname.startsWith('docs.') ||
        hostname.startsWith('developer.') ||
        hostname.includes('openai.com') ||
        hostname.includes('google.com') ||
        hostname.includes('github.com/microsoft') ||
        hostname.includes('nodejs.org') ||
        hostname.includes('postgresql.org')
      ) {
        return 'tier_1_primary';
      }

      // Tier 3: Community & Social Forums
      if (
        hostname.includes('reddit.com') ||
        hostname.includes('stackoverflow.com') ||
        hostname.includes('x.com') ||
        hostname.includes('twitter.com') ||
        hostname.includes('quora.com') ||
        hostname.includes('discourse.')
      ) {
        return 'tier_3_community';
      }

      // Default: Tier 2 (Technical publications, news organizations, general articles)
      return 'tier_2_secondary';
    } catch {
      return 'tier_2_secondary';
    }
  }

  /**
   * Fetches real-time live articles from Open Public News Feeds (Google News RSS & Hacker News)
   * Offline / rate-limit resilience layer.
   */
  private async fetchOpenWebArticles(query: string): Promise<OpenWebArticle[]> {
    const articles: OpenWebArticle[] = [];

    // 1. Google News RSS
    try {
      const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(
        query,
      )}&hl=en-US&gl=US&ceid=US:en`;
      const rssRes = await fetch(rssUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'application/rss+xml, text/xml, */*',
        },
      });

      if (rssRes.ok) {
        const xml = await rssRes.text();
        const rawItems = xml.split('<item>').slice(1);

        for (const raw of rawItems.slice(0, 5)) {
          const titleMatch = raw.match(/<title>([\s\S]*?)<\/title>/);
          const linkMatch = raw.match(/<link>([\s\S]*?)<\/link>/);
          const pubDateMatch = raw.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
          const sourceMatch = raw.match(/<source[^>]*>([\s\S]*?)<\/source>/);
          const descMatch = raw.match(/<description>([\s\S]*?)<\/description>/);

          const rawTitle = titleMatch
            ? titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim()
            : '';
          const link = linkMatch ? linkMatch[1].trim() : '';
          const pubDate = pubDateMatch ? pubDateMatch[1].trim() : '';
          const publisher = sourceMatch
            ? sourceMatch[1].trim()
            : rawTitle.split(' - ').length > 1
              ? rawTitle.split(' - ').pop() || 'News'
              : 'Google News';
          const rawSnippet = descMatch
            ? descMatch[1].replace(/<[^>]+>/g, '').trim()
            : rawTitle;

          if (rawTitle) {
            articles.push({
              title: rawTitle,
              url: link,
              source: publisher,
              pubDate,
              snippet: rawSnippet || rawTitle,
            });
          }
        }
      }
    } catch (rssErr) {
      this.logger.warn(`Open RSS fetch error: ${String(rssErr)}`);
    }

    // 2. Hacker News Algolia Open API
    try {
      const hnUrl = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(
        query,
      )}&tags=story&hitsPerPage=4`;
      const hnRes = await fetch(hnUrl);
      if (hnRes.ok) {
        const hnData = (await hnRes.json()) as {
          hits?: Array<{
            title?: string;
            url?: string;
            created_at?: string;
            story_text?: string;
          }>;
        };

        for (const hit of hnData.hits || []) {
          if (hit.title && articles.length < 8) {
            articles.push({
              title: hit.title,
              url: hit.url || 'https://news.ycombinator.com',
              source: 'Hacker News',
              pubDate: hit.created_at || new Date().toISOString(),
              snippet: hit.story_text || hit.title,
            });
          }
        }
      }
    } catch (hnErr) {
      this.logger.warn(`Hacker News open API fetch error: ${String(hnErr)}`);
    }

    return articles;
  }
}
