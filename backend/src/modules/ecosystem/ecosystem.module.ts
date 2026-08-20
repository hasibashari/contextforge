import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import { EcosystemController } from './ecosystem.controller';
import { EcosystemService } from './ecosystem.service';
import { EcosystemRepository } from './ecosystem.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [EcosystemController],
  providers: [EcosystemService, EcosystemRepository],
  exports: [EcosystemService, EcosystemRepository],
})
export class EcosystemModule {}
