import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import {
  KnowledgeRepository,
  KnowledgeSourceRow,
  KnowledgeChunkRow,
  SearchResultChunk,
} from './knowledge.repository';
import { KnowledgeChunkerService } from '../../agentic-core/embeddings/knowledge-chunker.service';
import { EmbeddingService } from '../../agentic-core/embeddings/embedding.service';

@Injectable()
export class KnowledgeService {
  private readonly logger = new Logger(KnowledgeService.name);

  constructor(
    private readonly repo: KnowledgeRepository,
    private readonly chunker: KnowledgeChunkerService,
    private readonly embedding: EmbeddingService,
    private readonly configService: ConfigService,
  ) {}

  async getAllSources(guestId?: string): Promise<KnowledgeSourceRow[]> {
    return this.repo.getAllSources(guestId);
  }

  async getSourceById(
    id: string,
    guestId?: string,
  ): Promise<KnowledgeSourceRow | null> {
    return this.repo.getSourceById(id, guestId);
  }

  async createSource(
    data: {
      type: string;
      name: string;
      description: string;
      location: string;
      meta?: string;
      iconType?: string;
      color?: string;
    },
    guestId?: string,
  ): Promise<KnowledgeSourceRow> {
    const source = await this.repo.createSource(data, guestId);
    // Trigger initial indexing in background
    this.syncSource(source.id).catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Initial sync failed for ${source.id}: ${msg}`);
    });
    return source;
  }

  async handleUploadDocuments(
    files: Array<{
      originalname: string;
      size: number;
      buffer: Buffer;
      mimetype?: string;
    }>,
    name: string,
    sourceId?: string,
    guestId?: string,
  ): Promise<KnowledgeSourceRow> {
    let source: KnowledgeSourceRow;

    if (sourceId) {
      const existing = await this.repo.getSourceById(sourceId, guestId);
      if (!existing) {
        throw new Error(`Knowledge source ${sourceId} not found`);
      }
      source = existing;
    } else {
      source = await this.repo.createSource(
        {
          type: 'document_upload',
          name: name || `Uploaded Documents (${files.length} files)`,
          description: `Direct document uploads indexed into 1536-dim vector embeddings.`,
          location: `upload://documents/${Date.now()}`,
          iconType: 'upload',
          color: 'text-primary',
          meta: `${files.length} files uploaded`,
        },
        guestId,
      );
    }

    // Convert in-memory buffer directly to text documents (Zero disk duplication)
    const documents = files.map((file) => ({
      filePath: file.originalname,
      title: path.basename(file.originalname, path.extname(file.originalname)),
      content: file.buffer.toString('utf-8'),
    }));

    await this.indexDocumentsList(source, documents);

    return (await this.repo.getSourceById(source.id, guestId)) || source;
  }

  async updateStatus(
    id: string,
    status: 'synced' | 'disconnected',
  ): Promise<KnowledgeSourceRow | null> {
    return this.repo.updateSource(id, { status });
  }

  async deleteSource(id: string): Promise<{ success: boolean }> {
    await this.repo.deleteChunksBySourceId(id);
    await this.repo.deleteSource(id);
    return { success: true };
  }

  async getSourceChunks(
    sourceId: string,
    limit = 50,
  ): Promise<KnowledgeChunkRow[]> {
    return this.repo.getChunksBySourceId(sourceId, limit);
  }

  async searchKnowledge(
    query: string,
    limit = 5,
    guestId?: string,
  ): Promise<SearchResultChunk[]> {
    if (!query || query.trim().length === 0) return [];
    const queryEmbedding = await this.embedding.embedText(query);
    return this.repo.searchSimilarChunks(
      queryEmbedding,
      limit,
      0.15,
      query,
      guestId,
    );
  }

  /**
   * Direct Document Ingestion from Client (Zero server filesystem duplication)
   * Saves source metadata and embeds chunks directly into PostgreSQL pgvector
   */
  async ingestDocumentsDirectly(data: {
    sourceId?: string;
    name: string;
    type: string;
    location: string;
    description?: string;
    documents: Array<{
      filePath: string;
      title: string;
      content: string;
    }>;
  }): Promise<KnowledgeSourceRow> {
    let source: KnowledgeSourceRow;

    if (data.sourceId) {
      const existing = await this.repo.getSourceById(data.sourceId);
      if (!existing) {
        throw new Error(`Knowledge source ${data.sourceId} not found`);
      }
      source = existing;
    } else {
      source = await this.repo.createSource({
        type: data.type || 'obsidian_vault',
        name: data.name,
        description:
          data.description ||
          `Live paired ${data.type === 'obsidian_vault' ? 'Obsidian Vault' : 'Local Folder'} indexed directly into PostgreSQL.`,
        location: data.location || `paired://${data.name}`,
        iconType: data.type === 'obsidian_vault' ? 'book' : 'folder',
        color: 'text-primary',
        meta: `${data.documents.length} files paired`,
      });
    }

    // Index documents directly into PostgreSQL knowledge_chunks
    await this.indexDocumentsList(source, data.documents);

    return (await this.repo.getSourceById(source.id)) || source;
  }

  /**
   * Main Document Ingestion & 1536-dim Vector Embedding Pipeline
   */
  async syncSource(
    sourceId: string,
  ): Promise<{ success: boolean; chunksCount: number; filesCount: number }> {
    const source = await this.repo.getSourceById(sourceId);
    if (!source) {
      throw new Error(`Knowledge source with ID "${sourceId}" not found.`);
    }

    const documents = this.gatherDocumentsForSource(source);
    return this.indexDocumentsList(source, documents);
  }

  /**
   * Internal reusable document chunker, vectorizer, and PostgreSQL inserter
   */
  private async indexDocumentsList(
    source: KnowledgeSourceRow,
    documents: Array<{ filePath: string; title: string; content: string }>,
  ): Promise<{ success: boolean; chunksCount: number; filesCount: number }> {
    const sourceId = source.id;
    this.logger.log(
      `Starting vector indexing for source "${source.name}" (${source.type}, ${documents.length} documents)...`,
    );
    await this.repo.updateSource(sourceId, { status: 'syncing' });

    try {
      // 1. Clear previous chunks for this source
      await this.repo.deleteChunksBySourceId(sourceId);

      // 2. Chunk and Embed all documents
      const allChunksToInsert: Array<{
        filePath: string;
        chunkIndex: number;
        chunkContent: string;
        embedding: number[];
        metadata: Record<string, unknown>;
      }> = [];

      for (const doc of documents) {
        if (!doc.content || doc.content.trim().length === 0) continue;

        const textChunks = this.chunker.chunkText(doc.content, 600, 100, {
          title: doc.title,
          sourceName: source.name,
          sourceType: source.type,
        });

        if (textChunks.length === 0) continue;

        const texts = textChunks.map((tc) => tc.content);
        const embeddings = await this.embedding.embedBatch(texts);

        for (let i = 0; i < textChunks.length; i++) {
          allChunksToInsert.push({
            filePath: doc.filePath,
            chunkIndex: textChunks[i].chunkIndex,
            chunkContent: textChunks[i].content,
            embedding: embeddings[i],
            metadata: {
              title: doc.title,
              wordCount: textChunks[i].wordCount,
              sourceType: source.type,
              indexedAt: new Date().toISOString(),
            },
          });
        }
      }

      // 3. Save to PostgreSQL
      if (allChunksToInsert.length > 0) {
        await this.repo.insertChunks(sourceId, allChunksToInsert);
      }

      // 4. Update source metadata & status
      const filesCount = documents.length;
      const chunksCount = allChunksToInsert.length;
      await this.repo.updateSource(sourceId, {
        status: 'synced',
        files_count: filesCount,
        chunks_count: chunksCount,
        meta: `${filesCount} files · ${chunksCount} 1536-dim vector chunks`,
        last_synced: new Date(),
      });

      this.logger.log(
        `Successfully indexed ${chunksCount} vector chunks for source "${source.name}".`,
      );
      return { success: true, chunksCount, filesCount };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Error during indexing for source ${sourceId}: ${errorMsg}`,
      );
      await this.repo.updateSource(sourceId, { status: 'error' });
      throw err;
    }
  }

  private gatherDocumentsForSource(
    source: KnowledgeSourceRow,
  ): Array<{ filePath: string; title: string; content: string }> {
    const documents: Array<{
      filePath: string;
      title: string;
      content: string;
    }> = [];

    // Pillar 1: Obsidian Vault (Mounted via Local Path or MCP Connection Target)
    if (source.type === 'obsidian_vault') {
      const vaultBasePath = source.location
        .replace(/^file:\/\//, '')
        .replace(/^obsidian:\/\/vault\/?/, '');

      if (vaultBasePath && fs.existsSync(vaultBasePath)) {
        const files = this.scanDirectoryFiles(vaultBasePath, ['.md', '.txt']);
        for (const f of files) {
          try {
            const content = fs.readFileSync(f, 'utf-8');
            const relPath = path.relative(vaultBasePath, f);
            const title = path.basename(f, path.extname(f));
            documents.push({ filePath: relPath, title, content });
          } catch {
            // ignore unreadable
          }
        }
      }
      return documents;
    }

    // Pillar 3: Server Local Folder / Self-Hosted Path
    if (source.type === 'local_folder') {
      const localPath = source.location.replace(/^file:\/\//, '');
      if (fs.existsSync(localPath)) {
        const files = this.scanDirectoryFiles(localPath, [
          '.md',
          '.txt',
          '.json',
          '.ts',
          '.sql',
        ]);
        for (const f of files) {
          try {
            const content = fs.readFileSync(f, 'utf-8');
            const relPath = path.relative(localPath, f);
            const title = path.basename(f, path.extname(f));
            documents.push({ filePath: relPath, title, content });
          } catch {
            // ignore
          }
        }
      }
      if (documents.length > 0) return documents;
    }

    // Fallback: General documentation or description
    documents.push({
      filePath: `${source.name.toLowerCase().replace(/\s+/g, '-')}-overview.md`,
      title: source.name,
      content: `# ${source.name}\n\n${source.description || 'Knowledge source for ContextForge AI system.'}\n\nLocation: ${source.location}`,
    });

    return documents;
  }

  private scanDirectoryFiles(dir: string, extensions: string[]): string[] {
    const results: string[] = [];
    if (!fs.existsSync(dir)) return results;

    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (
        item.isDirectory() &&
        !item.name.startsWith('.') &&
        item.name !== 'node_modules'
      ) {
        results.push(...this.scanDirectoryFiles(fullPath, extensions));
      } else if (
        item.isFile() &&
        extensions.some((ext) => item.name.endsWith(ext))
      ) {
        results.push(fullPath);
      }
    }
    return results;
  }
}
