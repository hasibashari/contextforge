import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatRepository } from './chat.repository';
import { AgenticCoreModule } from '../../agentic-core/agentic-core.module';

import { EcosystemModule } from '../ecosystem/ecosystem.module';
import { PersonalHubModule } from '../personal-hub/personal-hub.module';

@Module({
  imports: [AgenticCoreModule, EcosystemModule, PersonalHubModule],
  controllers: [ChatController],
  providers: [ChatService, ChatRepository],
  exports: [ChatService, ChatRepository],
})
export class ChatModule {}
