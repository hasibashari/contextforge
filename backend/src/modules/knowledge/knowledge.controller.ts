import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { KnowledgeService } from './knowledge.service';
import { GuestId } from '../../common/decorators/guest-id.decorator';

@Controller('api/knowledge')
export class KnowledgeController {
  constructor(private readonly service: KnowledgeService) {}

  @Get('sources')
  async getAllSources(@GuestId() guestId?: string) {
    const data = await this.service.getAllSources(guestId);
    return { success: true, data };
  }

  @Get('sources/:id')
  async getSourceById(@Param('id') id: string, @GuestId() guestId?: string) {
    const data = await this.service.getSourceById(id, guestId);
    return { success: true, data };
  }

  @Post('sources')
  async createSource(
    @Body()
    body: {
      type: string;
      name: string;
      description: string;
      location: string;
      meta?: string;
      iconType?: string;
      color?: string;
    },
    @GuestId() guestId?: string,
  ) {
    const data = await this.service.createSource(body, guestId);
    return { success: true, data };
  }

  @Patch('sources/:id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: 'synced' | 'disconnected',
  ) {
    const data = await this.service.updateStatus(id, status);
    return { success: true, data };
  }

  @Delete('sources/:id')
  async deleteSource(@Param('id') id: string) {
    const data = await this.service.deleteSource(id);
    return { success: true, data };
  }

  @Post('ingest-documents')
  async ingestDocuments(
    @Body()
    body: {
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
    },
  ) {
    if (!body.documents || body.documents.length === 0) {
      throw new BadRequestException(
        'No document contents provided for direct ingestion.',
      );
    }
    const data = await this.service.ingestDocumentsDirectly(body);
    return { success: true, data };
  }

  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 20))
  async uploadDocuments(
    @UploadedFiles()
    files: Array<{
      originalname: string;
      size: number;
      buffer: Buffer;
      mimetype?: string;
    }>,
    @Body('name') name: string,
    @Body('sourceId') sourceId?: string,
    @GuestId() guestId?: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided for upload.');
    }
    const data = await this.service.handleUploadDocuments(
      files,
      name,
      sourceId,
      guestId,
    );
    return { success: true, data };
  }

  @Post('sources/:id/sync')
  async syncSource(@Param('id') id: string) {
    const result = await this.service.syncSource(id);
    return { success: true, data: result };
  }

  @Get('sources/:id/chunks')
  async getSourceChunks(
    @Param('id') id: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    const data = await this.service.getSourceChunks(id, parsedLimit);
    return { success: true, count: data.length, data };
  }

  @Get('search')
  async searchKnowledge(
    @Query('q') query: string,
    @Query('limit') limit?: string,
    @GuestId() guestId?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 5;
    const results = await this.service.searchKnowledge(
      query,
      parsedLimit,
      guestId,
    );
    return { success: true, count: results.length, data: results };
  }
}
