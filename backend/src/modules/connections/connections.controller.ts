import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { ConnectionsService } from './connections.service';
import type { WorkspaceConnectionRow } from './connections.repository';

@Controller('api/connections')
export class ConnectionsController {
  constructor(private readonly service: ConnectionsService) {}

  @Get()
  async getConnections() {
    const data = await this.service.getConnections();
    return { success: true, data };
  }

  @Get(':id')
  async getConnectionById(@Param('id') id: string) {
    const data = await this.service.getConnectionById(id);
    return { success: true, data };
  }

  @Post()
  async createConnection(
    @Body()
    body: {
      id?: string;
      name: string;
      connectionType: WorkspaceConnectionRow['connection_type'];
      provider: string;
      authType: WorkspaceConnectionRow['auth_type'];
      endpointUrl?: string;
      config?: Record<string, any>;
    },
  ) {
    const data = await this.service.createConnection(body);
    return {
      success: true,
      data,
      message: `Connection "${data.name}" created successfully`,
    };
  }

  @Patch(':id')
  async updateConnection(
    @Param('id') id: string,
    @Body() updates: Partial<WorkspaceConnectionRow>,
  ) {
    const data = await this.service.updateConnection(id, updates);
    return {
      success: true,
      data,
      message: `Connection ${id} updated successfully`,
    };
  }

  @Post(':id/test')
  async testConnection(@Param('id') id: string) {
    const data = await this.service.testConnection(id);
    return {
      success: true,
      data,
      message: data.message,
    };
  }

  @Delete(':id')
  async deleteConnection(@Param('id') id: string) {
    await this.service.deleteConnection(id);
    return {
      success: true,
      message: `Connection ${id} deleted successfully`,
    };
  }
}
