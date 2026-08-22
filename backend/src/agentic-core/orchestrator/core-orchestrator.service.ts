import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { GoogleGenAI } from '@google/genai';
import { GEMINI_CLIENT } from '../gemini-client.provider';
import { getAgentSystemPrompt } from '../prompts/orchestrator.prompt';
import { BUILTIN_FUNCTION_DECLARATIONS } from '../tools/builtin-tools';
import {
  StreamEvent,
  OrchestrationResult,
  StreamEmitter,
} from './orchestrator.types';
import { UniversalMcpToolHandler } from '../handlers/universal-mcp-tool.handler';
import { WebSearchToolHandler } from '../handlers/web-search-tool.handler';
import { KnowledgeToolHandler } from '../handlers/knowledge-tool.handler';
import { AutomationToolHandler } from '../handlers/automation-tool.handler';
import { ObsidianVaultService } from '../services/obsidian-vault.service';

export type { StreamEvent, OrchestrationResult };

const MAX_REACT_TURNS = 5;

export type MemorySummaryInput =
  string | Array<{ category: string; key: string; value: string }>;

@Injectable()
export class CoreOrchestratorService {
  private readonly logger = new Logger(CoreOrchestratorService.name);

  constructor(
    @Inject(GEMINI_CLIENT) private readonly ai: GoogleGenAI,
    private readonly configService: ConfigService,
    private readonly mcpHandler: UniversalMcpToolHandler,
    private readonly webSearchHandler: WebSearchToolHandler,
    private readonly knowledgeHandler: KnowledgeToolHandler,
    private readonly automationHandler: AutomationToolHandler,
    private readonly obsidianVaultService: ObsidianVaultService,
  ) {}

