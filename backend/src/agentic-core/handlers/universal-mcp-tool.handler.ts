import { Injectable, Logger } from '@nestjs/common';
import { McpGatewayService } from '../../mcp/mcp-gateway.service';
import { TOOL_CATALOG } from '../tools/builtin-tools';
import {
  OrchestrationResult,
  StreamEmitter,
} from '../orchestrator/orchestrator.types';

@Injectable()
export class UniversalMcpToolHandler {
  private readonly logger = new Logger(UniversalMcpToolHandler.name);

  constructor(private readonly mcpGateway: McpGatewayService) {}

  async execute(
    toolName: string,
    prompt: string,
    args: Record<string, unknown>,
    emit: StreamEmitter,
  ): Promise<OrchestrationResult> {
    void prompt;
    const toolMeta = TOOL_CATALOG[toolName];
    const isObsidian =
      toolName.startsWith('obsidian_') ||
      toolName === 'dispatch_action_worker' ||
      toolName === 'dispatch_obsidian_worker';
    const isGoogleCalendar = toolName.startsWith('google_calendar_');
    const isAndroid = toolName.startsWith('android_');

    const serverName =
      toolMeta?.serverName ||
      (isObsidian
        ? 'Obsidian MCP Server'
        : isGoogleCalendar
          ? 'Google Calendar MCP Server'
          : isAndroid
            ? 'Android Bridge MCP Server'
            : 'Notion MCP Server');
    const isReadOnly = toolMeta?.readOnly ?? !isObsidian;

    emit({
      event: 'timeline_stage',
      data: {
        stage: isReadOnly ? 'searching' : 'editing',
        label: `${serverName}: Executing ${toolName}...`,
      },
    });

    const startTime = Date.now();
    const result = await this.mcpGateway.callTool(toolName, args);
    const durationMs = Date.now() - startTime;

    emit({
      event: 'tool_call_result',
      data: {
        toolName,
        server: serverName,
        readOnly: isReadOnly,
        summary: result.summary,
        durationMs,
      },
    });

    return {
      textContent: result.summary,
      summary: result.summary,
      rawResult: {
        tool: toolName,
        server: serverName,
        readOnly: isReadOnly,
        success: result.success,
        data: result.data,
        summary: result.summary,
      },
      intent: {
        toolName,
        service: isObsidian
          ? 'obsidian'
          : isGoogleCalendar
            ? 'google_calendar'
            : isAndroid
              ? 'android_bridge'
              : 'notion',
        status: 'completed',
        summaryText: result.summary,
      },
    };
  }
}
