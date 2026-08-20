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

@Controller('api/knowledge')
export class KnowledgeController {
  constructor(private readonly service: KnowledgeService) {}

  @Get('sources')
  async getAllSources() {
    const data = await this.service.getAllSources();
    return { success: true, data };
  }

  @Get('sources/:id')
  async getSourceById(@Param('id') id: string) {
    const data = await this.service.getSourceById(id);
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
  ) {
    const data = await this.service.createSource(body);
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
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided for upload.');
    }
    const data = await this.service.handleUploadDocuments(
      files,
      name,
      sourceId,
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
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 5;
    const results = await this.service.searchKnowledge(query, parsedLimit);
    return { success: true, count: results.length, data: results };
  }
}
