import { Module, forwardRef } from '@nestjs/common';
import { AutomationController } from './automation.controller';
import { AutomationService } from './automation.service';
import { AutomationRepository } from './automation.repository';
import { AutomationSchedulerService } from './automation-scheduler.service';
import { AgenticCoreModule } from '../../agentic-core/agentic-core.module';

@Module({
  imports: [forwardRef(() => AgenticCoreModule)],
  controllers: [AutomationController],
  providers: [
    AutomationService,
    AutomationRepository,
    AutomationSchedulerService,
  ],
  exports: [
    AutomationService,
    AutomationRepository,
    AutomationSchedulerService,
  ],
})
export class AutomationModule {}
