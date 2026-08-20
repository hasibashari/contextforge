import { Module } from '@nestjs/common';
import { KnowledgeController } from './knowledge.controller';
import { KnowledgeService } from './knowledge.service';
import { KnowledgeRepository } from './knowledge.repository';
import { AgenticCoreModule } from '../../agentic-core/agentic-core.module';

import { KnowledgeStorageService } from './storage/knowledge-storage.service';

@Module({
  imports: [AgenticCoreModule],
  controllers: [KnowledgeController],
  providers: [KnowledgeService, KnowledgeRepository, KnowledgeStorageService],
  exports: [KnowledgeService, KnowledgeRepository, KnowledgeStorageService],
})
export class KnowledgeModule {}
