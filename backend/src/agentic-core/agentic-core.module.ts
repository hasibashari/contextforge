import { Module, forwardRef } from '@nestjs/common';
import { GeminiClientProvider } from './gemini-client.provider';
import { CoreOrchestratorService } from './orchestrator/core-orchestrator.service';
import { EmbeddingService } from './embeddings/embedding.service';
import { KnowledgeChunkerService } from './embeddings/knowledge-chunker.service';
import { AgentRecorderService } from './services/agent-recorder.service';
import { UniversalMcpToolHandler } from './handlers/universal-mcp-tool.handler';
import { WebSearchToolHandler } from './handlers/web-search-tool.handler';
import { KnowledgeToolHandler } from './handlers/knowledge-tool.handler';
import { AutomationToolHandler } from './handlers/automation-tool.handler';
import { DatabaseModule } from '../common/database/database.module';
import { AutomationModule } from '../modules/automation/automation.module';
import { McpModule } from '../mcp/mcp.module';

@Module({
  imports: [DatabaseModule, forwardRef(() => AutomationModule), McpModule],
  providers: [
    GeminiClientProvider,
    CoreOrchestratorService,
    EmbeddingService,
    KnowledgeChunkerService,
    AgentRecorderService,
    UniversalMcpToolHandler,
    WebSearchToolHandler,
    KnowledgeToolHandler,
    AutomationToolHandler,
  ],
  exports: [
    GeminiClientProvider,
    CoreOrchestratorService,
    EmbeddingService,
    KnowledgeChunkerService,
    AgentRecorderService,
    UniversalMcpToolHandler,
    WebSearchToolHandler,
    KnowledgeToolHandler,
    AutomationToolHandler,
    McpModule,
  ],
})
export class AgenticCoreModule {}
