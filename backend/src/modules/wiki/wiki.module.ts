import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import { AgenticCoreModule } from '../../agentic-core/agentic-core.module';
import { McpModule } from '../../mcp/mcp.module';
import { WikiRepository } from './wiki.repository';
import { WikiService } from './wiki.service';
import { WikiController } from './wiki.controller';

@Module({
  imports: [DatabaseModule, AgenticCoreModule, McpModule],
  controllers: [WikiController],
  providers: [WikiRepository, WikiService],
  exports: [WikiService, WikiRepository],
})
export class WikiModule {}
