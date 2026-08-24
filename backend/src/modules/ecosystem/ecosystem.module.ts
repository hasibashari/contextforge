import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import { SecurityModule } from '../../common/security/security.module';
import { McpModule } from '../../mcp/mcp.module';
import { EcosystemController } from './ecosystem.controller';
import { EcosystemService } from './ecosystem.service';
import { EcosystemRepository } from './ecosystem.repository';
import { AgentsService } from './services/agents.service';
import { SkillsService } from './services/skills.service';
import { IntegrationsService } from './services/integrations.service';

@Module({
  imports: [DatabaseModule, SecurityModule, McpModule],
  controllers: [EcosystemController],
  providers: [
    AgentsService,
    SkillsService,
    IntegrationsService,
    EcosystemService,
    EcosystemRepository,
  ],
  exports: [
    AgentsService,
    SkillsService,
    IntegrationsService,
    EcosystemService,
    EcosystemRepository,
  ],
})
export class EcosystemModule {}
