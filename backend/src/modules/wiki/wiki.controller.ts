import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { WikiService } from './wiki.service';

@Controller('api/wiki')
export class WikiController {
  constructor(private readonly wikiService: WikiService) {}

  @Get('pages')
  async getAllPages() {
    const pages = await this.wikiService.getAllPages();
    return {
      success: true,
      count: pages.length,
      data: pages,
    };
  }

  @Get('graph')
  async getGraphData() {
    const graph = await this.wikiService.getGraphData();
    return {
      success: true,
      data: graph,
    };
  }

  @Get('pages/:slug')
  async getPageBySlug(@Param('slug') slug: string) {
    const page = await this.wikiService.getPageBySlug(slug);
    if (!page) {
      throw new NotFoundException(`Wiki page "${slug}" not found.`);
    }
    return {
      success: true,
      data: page,
    };
  }

  @Post('ingest')
  async ingestDocument(
    @Body()
    body: {
      sourceTitle: string;
      content: string;
      tags?: string[];
    },
  ) {
    const result = await this.wikiService.ingestDocument(body);
    return {
      success: true,
      data: result,
    };
  }

  @Post('lint')
  async runLint() {
    const report = await this.wikiService.runLint();
    return {
      success: true,
      data: report,
    };
  }

  @Post('save-note')
  async saveNote(
    @Body()
    body: {
      title: string;
      content: string;
      category?: string;
      path?: string;
      tags?: string[];
    },
  ) {
    const note = await this.wikiService.saveNote(body);
    return {
      success: true,
      data: note,
    };
  }
}
