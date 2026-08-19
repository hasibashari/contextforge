import { Module } from '@nestjs/common';
import { GeminiClientProvider } from './gemini-client.provider';
import { CoreOrchestratorService } from './orchestrator/core-orchestrator.service';

@Module({
  providers: [GeminiClientProvider, CoreOrchestratorService],
  exports: [GeminiClientProvider, CoreOrchestratorService],
})
export class AgenticCoreModule {}
