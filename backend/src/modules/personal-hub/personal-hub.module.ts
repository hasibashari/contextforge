import { Module } from '@nestjs/common';
import { PersonalHubController } from './personal-hub.controller';
import { PersonalHubService } from './personal-hub.service';
import { PersonalHubRepository } from './personal-hub.repository';
import { GeminiClientProvider } from '../../agentic-core/gemini-client.provider';

@Module({
  controllers: [PersonalHubController],
  providers: [PersonalHubService, PersonalHubRepository, GeminiClientProvider],
  exports: [PersonalHubService, PersonalHubRepository],
})
export class PersonalHubModule {}
