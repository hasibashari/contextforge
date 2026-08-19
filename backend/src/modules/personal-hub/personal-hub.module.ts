import { Module } from '@nestjs/common';
import { PersonalHubController } from './personal-hub.controller';
import { PersonalHubService } from './personal-hub.service';
import { PersonalHubRepository } from './personal-hub.repository';

@Module({
  controllers: [PersonalHubController],
  providers: [PersonalHubService, PersonalHubRepository],
  exports: [PersonalHubService, PersonalHubRepository],
})
export class PersonalHubModule {}
