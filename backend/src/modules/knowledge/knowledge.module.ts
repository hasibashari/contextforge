import { Module } from '@nestjs/common';
import { KnowledgeController } from './knowledge.controller';
import { KnowledgeService } from './knowledge.service';
import { KnowledgeRepository } from './knowledge.repository';
import { AgenticCoreModule } from '../../agentic-core/agentic-core.module';

@Module({
  imports: [AgenticCoreModule],
  controllers: [KnowledgeController],
  providers: [KnowledgeService, KnowledgeRepository],
  exports: [KnowledgeService, KnowledgeRepository],
})
export class KnowledgeModule {}
