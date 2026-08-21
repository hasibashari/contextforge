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
import type { AutomationWorkflowRow } from './automation.repository';

@Controller('api/automations')
export class AutomationController {
  constructor(private readonly service: AutomationService) {}

  @Get()
  async getAll() {
    const data = await this.service.getAllAutomations();
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
  async getById(@Param('id') id: string) {
    const data = await this.service.getAutomationById(id);
    return { success: true, data };
  }

  @Post()
  async create(@Body() body: Partial<AutomationWorkflowRow>) {
    const data = await this.service.createAutomation(body);
    return { success: true, data };
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: Partial<AutomationWorkflowRow>,
  ) {
    const data = await this.service.updateAutomation(id, body);
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
