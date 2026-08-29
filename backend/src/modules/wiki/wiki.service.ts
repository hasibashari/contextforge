import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { GoogleGenAI } from '@google/genai';
import { GEMINI_CLIENT } from '../../agentic-core/gemini-client.provider';
import { WikiRepository, WikiPageRecord } from './wiki.repository';
import { ObsidianVaultService } from '../../mcp/connectors/obsidian/obsidian-vault.service';
import {
  WIKI_COMPILER_SYSTEM_PROMPT,
  getWikiIngestionPrompt,
  getWikiLintPrompt,
} from '../../agentic-core/prompts/wiki-schema.prompt';

export interface WikiGraphData {
  nodes: Array<{
    id: string;
    label: string;
    category: string;
    path: string;
    val: number;
    group: number;
  }>;
  links: Array<{
    source: string;
    target: string;
    value: number;
  }>;
}

export interface WikiLintReport {
  timestamp: string;
  healthScore: number;
  totalPages: number;
  totalConnections: number;
  issues: Array<{
    type:
      | 'contradiction'
      | 'orphan'
      | 'broken_link'
      | 'stale_claim'
      | 'missing_concept';
    title: string;
    description: string;
    pagesInvolved: string[];
    suggestion: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  suggestedQuestions: string[];
}

interface IngestPageItem {
  path?: string;
  title: string;
  category?: string;
  tags?: string[];
  content: string;
}

interface CompilationResult {
  summary?: string;
  pagesToCreateOrUpdate?: IngestPageItem[];
  indexEntry?: string;
  logEntry?: string;
}

@Injectable()
export class WikiService implements OnModuleInit {
  private readonly logger = new Logger(WikiService.name);

  constructor(
    @Inject(GEMINI_CLIENT) private readonly ai: GoogleGenAI,
    private readonly configService: ConfigService,
    private readonly repo: WikiRepository,
    private readonly obsidianVault: ObsidianVaultService,
  ) {}

  async onModuleInit() {
    await this.repo.ensureTableSchema();
    await this.seedInitialWikiIfEmpty();
  }

