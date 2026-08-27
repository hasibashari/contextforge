import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { PersonalHubService } from './personal-hub.service';
import { GuestId } from '../../common/decorators/guest-id.decorator';

@Controller('api/personal-hub')
export class PersonalHubController {
  constructor(private readonly service: PersonalHubService) {}

  // Memories
  @Get('memories')
  async getUserMemories(@GuestId() guestId?: string) {
    const data = await this.service.getUserMemories(guestId);
    return { success: true, data };
  }

  @Get('memory-summary')
  async getMemorySummary(@GuestId() guestId?: string) {
    const summary = await this.service.getMemorySummaryMarkdown(guestId);
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
    @GuestId() guestId?: string,
  ) {
    const data = await this.service.createUserMemory({ ...body, guestId });
    return { success: true, data };
  }

  @Delete('memories')
  async clearAllMemories(@GuestId() guestId?: string) {
    const data = await this.service.clearAllMemories(guestId);
    return { success: true, data };
  }

  @Delete('memories/:id')
  async deleteUserMemory(@Param('id') id: string, @GuestId() guestId?: string) {
    const data = await this.service.deleteUserMemory(id, guestId);
    return { success: true, data };
  }
}
