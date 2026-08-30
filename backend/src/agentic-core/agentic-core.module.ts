import { Module, forwardRef } from '@nestjs/common';
import { GeminiClientProvider } from './gemini-client.provider';
import { CoreOrchestratorService } from './orchestrator/core-orchestrator.service';
import { EmbeddingService } from './embeddings/embedding.service';
import { KnowledgeChunkerService } from './embeddings/knowledge-chunker.service';
import { WebSearchService } from './services/web-search.service';
import { UniversalMcpToolHandler } from './handlers/universal-mcp-tool.handler';
import { WebSearchToolHandler } from './handlers/web-search-tool.handler';
import { KnowledgeToolHandler } from './handlers/knowledge-tool.handler';
import { AutomationToolHandler } from './handlers/automation-tool.handler';
import { GoalToolHandler } from './handlers/goal-tool.handler';
import { DatabaseModule } from '../common/database/database.module';
import { AutomationModule } from '../modules/automation/automation.module';
import { GoalsModule } from '../modules/goals/goals.module';
import { McpModule } from '../mcp/mcp.module';
import { WellbeingCoachSubAgent } from './subagents/personas/wellbeing-coach.subagent';
import { SecondBrainSubAgent } from './subagents/personas/second-brain.subagent';
import { ExecutiveSchedulerSubAgent } from './subagents/personas/executive-scheduler.subagent';
import { ResearchSpecialistSubAgent } from './subagents/personas/research-specialist.subagent';
import { SubAgentRegistryService } from './subagents/subagent-registry.service';
import { ProactiveGuardianService } from './services/proactive-guardian.service';
import { HistoryCompactorService } from './services/history-compactor.service';

@Module({
  imports: [
    DatabaseModule,
    forwardRef(() => AutomationModule),
    forwardRef(() => GoalsModule),
    McpModule,
  ],
  providers: [
    GeminiClientProvider,
    CoreOrchestratorService,
    EmbeddingService,
    KnowledgeChunkerService,
    WebSearchService,
    UniversalMcpToolHandler,
    WebSearchToolHandler,
    KnowledgeToolHandler,
    AutomationToolHandler,
    GoalToolHandler,
    WellbeingCoachSubAgent,
    SecondBrainSubAgent,
    ExecutiveSchedulerSubAgent,
    ResearchSpecialistSubAgent,
    SubAgentRegistryService,
    ProactiveGuardianService,
    HistoryCompactorService,
  ],
  exports: [
    GeminiClientProvider,
    CoreOrchestratorService,
    SubAgentRegistryService,
    ProactiveGuardianService,
    EmbeddingService,
    KnowledgeChunkerService,
    WebSearchService,
    UniversalMcpToolHandler,
    McpModule,
  ],
})
export class AgenticCoreModule {}
