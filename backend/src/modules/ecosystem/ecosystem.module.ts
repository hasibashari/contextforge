import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import { McpModule } from '../../mcp/mcp.module';
import { EcosystemController } from './ecosystem.controller';
import { EcosystemService } from './ecosystem.service';
import { EcosystemRepository } from './ecosystem.repository';

@Module({
  imports: [DatabaseModule, McpModule],
  controllers: [EcosystemController],
  providers: [EcosystemService, EcosystemRepository],
  exports: [EcosystemService, EcosystemRepository],
})
export class EcosystemModule {}
