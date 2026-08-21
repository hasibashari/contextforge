import { Module } from '@nestjs/common';
import { GeminiClientProvider } from './gemini-client.provider';
import { CoreOrchestratorService } from './orchestrator/core-orchestrator.service';
import { EmbeddingService } from './embeddings/embedding.service';
import { KnowledgeChunkerService } from './embeddings/knowledge-chunker.service';
import { ObsidianVaultService } from './services/obsidian-vault.service';
import { AgentRecorderService } from './services/agent-recorder.service';
import { ActionToolHandler } from './handlers/action-tool.handler';
import { WebSearchToolHandler } from './handlers/web-search-tool.handler';
import { KnowledgeToolHandler } from './handlers/knowledge-tool.handler';

@Module({
  providers: [
    GeminiClientProvider,
    CoreOrchestratorService,
    EmbeddingService,
    KnowledgeChunkerService,
    ObsidianVaultService,
    AgentRecorderService,
    ActionToolHandler,
    WebSearchToolHandler,
    KnowledgeToolHandler,
  ],
  exports: [
    GeminiClientProvider,
    CoreOrchestratorService,
    EmbeddingService,
    KnowledgeChunkerService,
    ObsidianVaultService,
    AgentRecorderService,
    ActionToolHandler,
    WebSearchToolHandler,
    KnowledgeToolHandler,
  ],
})
export class AgenticCoreModule {}
