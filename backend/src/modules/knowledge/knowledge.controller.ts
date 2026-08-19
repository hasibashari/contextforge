import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { KnowledgeService } from './knowledge.service';

@Controller('api/knowledge')
export class KnowledgeController {
  constructor(private readonly service: KnowledgeService) {}

  @Get('sources')
  async getAllSources() {
    const data = await this.service.getAllSources();
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

  @Delete('sources/:id')
  async deleteSource(@Param('id') id: string) {
    const data = await this.service.deleteSource(id);
    return { success: true, data };
  }
}
