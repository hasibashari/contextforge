import { Module } from '@nestjs/common';
import { DatabaseModule } from '../common/database/database.module';
import { ObsidianVaultService } from './internal/obsidian/obsidian-vault.service';
import { ObsidianMcpServer } from './internal/obsidian/obsidian-mcp.server';
import { McpHttpClient } from './remote/clients/mcp-http.client';
import { McpSseClient } from './remote/clients/mcp-sse.client';
import { NotionApiClient } from './remote/connectors/notion/notion-api.client';
import { NotionMcpConnector } from './remote/connectors/notion/notion-mcp.connector';
import { McpGatewayService } from './mcp-gateway.service';

import { ObsidianBridgeGatewayService } from './internal/obsidian/obsidian-bridge.gateway';

@Module({
  imports: [DatabaseModule],
  providers: [
    ObsidianBridgeGatewayService,
    ObsidianVaultService,
    ObsidianMcpServer,
    McpHttpClient,
    McpSseClient,
    NotionApiClient,
    NotionMcpConnector,
    McpGatewayService,
  ],
  exports: [
    ObsidianBridgeGatewayService,
    McpGatewayService,
    ObsidianVaultService,
    ObsidianMcpServer,
    NotionApiClient,
    NotionMcpConnector,
    McpHttpClient,
    McpSseClient,
  ],
})
export class McpModule {}
