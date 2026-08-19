import { Module } from '@nestjs/common';
import { GeminiClientProvider } from './gemini-client.provider';
import { CoreOrchestratorService } from './orchestrator/core-orchestrator.service';
import { EmbeddingService } from './embeddings/embedding.service';
import { KnowledgeChunkerService } from './embeddings/knowledge-chunker.service';
import { ObsidianVaultService } from './services/obsidian-vault.service';
import { CodeSandboxService } from './services/code-sandbox.service';
import { AgentRecorderService } from './services/agent-recorder.service';
import { ObsidianToolHandler } from './handlers/obsidian-tool.handler';
import { CodeToolHandler } from './handlers/code-tool.handler';
import { CalendarToolHandler } from './handlers/calendar-tool.handler';
import { VisualToolHandler } from './handlers/visual-tool.handler';
import { WebSearchToolHandler } from './handlers/web-search-tool.handler';

@Module({
  providers: [
    GeminiClientProvider,
    CoreOrchestratorService,
    EmbeddingService,
    KnowledgeChunkerService,
    ObsidianVaultService,
    CodeSandboxService,
    AgentRecorderService,
    ObsidianToolHandler,
    CodeToolHandler,
    CalendarToolHandler,
    VisualToolHandler,
    WebSearchToolHandler,
  ],
  exports: [
    GeminiClientProvider,
    CoreOrchestratorService,
    EmbeddingService,
    KnowledgeChunkerService,
    ObsidianVaultService,
    CodeSandboxService,
    AgentRecorderService,
    ObsidianToolHandler,
    CodeToolHandler,
    CalendarToolHandler,
    VisualToolHandler,
    WebSearchToolHandler,
  ],
})
export class AgenticCoreModule {}
