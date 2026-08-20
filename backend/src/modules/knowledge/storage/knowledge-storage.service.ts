import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'node:fs';
import * as path from 'node:path';

export interface UploadedFileItem {
  originalname: string;
  size: number;
  buffer: Buffer;
  mimetype?: string;
}

export interface SavedFileInfo {
  originalName: string;
  size: number;
  savedPath: string;
  mimeType?: string;
}

export interface ExtractedDocument {
  filePath: string;
  title: string;
  content: string;
  size: number;
}

@Injectable()
export class KnowledgeStorageService {
  private readonly logger = new Logger(KnowledgeStorageService.name);
  private readonly baseUploadDir: string;

  constructor() {
    this.baseUploadDir = path.join(process.cwd(), 'storage', 'uploads');
    this.ensureDirectoryExists(this.baseUploadDir);
  }

  /**
   * Saves uploaded multipart files into an isolated directory for the given sourceId
   */
  saveUploadedFiles(
    sourceId: string,
    files: UploadedFileItem[],
  ): SavedFileInfo[] {
    const sourceDir = path.join(this.baseUploadDir, sourceId);
    this.ensureDirectoryExists(sourceDir);

    const savedFiles: SavedFileInfo[] = [];

    for (const file of files) {
      const sanitizedName = path
        .basename(file.originalname)
        .replace(/[^a-zA-Z0-9._-]/g, '_');
      const targetPath = path.join(sourceDir, sanitizedName);

      fs.writeFileSync(targetPath, file.buffer);
      savedFiles.push({
        originalName: file.originalname,
        size: file.size,
        savedPath: targetPath,
        mimeType: file.mimetype,
      });

      this.logger.log(
        `Saved uploaded file: ${sanitizedName} (${file.size} bytes) for source ${sourceId}`,
      );
    }

    return savedFiles;
  }

  /**
   * Reads all documents stored in a source directory and extracts text for chunking & embedding
   */
  readDocumentsForSource(sourceId: string): ExtractedDocument[] {
    const sourceDir = path.join(this.baseUploadDir, sourceId);
    if (!fs.existsSync(sourceDir)) {
      return [];
    }

    const documents: ExtractedDocument[] = [];
    const files = this.scanDirRecursive(sourceDir);

    for (const filePath of files) {
      try {
        const stats = fs.statSync(filePath);
        const relPath = path.relative(sourceDir, filePath);
        const title = path.basename(filePath, path.extname(filePath));
        const content = this.extractTextContent(filePath);

        if (content.trim().length > 0) {
          documents.push({
            filePath: relPath,
            title,
            content,
            size: stats.size,
          });
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Could not read file ${filePath}: ${msg}`);
      }
    }

    return documents;
  }

  /**
   * Extracts text content from text, markdown, code, and document files
   */
  extractTextContent(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();

    // Plain text & Code formats
    const textExtensions = [
      '.md',
      '.txt',
      '.json',
      '.csv',
      '.ts',
      '.tsx',
      '.js',
      '.jsx',
      '.py',
      '.sql',
      '.html',
      '.css',
      '.yaml',
      '.yml',
      '.xml',
      '.env',
      '.sh',
    ];

    if (textExtensions.includes(ext)) {
      return fs.readFileSync(filePath, 'utf-8');
    }

    // Binary / PDF / DOC fallback: extract printable UTF-8 characters
    try {
      const buffer = fs.readFileSync(filePath);
      const str = buffer.toString('utf-8');
      return str.replace(/[^\x20-\x7E\n\r\t]/g, ' ');
    } catch {
      return '';
    }
  }

  /**
   * Deletes uploaded files and folder for a given sourceId
   */
  deleteStorageForSource(sourceId: string): void {
    const sourceDir = path.join(this.baseUploadDir, sourceId);
    if (fs.existsSync(sourceDir)) {
      try {
        fs.rmSync(sourceDir, { recursive: true, force: true });
        this.logger.log(`Deleted upload directory for source ${sourceId}`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.error(`Failed to delete directory ${sourceDir}: ${msg}`);
      }
    }
  }

  private scanDirRecursive(dirPath: string): string[] {
    let results: string[] = [];
    if (!fs.existsSync(dirPath)) return results;

    const list = fs.readdirSync(dirPath);
    for (const item of list) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        results = results.concat(this.scanDirRecursive(fullPath));
      } else {
        results.push(fullPath);
      }
    }
    return results;
  }

  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }
}
