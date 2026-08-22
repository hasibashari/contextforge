import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

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
  logger.log(`🚀 ContextForge Backend is running on: http://localhost:${port}`);
  logger.log(
    `⚡ Native PostgreSQL connected & Gemini 3.5 Flash reasoning engine ready.`,
  );
}
void bootstrap();
