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
import { AndroidPairingService } from './services/android-pairing.service';

@Module({
  imports: [DatabaseModule, SecurityModule, McpModule],
  controllers: [EcosystemController],
  providers: [
    AgentsService,
    SkillsService,
    IntegrationsService,
    AndroidPairingService,
    EcosystemService,
    EcosystemRepository,
  ],
  exports: [
    AgentsService,
    SkillsService,
    IntegrationsService,
    AndroidPairingService,
    EcosystemService,
    EcosystemRepository,
  ],
})
export class EcosystemModule {}
