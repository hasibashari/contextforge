import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatRepository } from './chat.repository';
import { AgenticCoreModule } from '../../agentic-core/agentic-core.module';

import { EcosystemModule } from '../ecosystem/ecosystem.module';

@Module({
  imports: [AgenticCoreModule, EcosystemModule],
  controllers: [ChatController],
  providers: [ChatService, ChatRepository],
  exports: [ChatService, ChatRepository],
})
export class ChatModule {}
