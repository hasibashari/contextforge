import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { appConfig } from './config/app.config';
import { databaseConfig } from './config/database.config';
import { geminiConfig } from './config/gemini.config';
import { DatabaseModule } from './common/database/database.module';
import { SecurityModule } from './common/security/security.module';
import { AgenticCoreModule } from './agentic-core/agentic-core.module';
import { ChatModule } from './modules/chat/chat.module';
import { ArtifactsModule } from './modules/artifacts/artifacts.module';
import { PersonalHubModule } from './modules/personal-hub/personal-hub.module';
import { KnowledgeModule } from './modules/knowledge/knowledge.module';
import { ActivityModule } from './modules/activity/activity.module';
import { EcosystemModule } from './modules/ecosystem/ecosystem.module';
import { AutomationModule } from './modules/automation/automation.module';
import { GoalsModule } from './modules/goals/goals.module';
import { WikiModule } from './modules/wiki/wiki.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, geminiConfig],
      envFilePath: ['.env'],
    }),
    EventEmitterModule.forRoot(),
    SecurityModule,
    DatabaseModule,
    AgenticCoreModule,
    ChatModule,
    ArtifactsModule,
    PersonalHubModule,
    KnowledgeModule,
    ActivityModule,
    EcosystemModule,
    AutomationModule,
    GoalsModule,
    WikiModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