  /**
   * Main conversational ReAct reasoning loop with streaming & iterative tool dispatching
   */
  async processPromptStream(
    prompt: string,
    history: { role: 'user' | 'model'; parts: { text?: string }[] }[] = [],
    onEvent?: StreamEmitter,
    agentId?: string,
    activeSkills: Array<{ name: string; instructions: string }> = [],
    memorySummary?: MemorySummaryInput,
  ): Promise<OrchestrationResult> {
    const emit: StreamEmitter = (event: StreamEvent) => {
      if (onEvent) onEvent(event);
    };

    const modelName = this.configService.get<string>(
      'gemini.defaultModel',
      'gemini-3.5-flash',
    );
    const temperature = this.configService.get<number>(
      'gemini.temperature',
      0.2,
    );

    // Live inspect user's existing vault folders to enforce contextual directory alignment
    let vaultFolders: string[] = [];
    try {
      vaultFolders = await this.obsidianVaultService.getVaultFolders();
    } catch {
      // Fallback safe
    }

    const systemInstruction = getAgentSystemPrompt(
      agentId,
      activeSkills,
      memorySummary,
      vaultFolders,
    );

    // Cumulative conversation history for the ReAct loop
    const turnContents: any[] = [
      ...history,
      { role: 'user', parts: [{ text: prompt }] },
    ];

    let turn = 0;
    let isCompleted = false;
    const finalResult: OrchestrationResult = { textContent: '' };
    const allSourceDomains: Set<string> = new Set();

    this.logger.log(
      `Starting ReAct reasoning loop [${modelName}, agent=${agentId || 'default'}] for: "${prompt.slice(0, 60)}..."`,
    );

    try {
      while (turn < MAX_REACT_TURNS && !isCompleted) {
        turn++;

        emit({
          event: 'timeline_stage',
          data: {
            stage: 'thinking',
            label:
              turn === 1
                ? 'Analyzing Goal & Planning Actions...'
                : `Reasoning Step ${turn}: Evaluating Observation...`,
          },
        });

        emit({
          event: 'thought_step',
          data: { turn, status: 'reasoning', agentId },
        });

        const response = await this.ai.models.generateContent({
          model: modelName,
          contents: turnContents,
          config: {
            systemInstruction,
            temperature,
            tools: [{ functionDeclarations: BUILTIN_FUNCTION_DECLARATIONS }],
          },
        });

        const functionCalls = response.functionCalls;

        // Case A: Model wants to invoke one or more tools (Reason -> Action)
        if (functionCalls && functionCalls.length > 0) {
          const functionResponseParts: any[] = [];

          for (const call of functionCalls) {
            const toolName = call.name || '';
            const args = (call.args || {}) as Record<string, any>;

            this.logger.log(
              `[Turn ${turn}] Tool Call: "${toolName}" with args: ${JSON.stringify(args)}`,
            );

            emit({
              event: 'tool_call_start',
              data: { toolName, input: args, turn },
            });

            // Execute the selected tool with automatic 1-shot transient retry
            let toolOutput: OrchestrationResult | undefined;
            let executionError: Error | null = null;

            for (let attempt = 1; attempt <= 2; attempt++) {
              try {
                toolOutput = await this.dispatchTool(
                  toolName,
                  prompt,
                  args,
                  emit,
                );
                executionError = null;
                break;
              } catch (toolErr) {
                executionError =
                  toolErr instanceof Error
                    ? toolErr
                    : new Error(String(toolErr));
                if (attempt === 1) {
                  this.logger.warn(
                    `[Attempt 1 Failed] Tool "${toolName}": ${executionError.message}. Retrying...`,
                  );
                  await new Promise((res) => setTimeout(res, 500));
                }
              }
            }

            if (executionError || !toolOutput) {
              const errMessage =
                executionError?.message || 'Tool returned empty output';
              this.logger.error(
                `Error executing tool "${toolName}": ${errMessage}`,
              );

              emit({
                event: 'timeline_stage',
                data: {
                  stage: 're-planning',
                  label: `Tool ${toolName} encountered an issue. Agent is re-evaluating strategy & re-planning...`,
                },
              });

              toolOutput = {
                textContent: `Error executing tool "${toolName}": ${errMessage}`,
                summary: `Failed to execute ${toolName}`,
                rawResult: {
                  success: false,
                  tool: toolName,
                  error: errMessage,
                  instruction: `Execution of "${toolName}" failed. Please re-evaluate your plan: adjust input parameters, try an alternative tool (e.g. search_knowledge_vault vs web_search), or explain next steps to the user.`,
                },
              };
            }

            // Accumulate artifacts, cards, or source domains
            if (toolOutput.artifact) {
              finalResult.artifact = toolOutput.artifact;
            }
            if (toolOutput.actionCard) {
              finalResult.actionCard = toolOutput.actionCard;
            }
            if (toolOutput.intent) {
              finalResult.intent = toolOutput.intent;
            }
            if (toolOutput.sourceDomains) {
              toolOutput.sourceDomains.forEach((d) => allSourceDomains.add(d));
            }

            functionResponseParts.push({
              functionResponse: {
                name: toolName,
                response: {
                  output: toolOutput.rawResult || {
                    summary: toolOutput.summary || toolOutput.textContent,
                  },
                },
              },
            });
          }

          // Preserve exact candidate parts to retain Gemini thought_signature and thinking tokens
          const candidateParts = response.candidates?.[0]?.content?.parts;
          const modelParts =
            candidateParts && candidateParts.length > 0
              ? candidateParts
              : functionCalls.map((call) => ({ functionCall: call }));

          // Append paired model turn (all functionCalls + thought_signature) and user turn (all functionResponses)
          turnContents.push({
            role: 'model',
            parts: modelParts,
          });

          turnContents.push({
            role: 'user',
            parts: functionResponseParts,
          });

          // Loop continues: next turn will send observations back to Gemini
        } else {
          // Case B: Model has finished reasoning and produced the final response
          isCompleted = true;
          this.logger.log(
            `[Turn ${turn}] ReAct loop completed with synthesized response.`,
          );

          const conversationalResult = this.handleConversationalResponse(
            response,
            emit,
          );
          finalResult.textContent = conversationalResult.textContent;
          if (conversationalResult.sourceDomains) {
            conversationalResult.sourceDomains.forEach((d) =>
              allSourceDomains.add(d),
            );
          }
        }
      }

      // Ensure rich text summary is always present and emitted to the user
      if (!finalResult.textContent || finalResult.textContent.trim() === '') {
        if (finalResult.artifact) {
          const art = finalResult.artifact;
          const locPath = art.location_path || 'Work/Notes/';
          const snippet =
            art.content && art.content.length > 600
              ? `${art.content.slice(0, 600)}\n\n*(Buka dokumen lengkap di panel Aside)*`
              : art.content ||
                'Telah dibuat dengan frontmatter YAML dan backlinks.';
          finalResult.textContent = `Dokumen **${art.title}** telah berhasil disusun dan disimpan di Obsidian Vault Anda pada path: \`${locPath}\`.\n\n### 📋 Ringkasan Dokumen:\n${snippet}`;
          this.streamFinalText(finalResult.textContent, emit);
        } else if (finalResult.intent?.summaryText) {
          finalResult.textContent = finalResult.intent.summaryText;
          this.streamFinalText(finalResult.textContent, emit);
        } else {
          emit({
            event: 'timeline_stage',
            data: {
              stage: 'reading',
              label: 'Finalizing Multi-Step Synthesis...',
            },
          });

          // Call Gemini with existing turnContents without tools to force final text synthesis
          const fallbackResponse = await this.ai.models.generateContent({
            model: modelName,
            contents: turnContents,
            config: {
              systemInstruction,
              temperature,
            },
          });

          finalResult.textContent =
            fallbackResponse.text || 'Tugas telah selesai diproses.';
          this.streamFinalText(finalResult.textContent, emit);
        }
      }

      if (allSourceDomains.size > 0) {
        finalResult.sourceDomains = Array.from(allSourceDomains);
      }

      emit({
        event: 'timeline_stage',
        data: { stage: 'done', label: 'Completed' },
      });

      emit({
        event: 'execution_done',
        data: {
          turnsCount: turn,
          hasArtifact: Boolean(finalResult.artifact),
          hasActionCard: Boolean(finalResult.actionCard),
        },
      });

      return finalResult;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      const errorStack = err instanceof Error ? err.stack : undefined;
      this.logger.error(
        `Error in CoreOrchestratorService: ${errorMsg}`,
        errorStack,
      );
      emit({
        event: 'error',
        data: { message: errorMsg },
      });
      throw err;
    }
  }

