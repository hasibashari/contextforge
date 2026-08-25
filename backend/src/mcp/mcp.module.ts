import { Module } from '@nestjs/common';
import { DatabaseModule } from '../common/database/database.module';
import { SecurityModule } from '../common/security/security.module';
import {
  McpRegistryService,
  McpHttpTransport,
  McpSseTransport,
  MCP_SERVERS,
  MCP_OAUTH_HANDLERS,
} from './core';
import { McpGatewayService } from './mcp-gateway.service';
import { McpOAuthController } from './controllers/mcp-oauth.controller';
import { ObsidianVaultService } from './connectors/obsidian/obsidian-vault.service';
import { ObsidianMcpServer } from './connectors/obsidian/obsidian-mcp.server';
import { ObsidianBridgeGatewayService } from './connectors/obsidian/obsidian-bridge.gateway';
import { NotionApiClient } from './connectors/notion/notion-api.client';
import { NotionMcpConnector } from './connectors/notion/notion-mcp.connector';
import { NotionOAuthService } from './connectors/notion/notion-oauth.service';
import { GoogleCalendarApiClient } from './connectors/google-calendar/google-calendar-api.client';
import { GoogleCalendarMcpConnector } from './connectors/google-calendar/google-calendar-mcp.connector';
import { GoogleCalendarOAuthService } from './connectors/google-calendar/google-calendar-oauth.service';
import { AndroidBridgeApiClient } from './connectors/android-bridge/android-bridge-api.client';
import { AndroidBridgeMcpConnector } from './connectors/android-bridge/android-bridge-mcp.connector';
import { AndroidBridgeGatewayService } from './connectors/android-bridge/android-bridge.gateway';

@Module({
  imports: [DatabaseModule, SecurityModule],
  controllers: [McpOAuthController],
  providers: [
    McpRegistryService,
    ObsidianBridgeGatewayService,
    ObsidianVaultService,
    ObsidianMcpServer,
    McpHttpTransport,
    McpSseTransport,
    NotionApiClient,
    NotionMcpConnector,
    NotionOAuthService,
    GoogleCalendarApiClient,
    GoogleCalendarMcpConnector,
    GoogleCalendarOAuthService,
    AndroidBridgeApiClient,
    AndroidBridgeGatewayService,
    AndroidBridgeMcpConnector,
    McpGatewayService,

    // Multi-Provider for MCP Servers (Plug-and-Play)
    {
      provide: MCP_SERVERS,
      useFactory: (
        obsidian: ObsidianMcpServer,
        notion: NotionMcpConnector,
        gcal: GoogleCalendarMcpConnector,
        android: AndroidBridgeMcpConnector,
      ) => [obsidian, notion, gcal, android],
      inject: [
        ObsidianMcpServer,
        NotionMcpConnector,
        GoogleCalendarMcpConnector,
        AndroidBridgeMcpConnector,
      ],
    },

    // Multi-Provider for MCP OAuth Handlers (Plug-and-Play)
    {
      provide: MCP_OAUTH_HANDLERS,
      useFactory: (
        notionOAuth: NotionOAuthService,
        gcalOAuth: GoogleCalendarOAuthService,
      ) => [notionOAuth, gcalOAuth],
      inject: [NotionOAuthService, GoogleCalendarOAuthService],
    },
  ],
  exports: [
    McpRegistryService,
    McpGatewayService,
    ObsidianBridgeGatewayService,
    ObsidianVaultService,
    ObsidianMcpServer,
    NotionApiClient,
    NotionMcpConnector,
    NotionOAuthService,
    GoogleCalendarApiClient,
    GoogleCalendarMcpConnector,
    GoogleCalendarOAuthService,
    AndroidBridgeApiClient,
    AndroidBridgeGatewayService,
    AndroidBridgeMcpConnector,
    McpHttpTransport,
    McpSseTransport,
    MCP_SERVERS,
    MCP_OAUTH_HANDLERS,
  ],
})
export class McpModule {}
