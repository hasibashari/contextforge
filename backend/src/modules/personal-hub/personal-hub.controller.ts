import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { PersonalHubService } from './personal-hub.service';

@Controller('api/personal-hub')
export class PersonalHubController {
  constructor(private readonly service: PersonalHubService) {}

  // Calendar
  @Get('calendar')
  async getCalendarEvents() {
    const data = await this.service.getCalendarEvents();
    return { success: true, data };
  }

  @Post('calendar')
  async createCalendarEvent(
    @Body()
    body: {
      title: string;
      eventDate: string;
      eventTime: string;
      duration?: string;
      location?: string;
      status?: 'upcoming' | 'in_progress' | 'completed';
      category?: 'meeting' | 'task' | 'review' | 'personal';
      attendees?: string[];
    },
  ) {
    const data = await this.service.createCalendarEvent(body);
    return { success: true, data };
  }

  @Patch('calendar/:id/status')
  async updateCalendarStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    const data = await this.service.updateCalendarEventStatus(id, status);
    return { success: true, data };
  }

  @Delete('calendar/:id')
  async deleteCalendarEvent(@Param('id') id: string) {
    const data = await this.service.deleteCalendarEvent(id);
    return { success: true, data };
  }

  // Memories
  @Get('memories')
  async getUserMemories() {
    const data = await this.service.getUserMemories();
    return { success: true, data };
  }

  @Post('memories')
  async createUserMemory(
    @Body() body: { category: any; key: string; value: string },
  ) {
    const data = await this.service.createUserMemory(body);
    return { success: true, data };
  }

  @Delete('memories/:id')
  async deleteUserMemory(@Param('id') id: string) {
    const data = await this.service.deleteUserMemory(id);
    return { success: true, data };
  }
}
