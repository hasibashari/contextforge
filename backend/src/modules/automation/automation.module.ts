import { Module } from '@nestjs/common';
import { AutomationController } from './automation.controller';
import { AutomationService } from './automation.service';
import { AutomationRepository } from './automation.repository';

@Module({
  controllers: [AutomationController],
  providers: [AutomationService, AutomationRepository],
  exports: [AutomationService, AutomationRepository],
})
export class AutomationModule {}
