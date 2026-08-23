import { Module } from '@nestjs/common';
import { DatabaseModule } from '../common/database/database.module';
import { ObsidianVaultService } from './internal/obsidian/obsidian-vault.service';
import { ObsidianMcpServer } from './internal/obsidian/obsidian-mcp.server';
import { McpHttpClient } from './remote/clients/mcp-http.client';
import { McpSseClient } from './remote/clients/mcp-sse.client';
import { NotionMcpConnector } from './remote/connectors/notion/notion-mcp.connector';
import { McpGatewayService } from './mcp-gateway.service';

@Module({
  imports: [DatabaseModule],
  providers: [
    ObsidianVaultService,
    ObsidianMcpServer,
    McpHttpClient,
    McpSseClient,
    NotionMcpConnector,
    McpGatewayService,
  ],
  exports: [
    McpGatewayService,
    ObsidianVaultService,
    ObsidianMcpServer,
    NotionMcpConnector,
    McpHttpClient,
    McpSseClient,
  ],
})
export class McpModule {}
