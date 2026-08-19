import { Module } from '@nestjs/common';
import { ArtifactsController } from './artifacts.controller';
import { ArtifactsService } from './artifacts.service';
import { ArtifactsRepository } from './artifacts.repository';

@Module({
  controllers: [ArtifactsController],
  providers: [ArtifactsService, ArtifactsRepository],
  exports: [ArtifactsService, ArtifactsRepository],
})
export class ArtifactsModule {}