  /**
   * Helper to extract [[wikilinks]] from markdown text
   */
  private extractWikilinks(content: string): string[] {
    const regex = /\[\[([a-zA-Z0-9_\-/\s|]+)\]\]/g;
    const links: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = regex.exec(content)) !== null) {
      const raw = match[1];
      const target = raw.split('|')[0].trim();
      if (target && !links.includes(target)) {
        links.push(target);
      }
    }
    return links;
  }

  /**
   * Converts a title or path into a consistent slug
   */
  private toSlug(input: string): string {
    const base = input.replace(/\.md$/i, '');
    return base
      .toLowerCase()
      .replace(/[/\\_]/g, '-')
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Seeds starter Wiki pages if the repository is completely empty
   */
  private async seedInitialWikiIfEmpty(): Promise<void> {
    try {
      const existing = await this.repo.getAll();
      if (existing.length > 0) return;

      this.logger.log('🌱 Seeding initial ContextForge LLM Wiki...');

      const indexContent = `# ContextForge Knowledge Wiki

Welcome to your living, persistent LLM Wiki. Unlike basic RAG, this wiki is continuously curated and interlinked by AI agents.

## 🧭 Navigation Index
- [[Concepts/Agentic-Core|Agentic AI Core]]: Multi-step ReAct reasoning and tool orchestration.
- [[Concepts/LLM-Wiki-Architecture|LLM Wiki Architecture]]: Compounding knowledge base pattern with persistent markdown artifacts.
- [[Concepts/Vector-RAG|Vector Embeddings & RAG]]: 1536-dimensional semantic retrieval via PostgreSQL pgvector.
- [[Entities/Gemini-3.5|Google Gemini 3.5]]: Native multi-modal LLM powering agent reasoning.
- [[Entities/Obsidian-MCP|Obsidian MCP Server]]: Native Model Context Protocol bridge for note manipulation.
- [[log|Audit Log]]: Chronological event stream of ingests and updates.
`;

      const logContent = `# Knowledge Base Audit Log

## [2026-08-24] init | ContextForge LLM Wiki Initialization
- Created [[index]] catalog
- Added foundation concepts: [[Concepts/Agentic-Core]], [[Concepts/LLM-Wiki-Architecture]], [[Concepts/Vector-RAG]]
- Registered entities: [[Entities/Gemini-3.5]], [[Entities/Obsidian-MCP]]
`;

      const conceptAgentic = `# Agentic AI Core

An autonomous reasoning engine that executes multi-step tasks using tool dispatching, verification checkpoints, and reactive feedback loops.

## ## Key Principles
- **ReAct Loop**: Iterative thought-action-observation cycles.
- **Tool Dispatching**: Bridges reasoning to real-world systems via [[Entities/Obsidian-MCP]] and Notion APIs.
- **Persistent Memory**: Retains user preferences and project context.

## ## Related Concepts
- [[Concepts/LLM-Wiki-Architecture]]
- [[Concepts/Vector-RAG]]
- [[Entities/Gemini-3.5]]
`;

      const conceptWiki = `# LLM Wiki Architecture

A persistent compounding knowledge base pattern sitting between raw source documents and conversational agents.

## ## Mechanism
1. **Raw Sources**: Immutable original documents (PDF, Markdown, Web Clippings).
2. **The Wiki**: High-density synthesized Markdown pages linked with [[Concepts/Agentic-Core]].
3. **The Schema**: Explicit rules governing note creation, contradiction resolution, and log auditing.

## ## Key Differences from Standard RAG
- Knowledge is compiled once and kept current, rather than re-derived from raw chunks on every query.
- Preserves contradictions and cross-topic associative trails.

## ## Related Notes
- [[Concepts/Vector-RAG]]
- [[Entities/Obsidian-MCP]]
- [[index]]
`;

      const conceptRAG = `# Vector Embeddings & RAG

Semantic search pipeline using 1536-dimensional embeddings with PostgreSQL pgvector extension.

## ## Role in ContextForge
- Acts as the fast lookup layer for [[Concepts/LLM-Wiki-Architecture]] raw sources.
- Enables hybrid retrieval combining dense vector similarity with keyword indexing.

## ## Connected Systems
- [[Concepts/Agentic-Core]]
- [[Entities/Gemini-3.5]]
`;

      const pagesToSeed = [
        {
          slug: 'index',
          title: 'Knowledge Wiki Index',
          category: 'index',
          path: 'index.md',
          content: indexContent,
          frontmatter: { category: 'index', tags: ['root', 'index'] },
        },
        {
          slug: 'log',
          title: 'Knowledge Audit Log',
          category: 'log',
          path: 'log.md',
          content: logContent,
          frontmatter: { category: 'log', tags: ['log', 'timeline'] },
        },
        {
          slug: 'concepts-agentic-core',
          title: 'Agentic AI Core',
          category: 'concept',
          path: 'Concepts/Agentic-Core.md',
          content: conceptAgentic,
          frontmatter: {
            category: 'concept',
            tags: ['ai', 'agentic', 'react'],
          },
        },
        {
          slug: 'concepts-llm-wiki-architecture',
          title: 'LLM Wiki Architecture',
          category: 'concept',
          path: 'Concepts/LLM-Wiki-Architecture.md',
          content: conceptWiki,
          frontmatter: {
            category: 'concept',
            tags: ['wiki', 'knowledge', 'architecture'],
          },
        },
        {
          slug: 'concepts-vector-rag',
          title: 'Vector Embeddings & RAG',
          category: 'concept',
          path: 'Concepts/Vector-RAG.md',
          content: conceptRAG,
          frontmatter: {
            category: 'concept',
            tags: ['rag', 'pgvector', 'embeddings'],
          },
        },
      ];

      for (const p of pagesToSeed) {
        const outlinks = this.extractWikilinks(p.content);
        await this.repo.upsertPage({
          slug: p.slug,
          title: p.title,
          category: p.category,
          path: p.path,
          content: p.content,
          frontmatter: p.frontmatter,
          outlinks,
        });

        // Also write to physical Obsidian Vault if available
        await this.obsidianVault
          .createNote(p.title, p.path, p.content, p.frontmatter)
          .catch(() => {});
      }

      await this.recalculateAllBacklinks();
      this.logger.log('✅ Initial LLM Wiki seeded successfully.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Could not seed initial wiki: ${msg}`);
    }
  }

  /**
   * Recalculates backlinks across all pages
   */
  async recalculateAllBacklinks(): Promise<void> {
    const allPages = await this.repo.getAll();
    const backlinksMap: Record<string, Set<string>> = {};

    for (const p of allPages) {
      backlinksMap[p.slug] = backlinksMap[p.slug] || new Set();
    }

    for (const page of allPages) {
      const outlinks = page.outlinks || this.extractWikilinks(page.content);
      for (const link of outlinks) {
        const targetSlug = this.toSlug(link);
        const matched = allPages.find(
          (p) =>
            p.slug === targetSlug ||
            p.title.toLowerCase() === link.toLowerCase() ||
            p.path.toLowerCase().includes(link.toLowerCase()),
        );

        if (matched) {
          backlinksMap[matched.slug] = backlinksMap[matched.slug] || new Set();
          backlinksMap[matched.slug].add(page.title);
        }
      }
    }

    for (const [slug, set] of Object.entries(backlinksMap)) {
      await this.repo.updateBacklinks(slug, Array.from(set));
    }
  }

  async getAllPages(): Promise<WikiPageRecord[]> {
    return this.repo.getAll();
  }

  async getPageBySlug(slug: string): Promise<WikiPageRecord | null> {
    return this.repo.getBySlug(slug);
  }

  async getGraphData(): Promise<WikiGraphData> {
    const pages = await this.repo.getAll();
    const nodes = pages.map((p) => {
      let group = 1;
      if (p.category === 'index') group = 0;
      else if (p.category === 'log') group = 4;
      else if (p.category === 'concept') group = 1;
      else if (p.category === 'entity') group = 2;
      else if (p.category === 'synthesis') group = 3;

      const connectionCount =
        (p.backlinks?.length || 0) + (p.outlinks?.length || 0);
      return {
        id: p.slug,
        label: p.title,
        category: p.category,
        path: p.path,
        val: Math.max(3, connectionCount * 2),
        group,
      };
    });

    const links: Array<{ source: string; target: string; value: number }> = [];

    for (const page of pages) {
      const outlinks = page.outlinks || this.extractWikilinks(page.content);
      for (const link of outlinks) {
        const targetSlug = this.toSlug(link);
        const matched = pages.find(
          (p) =>
            p.slug === targetSlug ||
            p.title.toLowerCase() === link.toLowerCase() ||
            p.path.toLowerCase().includes(link.toLowerCase()),
        );

        if (matched && matched.slug !== page.slug) {
          links.push({
            source: page.slug,
            target: matched.slug,
            value: 1,
          });
        }
      }
    }

    return { nodes, links };
  }

  /**
   * Ingest a raw source document into the LLM Wiki
   */
  async ingestDocument(data: {
    sourceTitle: string;
    content: string;
    tags?: string[];
  }): Promise<{
    success: boolean;
    sourceTitle: string;
    pagesCreated: string[];
    pagesUpdated: string[];
    logEntry: string;
    summary: string;
  }> {
    this.logger.log(
      `📥 Ingesting document into LLM Wiki: "${data.sourceTitle}"`,
    );

    const indexPage = await this.repo.getBySlug('index');
    const modelName = this.configService.get<string>(
      'gemini.defaultModel',
      'gemini-3.5-flash',
    );

    const prompt = getWikiIngestionPrompt(
      data.sourceTitle,
      data.content,
      indexPage?.content,
    );

    const response = await this.ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        systemInstruction: WIKI_COMPILER_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    let compilationResult: CompilationResult = {};
    try {
      const text = response.text || '{}';
      compilationResult = JSON.parse(text) as CompilationResult;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to parse compiler JSON: ${msg}`);
      throw new Error('LLM Wiki Compilation parsing failed.');
    }

    const pagesCreated: string[] = [];
    const pagesUpdated: string[] = [];

    const pages = compilationResult.pagesToCreateOrUpdate || [];
    for (const p of pages) {
      const targetPath =
        p.path || `Concepts/${p.title.replace(/\s+/g, '-')}.md`;
      const slug = this.toSlug(targetPath);
      const existing = await this.repo.getBySlug(slug);
      const outlinks = this.extractWikilinks(p.content);

      await this.repo.upsertPage({
        slug,
        title: p.title,
        category: p.category || 'concept',
        path: targetPath,
        content: p.content,
        frontmatter: {
          title: p.title,
          category: p.category,
          tags: p.tags || data.tags || ['wiki'],
          sources: [data.sourceTitle],
          lastUpdated: new Date().toISOString().slice(0, 10),
        },
        outlinks,
      });

      // Write to mounted Obsidian Vault if configured
      await this.obsidianVault
        .createNote(p.title, targetPath, p.content, { tags: p.tags })
        .catch(() => {});

      if (existing) {
        pagesUpdated.push(p.title);
      } else {
        pagesCreated.push(p.title);
      }
    }

    // Append to index.md
    if (indexPage && compilationResult.indexEntry) {
      const updatedIndexContent = `${indexPage.content.trim()}\n${compilationResult.indexEntry}\n`;
      await this.repo.upsertPage({
        slug: 'index',
        title: 'Knowledge Wiki Index',
        category: 'index',
        path: 'index.md',
        content: updatedIndexContent,
        outlinks: this.extractWikilinks(updatedIndexContent),
      });
      await this.obsidianVault
        .createNote('Knowledge Wiki Index', 'index.md', updatedIndexContent)
        .catch(() => {});
    }

    // Append to log.md
    const logPage = await this.repo.getBySlug('log');
    if (logPage && compilationResult.logEntry) {
      const updatedLogContent = `${logPage.content.trim()}\n\n${compilationResult.logEntry}\n`;
      await this.repo.upsertPage({
        slug: 'log',
        title: 'Knowledge Audit Log',
        category: 'log',
        path: 'log.md',
        content: updatedLogContent,
        outlinks: this.extractWikilinks(updatedLogContent),
      });
      await this.obsidianVault
        .createNote('Knowledge Audit Log', 'log.md', updatedLogContent)
        .catch(() => {});
    }

    await this.recalculateAllBacklinks();

    return {
      success: true,
      sourceTitle: data.sourceTitle,
      pagesCreated,
      pagesUpdated,
      logEntry: compilationResult.logEntry || '',
      summary:
        compilationResult.summary ||
        'Document compiled successfully into LLM Wiki.',
    };
  }

  /**
   * Runs a health check / lint pass over the wiki
   */
  async runLint(): Promise<WikiLintReport> {
    const allPages = await this.repo.getAll();
    const modelName = this.configService.get<string>(
      'gemini.defaultModel',
      'gemini-3.5-flash',
    );

    const summaries = allPages.map((p) => ({
      path: p.path,
      title: p.title,
      category: p.category,
      outlinks: p.outlinks || [],
      contentSnippet: p.content.slice(0, 300),
    }));

    const prompt = getWikiLintPrompt(summaries);

    try {
      const response = await this.ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          systemInstruction: WIKI_COMPILER_SYSTEM_PROMPT,
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      interface LintResponse {
        healthScore?: number;
        issues?: WikiLintReport['issues'];
        suggestedQuestions?: string[];
      }

      const parsed = JSON.parse(response.text || '{}') as LintResponse;
      const totalConnections = allPages.reduce(
        (sum, p) => sum + (p.outlinks?.length || 0),
        0,
      );

      return {
        timestamp: new Date().toISOString(),
        healthScore: parsed.healthScore || 90,
        totalPages: allPages.length,
        totalConnections,
        issues: parsed.issues || [],
        suggestedQuestions: parsed.suggestedQuestions || [],
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Lint analysis error: ${msg}`);

      // Fallback deterministic linting
      const totalConnections = allPages.reduce(
        (sum, p) => sum + (p.outlinks?.length || 0),
        0,
      );
      const orphanPages = allPages.filter(
        (p) =>
          p.category !== 'index' &&
          (!p.backlinks || p.backlinks.length === 0) &&
          (!p.outlinks || p.outlinks.length === 0),
      );

      const issues: WikiLintReport['issues'] = orphanPages.map((op) => ({
        type: 'orphan',
        title: `Orphan Note: ${op.title}`,
        description: `Note ${op.path} has no inbound or outbound links.`,
        pagesInvolved: [op.path],
        suggestion: `Add [[${op.title}]] to index.md or related concept pages.`,
        severity: 'low',
      }));

      return {
        timestamp: new Date().toISOString(),
        healthScore: Math.max(70, 100 - issues.length * 5),
        totalPages: allPages.length,
        totalConnections,
        issues,
        suggestedQuestions: [
          'What are the core technical dependencies between the indexed modules?',
          'Which architecture patterns have the highest cross-references in the wiki?',
        ],
      };
    }
  }

  /**
   * Save a single note (e.g. promoted from chat conversation)
   */
  async saveNote(data: {
    title: string;
    content: string;
    category?: string;
    path?: string;
    tags?: string[];
  }): Promise<WikiPageRecord> {
    const category = data.category || 'synthesis';
    const cleanPath =
      data.path ||
      (category === 'concept'
        ? `Concepts/${data.title.replace(/\s+/g, '-')}.md`
        : `Synthesis/${data.title.replace(/\s+/g, '-')}.md`);
    const slug = this.toSlug(cleanPath);
    const outlinks = this.extractWikilinks(data.content);

    const record = await this.repo.upsertPage({
      slug,
      title: data.title,
      category,
      path: cleanPath,
      content: data.content,
      frontmatter: {
        title: data.title,
        category,
        tags: data.tags || ['chat-synthesis'],
        lastUpdated: new Date().toISOString().slice(0, 10),
      },
      outlinks,
    });

    // Write to physical vault if available
    await this.obsidianVault
      .createNote(data.title, cleanPath, data.content, { tags: data.tags })
      .catch(() => {});

    // Update log
    const logPage = await this.repo.getBySlug('log');
    if (logPage) {
      const today = new Date().toISOString().slice(0, 10);
      const logEntry = `\n## [${today}] synthesis | Saved "${data.title}" from chat session\n- Created [[${cleanPath.replace(/\.md$/, '')}]]`;
      const updatedLog = `${logPage.content.trim()}${logEntry}\n`;
      await this.repo.upsertPage({
        slug: 'log',
        title: 'Knowledge Audit Log',
        category: 'log',
        path: 'log.md',
        content: updatedLog,
        outlinks: this.extractWikilinks(updatedLog),
      });
      await this.obsidianVault
        .createNote('Knowledge Audit Log', 'log.md', updatedLog)
        .catch(() => {});
    }

    await this.recalculateAllBacklinks();
    return record;
  }
}
