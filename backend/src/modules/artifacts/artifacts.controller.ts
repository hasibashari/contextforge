import { Controller, Get, Put, Delete, Param, Body } from '@nestjs/common';
import { ArtifactsService } from './artifacts.service';

@Controller('api/artifacts')
export class ArtifactsController {
  constructor(private readonly service: ArtifactsService) {}

  @Get()
  async getAll() {
    const data = await this.service.getAll();
    return { success: true, data };
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const data = await this.service.getById(id);
    return { success: true, data };
  }

  @Put(':id')
  async updateContent(
    @Param('id') id: string,
    @Body('content') content: string,
  ) {
    const data = await this.service.updateContent(id, content);
    return { success: true, data };
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    const data = await this.service.delete(id);
    return { success: true, data };
  }
}
