import { Module } from '@nestjs/common';
import { EcosystemController } from './ecosystem.controller';
import { EcosystemService } from './ecosystem.service';

@Module({
  controllers: [EcosystemController],
  providers: [EcosystemService],
  exports: [EcosystemService],
})
export class EcosystemModule {}
