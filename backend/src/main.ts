import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ObsidianBridgeGatewayService } from './mcp/connectors/obsidian/obsidian-bridge.gateway';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port', 3001);

  // Enable CORS for Frontend React app
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const obsidianBridgeGateway = app.get(ObsidianBridgeGatewayService, {
    strict: false,
  });
  if (obsidianBridgeGateway) {
    const httpServer = app.getHttpServer() as unknown as Parameters<
      typeof obsidianBridgeGateway.attachHttpServer
    >[0];
    obsidianBridgeGateway.attachHttpServer(httpServer);
  }

  await app.listen(port);
  logger.log(`🚀 ContextForge Backend is running on: http://localhost:${port}`);
  logger.log(
    `⚡ Native PostgreSQL connected & Gemini 3.5 Flash reasoning engine ready.`,
  );
  logger.log(
    `🔌 Obsidian Browser Bridge WebSocket ready on: ws://localhost:${port}/api/obsidian-bridge/ws`,
  );
}
void bootstrap();
