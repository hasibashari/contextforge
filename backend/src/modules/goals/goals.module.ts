import { Module, forwardRef } from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import { AgenticCoreModule } from '../../agentic-core/agentic-core.module';
import { PersonalHubModule } from '../personal-hub/personal-hub.module';
import { AutomationModule } from '../automation/automation.module';
import { GoalsRepository } from './goals.repository';
import { GoalsService } from './goals.service';
import { GoalsController } from './goals.controller';

@Module({
  imports: [
    DatabaseModule,
    forwardRef(() => AgenticCoreModule),
    PersonalHubModule,
    forwardRef(() => AutomationModule),
  ],
  controllers: [GoalsController],
  providers: [GoalsRepository, GoalsService],
  exports: [GoalsRepository, GoalsService],
})
export class GoalsModule {}
