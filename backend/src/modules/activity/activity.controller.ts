import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ActivityService } from './activity.service';

@Controller('api/activity')
export class ActivityController {
  constructor(private readonly service: ActivityService) {}

  @Get('logs')
  async getLogs() {
    const data = await this.service.getAllLogs();
    return { success: true, data };
  }

  @Get('export')
  async exportLogs(@Res() res: Response) {
    const logs = await this.service.getAllLogs();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=contextforge_activity_audit.json',
    );
    res.send(JSON.stringify(logs, null, 2));
  }
}
