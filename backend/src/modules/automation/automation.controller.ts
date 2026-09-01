import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { AutomationService } from './automation.service';
import { AutomationSchedulerService } from './automation-scheduler.service';
import { CreateAutomationDto, UpdateAutomationDto } from './dto/automation.dto';
import { GuestId } from '../../common/decorators/guest-id.decorator';

@Controller('api/automations')
export class AutomationController {
  constructor(
    private readonly service: AutomationService,
    private readonly scheduler: AutomationSchedulerService,
  ) {}

  @Get()
  async getAll(@GuestId() guestId?: string) {
    const data = await this.service.getAllAutomations(guestId);
    return { success: true, data };
  }

  @Get('scheduler/status')
  async getSchedulerStatus() {
    const data = await this.scheduler.getSchedulerStatus();
    return { success: true, data };
  }

  @Post('scheduler/tick')
  async triggerSchedulerTick(@Body('source') source?: string) {
    const data = await this.scheduler.triggerTick(source || 'cloud-scheduler');
    return { success: true, data };
  }

  @Get('runs')
  async getAllRuns() {
    const data = await this.service.getAllRuns();
    return { success: true, data };
  }

  @Get('runs/export')
  async exportRuns(@Res() res: Response) {
    const runs = await this.service.getAllRuns();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=contextforge_automation_audit.json',
    );
    res.send(JSON.stringify(runs, null, 2));
  }

  @Get(':id')
  async getById(@Param('id') id: string, @GuestId() guestId?: string) {
    const data = await this.service.getAutomationById(id, guestId);
    return { success: true, data };
  }

  @Post()
  async create(@Body() body: CreateAutomationDto, @GuestId() guestId?: string) {
    const entity = CreateAutomationDto.toEntity(body);
    const data = await this.service.createAutomation(entity, guestId);
    return { success: true, data };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: UpdateAutomationDto) {
    const updates = UpdateAutomationDto.toEntity(body);
    const data = await this.service.updateAutomation(id, updates);
    return { success: true, data };
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    const data = await this.service.deleteAutomation(id);
    return { success: true, data };
  }

  @Post(':id/run')
  async run(@Param('id') id: string) {
    const data = await this.service.triggerRun(id);
    return { success: true, data };
  }
}
