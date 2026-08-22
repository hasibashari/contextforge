import { Module, forwardRef } from '@nestjs/common';
import { GeminiClientProvider } from './gemini-client.provider';
import { CoreOrchestratorService } from './orchestrator/core-orchestrator.service';
import { EmbeddingService } from './embeddings/embedding.service';
import { KnowledgeChunkerService } from './embeddings/knowledge-chunker.service';
import { ObsidianVaultService } from './services/obsidian-vault.service';
import { AgentRecorderService } from './services/agent-recorder.service';
import { McpGatewayService } from './services/mcp-gateway.service';
import { UniversalMcpToolHandler } from './handlers/universal-mcp-tool.handler';
import { WebSearchToolHandler } from './handlers/web-search-tool.handler';
import { KnowledgeToolHandler } from './handlers/knowledge-tool.handler';
import { AutomationToolHandler } from './handlers/automation-tool.handler';
import { AutomationModule } from '../modules/automation/automation.module';

@Module({
  imports: [forwardRef(() => AutomationModule)],
  providers: [
    GeminiClientProvider,
    CoreOrchestratorService,
    EmbeddingService,
    KnowledgeChunkerService,
    ObsidianVaultService,
    AgentRecorderService,
    McpGatewayService,
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
    ObsidianVaultService,
    AgentRecorderService,
    McpGatewayService,
    UniversalMcpToolHandler,
    WebSearchToolHandler,
    KnowledgeToolHandler,
    AutomationToolHandler,
  ],
})
export class AgenticCoreModule {}