  /**
   * Dispatches tool execution to the appropriate dedicated handler
   */
  private async dispatchTool(
    toolName: string,
    prompt: string,
    args: Record<string, any>,
    emit: StreamEmitter,
  ): Promise<OrchestrationResult> {
    switch (toolName) {
      case 'transfer_to_agent': {
        const targetAgent =
          (args.target_agent_id as string) || 'agent-research';
        const subTask = (args.sub_task as string) || prompt;
        const reason =
          (args.reason as string) || 'Delegating specialized sub-task';

        const agentName =
          targetAgent === 'agent-research'
            ? 'Research Specialist'
            : 'Personal Assistant';

        emit({
          event: 'timeline_stage',
          data: {
            stage: 'thinking',
            label: `Agent Handoff: Delegating to ${agentName}...`,
          },
        });

        emit({
          event: 'side_agent_log',
          data: {
            sideAgentId: targetAgent,
            log: `[Handoff] Delegated to ${agentName}: "${subTask}" (${reason})`,
            riskLevel: 'low_risk',
          },
        });

        return {
          textContent: `I have delegated this sub-task to **${agentName}**: "${subTask}".`,
          summary: `Handoff to ${agentName}: ${subTask}`,
          rawResult: {
            handoffTo: targetAgent,
            agentName,
            subTask,
            reason,
            status: 'transferred',
          },
        };
      }

      case 'create_scheduled_automation':
        return this.automationHandler.execute(prompt, args, emit);

      case 'web_search':
        return this.webSearchHandler.execute(prompt, args, emit);

      case 'search_knowledge_vault':
        return this.knowledgeHandler.handle(prompt, args, emit);

      // Universal MCP Tool Invocation (Notion & Obsidian)
      case 'query_notion_workspace':
      case 'notion_get_tasks':
      case 'notion_search':
      case 'notion_read_page':
      case 'notion_create_page':
      case 'notion_update_database':
      case 'dispatch_action_worker':
      case 'dispatch_obsidian_worker':
      case 'obsidian_write_note':
      case 'obsidian_read_note':
      case 'obsidian_vault_writer':
      case 'obsidian_vault_reader':
      case 'obsidian_create_daily_note':
        return this.mcpHandler.execute(toolName, prompt, args, emit);

      default:
        // Dynamic fallback: if tool name matches MCP patterns, route to MCP Gateway
        if (
          toolName.startsWith('obsidian_') ||
          toolName.startsWith('notion_')
        ) {
          return this.mcpHandler.execute(toolName, prompt, args, emit);
        }

        this.logger.warn(`Unrecognized tool requested: ${toolName}`);
        return {
          textContent: `Tool "${toolName}" executed with standard parameters.`,
          summary: `Executed ${toolName}`,
          rawResult: { toolName, args, status: 'unrecognized_fallback' },
        };
    }
  }

  /**
   * Handles final conversational / synthesis response from the model
   */
  private handleConversationalResponse(
    response: { text?: string; candidates?: any[] },
    emit: StreamEmitter,
  ): OrchestrationResult {
    emit({
      event: 'timeline_stage',
      data: {
        stage: 'reading',
        label: 'Synthesizing Response...',
      },
    });

    const fullText: string = response.text || '';
    const sourceDomains: string[] =
      this.webSearchHandler.extractGroundingDomains(response);

    this.streamFinalText(fullText, emit);

    return {
      textContent: fullText,
      sourceDomains: sourceDomains.length > 0 ? sourceDomains : undefined,
    };
  }

  /**
   * Streams synthesized text directly to client via SSE chunk
   */
  private streamFinalText(text: string, emit: StreamEmitter): void {
    if (!text) return;
    emit({
      event: 'chat_chunk',
      data: { delta: text },
    });
  }
}
