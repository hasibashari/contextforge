import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { GoogleGenAI } from '@google/genai';
import { GEMINI_CLIENT } from '../gemini-client.provider';
import { CORE_ORCHESTRATOR_SYSTEM_PROMPT } from '../prompts/orchestrator.prompt';
import { BUILTIN_FUNCTION_DECLARATIONS } from '../tools/builtin-tools';
import {
  StreamEvent,
  OrchestrationResult,
  StreamEmitter,
} from './orchestrator.types';
import { ObsidianToolHandler } from '../handlers/obsidian-tool.handler';
import { CodeToolHandler } from '../handlers/code-tool.handler';
import { CalendarToolHandler } from '../handlers/calendar-tool.handler';
import { VisualToolHandler } from '../handlers/visual-tool.handler';
import { WebSearchToolHandler } from '../handlers/web-search-tool.handler';

export type { StreamEvent, OrchestrationResult };

@Injectable()
export class CoreOrchestratorService {
  private readonly logger = new Logger(CoreOrchestratorService.name);

  constructor(
    @Inject(GEMINI_CLIENT) private readonly ai: GoogleGenAI,
    private readonly configService: ConfigService,
    private readonly obsidianHandler: ObsidianToolHandler,
    private readonly codeHandler: CodeToolHandler,
    private readonly calendarHandler: CalendarToolHandler,
    private readonly visualHandler: VisualToolHandler,
    private readonly webSearchHandler: WebSearchToolHandler,
  ) {}

  /**
   * Main conversational reasoning loop with streaming & dynamic tool dispatching
   */
  async processPromptStream(
    prompt: string,
    history: { role: 'user' | 'model'; parts: { text?: string }[] }[] = [],
    onEvent?: StreamEmitter,
  ): Promise<OrchestrationResult> {
    const emit: StreamEmitter = (event: StreamEvent) => {
      if (onEvent) onEvent(event);
    };

    const modelName = this.configService.get<string>(
      'gemini.defaultModel',
      'gemini-3.6-flash',
    );
    const temperature = this.configService.get<number>(
      'gemini.temperature',
      0.2,
    );

    emit({
      event: 'timeline_stage',
      data: { stage: 'thinking', label: 'Reasoning & Planning Execution...' },
    });

    try {
      const contents = [
        ...history,
        { role: 'user', parts: [{ text: prompt }] },
      ];

      this.logger.log(
        `Calling Gemini [${modelName}] for prompt: "${prompt.slice(0, 60)}..."`,
      );

      const response = await this.ai.models.generateContent({
        model: modelName,
        contents,
        config: {
          systemInstruction: CORE_ORCHESTRATOR_SYSTEM_PROMPT,
          temperature,
          tools: [{ functionDeclarations: BUILTIN_FUNCTION_DECLARATIONS }],
        },
      });

      const functionCalls = response.functionCalls;

      // Case A: Model invoked a Tool / Side Agent
      if (functionCalls && functionCalls.length > 0) {
        const call = functionCalls[0];
        const toolName = call.name || '';
        const args = call.args || {};

        this.logger.log(
          `Tool invoked: ${toolName} with args: ${JSON.stringify(args)}`,
        );

        emit({
          event: 'tool_call_start',
          data: { toolName, input: args },
        });

        return await this.dispatchTool(toolName, prompt, args, emit);
      }

      // Case B: Direct Conversational Response (with optional Search Grounding)
      return this.handleConversationalResponse(response, emit);
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
    args: Record<string, unknown>,
    emit: StreamEmitter,
  ): Promise<OrchestrationResult> {
    switch (toolName) {
      case 'dispatch_obsidian_worker':
        return this.obsidianHandler.execute(prompt, args, emit);

      case 'dispatch_code_worker':
        return this.codeHandler.execute(prompt, args, emit);

      case 'dispatch_calendar_worker':
        return this.calendarHandler.execute(prompt, args, emit);

      case 'dispatch_visual_worker':
        return this.visualHandler.execute(prompt, args, emit);

      case 'web_search':
        return this.webSearchHandler.execute(prompt, args, emit);

      default:
        this.logger.warn(`Unrecognized tool requested: ${toolName}`);
        return {
          textContent: `Tool "${toolName}" executed with standard parameters.`,
        };
    }
  }

  /**
   * Handles streaming and citation extraction for direct conversational responses
   */
  private handleConversationalResponse(
    response: { text?: string },
    emit: StreamEmitter,
  ): OrchestrationResult {
    emit({
      event: 'timeline_stage',
      data: {
        stage: 'reading',
        label: 'Synthesizing Architecture Analysis...',
      },
    });

    const fullText = response.text || '';
    const sourceDomains =
      this.webSearchHandler.extractGroundingDomains(response);

    const chunkSize = 25;
    for (let i = 0; i < fullText.length; i += chunkSize) {
      const chunk = fullText.slice(i, i + chunkSize);
      emit({
        event: 'chat_chunk',
        data: { delta: chunk },
      });
    }

    emit({
      event: 'timeline_stage',
      data: { stage: 'done', label: 'Completed' },
    });

    return {
      textContent: fullText,
      sourceDomains: sourceDomains.length > 0 ? sourceDomains : undefined,
    };
  }
}
