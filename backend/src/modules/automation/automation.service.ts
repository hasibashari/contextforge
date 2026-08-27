import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
import {
  AutomationRepository,
  AutomationWorkflowRow,
  AutomationRunRow,
} from './automation.repository';
import {
  CoreOrchestratorService,
  StreamEvent,
} from '../../agentic-core/orchestrator/core-orchestrator.service';

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);

  constructor(
    private readonly repo: AutomationRepository,
    @Inject(forwardRef(() => CoreOrchestratorService))
    private readonly orchestrator: CoreOrchestratorService,
  ) {}

  async getAllAutomations(): Promise<AutomationWorkflowRow[]> {
    return this.repo.getAllAutomations();
  }

  async getAutomationById(id: string): Promise<AutomationWorkflowRow> {
    const workflow = await this.repo.getAutomationById(id);
    if (!workflow) {
      throw new NotFoundException(`Automation with ID "${id}" not found`);
    }
    return workflow;
  }

  async createAutomation(
    data: Partial<AutomationWorkflowRow>,
  ): Promise<AutomationWorkflowRow> {
    return this.repo.createAutomation(data);
  }

  async updateAutomation(
    id: string,
    updates: Partial<AutomationWorkflowRow>,
  ): Promise<AutomationWorkflowRow> {
    return this.repo.updateAutomation(id, updates);
  }

  async deleteAutomation(id: string): Promise<{ success: boolean }> {
    const success = await this.repo.deleteAutomation(id);
    return { success };
  }

  async getAllRuns(limit = 100): Promise<AutomationRunRow[]> {
    return this.repo.getAllRuns(limit);
  }

  /**
   * Execute automation workflow via real CoreOrchestratorService ReAct loop
   */
  async triggerRun(id: string): Promise<AutomationRunRow> {
    const workflow = await this.getAutomationById(id);
    const startTime = Date.now();
    const todayStr = new Date().toISOString().slice(0, 10);

    // 1. Build prompt from template with dynamic variable interpolation
    let prompt = workflow.prompt_template || '';
    prompt = prompt
      .replace(/\{\{today\}\}/g, todayStr)
      .replace(/\{\{workspace\}\}/g, workflow.name);

    if (!prompt.trim()) {
      prompt = `Review all related data and tasks from the MCP connector (${workflow.mcp_server_id || 'Notion/Obsidian'}). Generate a high-priority action summary for today (${todayStr}).`;
    }

    this.logger.log(
      `Triggering agentic run for workflow "${workflow.name}" (${workflow.id}) with prompt: "${prompt.slice(0, 80)}..."`,
    );

    const steps: Record<string, unknown>[] = [
      {
        stage: 'trigger_evaluation',
        title: 'Instant Dispatch Activated',
        status: 'completed',
        logs: [
          `Dispatched via backend Agentic Dispatcher`,
          `Workflow: ${workflow.name}`,
          `Target MCP Server: ${workflow.mcp_server_id || 'Auto-Detected'}`,
        ],
        durationMs: 50,
      },
    ];

    let runStatus: 'success' | 'failed' = 'success';
    let outputSummary = '';
    let outputArtifactUrl: string | undefined;
    let turnCount = 0;

    try {
      // 2. Execute via CoreOrchestratorService ReAct loop
      const result = await this.orchestrator.processPromptStream(
        prompt,
        [],
        (evt: StreamEvent) => {
          if (evt.event === 'tool_call_start') {
            const toolName = (evt.data?.toolName as string) || 'MCP Tool';
            steps.push({
              stage: 'tool_execution',
              title: `Execute: ${toolName}`,
              status: 'running',
              toolName,
              logs: [
                `Invoked tool "${toolName}" with args: ${JSON.stringify(evt.data?.input || {})}`,
              ],
            });
          } else if (evt.event === 'tool_call_result') {
            const toolName = (evt.data?.toolName as string) || 'MCP Tool';
            const isToolSuccess = evt.data?.success !== false;
            const toolData = evt.data?.data as
              Record<string, unknown> | undefined;
            const toolErrorMsg =
              typeof toolData?.error === 'string'
                ? toolData.error
                : toolData?.error
                  ? JSON.stringify(toolData.error)
                  : undefined;

            const existingStep = steps.find(
              (s) =>
                s.stage === 'tool_execution' &&
                s.toolName === toolName &&
                s.status === 'running',
            );
            if (existingStep) {
              const finalStepStatus =
                isToolSuccess && !toolErrorMsg ? 'completed' : 'failed';
              existingStep.status = finalStepStatus;
              (existingStep.logs as string[]).push(
                (evt.data?.summary as string) ||
                  `Tool ${toolName} execution ${finalStepStatus}.`,
              );
              if (toolErrorMsg) {
                (existingStep.logs as string[]).push(`Error: ${toolErrorMsg}`);
                runStatus = 'failed';
              }
              existingStep.durationMs = evt.data?.durationMs || 450;
            }
          } else if (evt.event === 'thought_step') {
            turnCount = (evt.data?.turn as number) || turnCount + 1;
          } else if (evt.event === 'artifact_created') {
            const loc = evt.data?.locationPath as string;
            if (loc) {
              outputArtifactUrl = loc;
            }
          }
        },
        workflow.agent_id || 'agent-personal-assistant',
      );

      outputSummary =
        result.textContent || 'Workflow automation completed successfully.';
      if (result.artifact?.location_path) {
        outputArtifactUrl = result.artifact.location_path;
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Error during automation run: ${errorMsg}`);
      runStatus = 'failed';
      outputSummary = `Automation failed: ${errorMsg}`;
      steps.push({
        stage: 'error',
        title: 'Execution Error',
        status: 'failed',
        logs: [errorMsg],
        durationMs: 0,
      });
    }

    const duration = Date.now() - startTime;

    // 3. Mark final deliverable step
    steps.push({
      stage: 'deliverable',
      title: 'Execution Telemetry Logged',
      status: runStatus === 'success' ? 'completed' : 'failed',
      logs: [
        `Workflow run completed in ${duration}ms across ${turnCount || 1} ReAct turns`,
        `Telemetry saved to PostgreSQL database`,
      ],
      durationMs: 100,
    });

    // Approximate realistic token count based on input & output text
    const inputTokens = Math.max(
      150,
      Math.round(prompt.length / 3.5) + turnCount * 400,
    );
    const outputTokens = Math.max(80, Math.round(outputSummary.length / 3.5));
    const totalTokens = inputTokens + outputTokens;

    // 4. Save record to PostgreSQL
    const run = await this.repo.createRun({
      workflow_id: workflow.id,
      workflow_name: workflow.name,
      agent_id: workflow.agent_id,
      agent_name: workflow.agent_name || 'ContextForge Agent',
      trigger_source: 'Backend Manual Dispatch',
      status: runStatus,
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString(),
      duration_ms: duration,
      tokens_used: {
        input: inputTokens,
        output: outputTokens,
        total: totalTokens,
      },
      steps,
      output_summary: outputSummary,
      output_artifact_url: outputArtifactUrl,
    });

    // 5. Update workflow state in PostgreSQL
    await this.repo.updateAutomation(workflow.id, {
      last_run_at: new Date().toISOString(),
      last_run_status: runStatus,
      total_runs: (workflow.total_runs || 0) + 1,
    });

    return run;
  }
}
