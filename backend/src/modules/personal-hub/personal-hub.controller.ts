import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { PersonalHubService } from './personal-hub.service';

@Controller('api/personal-hub')
export class PersonalHubController {
  constructor(private readonly service: PersonalHubService) {}

  // Memories
  @Get('memories')
  async getUserMemories() {
    const data = await this.service.getUserMemories();
    return { success: true, data };
  }

  @Get('memory-summary')
  async getMemorySummary() {
    const summary = await this.service.getMemorySummaryMarkdown();
    return { success: true, data: { summary } };
  }

  @Post('memories')
  async createUserMemory(
    @Body()
    body: {
      category: 'profile' | 'preference' | 'project' | 'workflow';
      key: string;
      value: string;
    },
  ) {
    const data = await this.service.createUserMemory(body);
    return { success: true, data };
  }

  @Delete('memories')
  async clearAllMemories() {
    const data = await this.service.clearAllMemories();
    return { success: true, data };
  }

  @Delete('memories/:id')
  async deleteUserMemory(@Param('id') id: string) {
    const data = await this.service.deleteUserMemory(id);
    return { success: true, data };
  }
}
