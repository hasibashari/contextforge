import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ObsidianBridgeGatewayService } from './mcp/connectors/obsidian/obsidian-bridge.gateway';
import { AndroidBridgeGatewayService } from './mcp/connectors/android-bridge/android-bridge.gateway';

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

  await app.listen(port);

  const httpServer = app.getHttpServer() as unknown as Parameters<
    typeof ObsidianBridgeGatewayService.prototype.attachHttpServer
  >[0];

  const obsidianBridgeGateway = app.get(ObsidianBridgeGatewayService, {
    strict: false,
  });
  if (obsidianBridgeGateway) {
    obsidianBridgeGateway.attachHttpServer(httpServer);
  }

  const androidBridgeGateway = app.get(AndroidBridgeGatewayService, {
    strict: false,
  });
  if (androidBridgeGateway) {
    androidBridgeGateway.attachHttpServer(httpServer);
  }

  logger.log(`🚀 ContextForge Backend is running on: http://localhost:${port}`);
  logger.log(
    `⚡ Native PostgreSQL connected & Gemini 3.5 Flash reasoning engine ready.`,
  );
  logger.log(
    `🔌 Obsidian Browser Bridge WebSocket ready on: ws://localhost:${port}/api/obsidian-bridge/ws`,
  );
  logger.log(
    `📱 Android Mobile Bridge WebSocket ready on: ws://localhost:${port}/api/android-bridge/ws`,
  );
}
void bootstrap();
