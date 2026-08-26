import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Res,
  Query,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { ChatService } from './chat.service';
import { GuestId } from '../../common/decorators/guest-id.decorator';

@Controller('api/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('sessions')
  async getSessions(@GuestId() guestId?: string) {
    const data = await this.chatService.getAllSessions(guestId);
    return { success: true, data };
  }

  @Post('sessions')
  async createSession(
    @Body('title') title?: string,
    @GuestId() guestId?: string,
  ) {
    const data = await this.chatService.createSession(title, guestId);
    return { success: true, data };
  }

  @Get('sessions/:id')
  async getSessionById(@Param('id') id: string, @GuestId() guestId?: string) {
    const data = await this.chatService.getSessionById(id, guestId);
    return { success: true, data };
  }

  @Patch('sessions/:id')
  async updateSession(@Param('id') id: string, @Body('title') title: string) {
    const data = await this.chatService.updateSessionTitle(id, title);
    return { success: true, data };
  }

  @Delete('sessions/:id')
  async deleteSession(@Param('id') id: string, @GuestId() guestId?: string) {
    const data = await this.chatService.deleteSession(id, guestId);
    return { success: true, data };
  }

  @Post('sessions/:id/messages')
  async sendMessage(
    @Param('id') id: string,
    @Body('prompt') prompt: string,
    @Body('agentId') agentId: string | undefined,
    @Query('stream') stream: string,
    @Res() res: Response,
    @GuestId() guestId?: string,
  ) {
    if (stream === 'true' || stream === '1') {
      return this.chatService.sendMessageStream(
        id,
        prompt,
        res,
        agentId,
        guestId,
      );
    }

    let responseData: Record<string, unknown> | null = null;
    const mockRes = {
      setHeader: () => {},
      flushHeaders: () => {},
      write: (chunk: string) => {
        if (chunk.includes('assistant_message')) {
          const match = chunk.match(/data:\s*(.*)/);
          if (match) {
            try {
              responseData = JSON.parse(match[1]) as Record<string, unknown>;
            } catch {
              // ignore parse errors
            }
          }
        }
      },
      end: () => {
        res.status(HttpStatus.OK).json({ success: true, data: responseData });
      },
    };

    await this.chatService.sendMessageStream(
      id,
      prompt,
      mockRes as unknown as Response,
      agentId,
    );
  }

  @Post('morning-briefing')
  async triggerMorningBriefing(
    @Body('sessionId') sessionId: string,
    @Res() res: Response,
  ) {
    return this.chatService.generateMorningBriefing(sessionId, res);
  }
}
