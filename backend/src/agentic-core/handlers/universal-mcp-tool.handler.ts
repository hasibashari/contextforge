import { Injectable, Logger } from '@nestjs/common';
import { McpGatewayService } from '../services/mcp-gateway.service';
import { AgentRecorderService } from '../services/agent-recorder.service';
import { ArtifactRow } from '../../modules/artifacts/artifacts.repository';
import { TOOL_CATALOG } from '../tools/builtin-tools';
import {
  OrchestrationResult,
  StreamEmitter,
} from '../orchestrator/orchestrator.types';

@Injectable()
export class UniversalMcpToolHandler {
  private readonly logger = new Logger(UniversalMcpToolHandler.name);

  constructor(
    private readonly mcpGateway: McpGatewayService,
    private readonly recorder: AgentRecorderService,
  ) {}

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

    const serverName =
      toolMeta?.serverName ||
      (isObsidian ? 'Obsidian MCP Server' : 'Notion MCP Server');
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

    let artifact: ArtifactRow | undefined;
    let actionCard: Record<string, unknown> | undefined;

    // Generate persistent artifact & interactive Action Card for mutating write actions
    if (
      toolName === 'obsidian_write_note' ||
      toolName === 'obsidian_vault_writer' ||
      toolName === 'dispatch_action_worker' ||
      toolName === 'obsidian_create_daily_note'
    ) {
      const docTitle =
        (args.title as string) || (args.name as string) || 'Architecture Note';
      const rawData = result.data as Record<string, unknown>;
      const formattedContent = (rawData?.formattedContent as string) || '';
      const relativePath =
        (rawData?.relativePath as string) ||
        (args.path as string) ||
        `Work/Notes/${docTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;

      if (formattedContent) {
        artifact = await this.recorder.recordArtifact({
          type: 'markdown_doc',
          title: docTitle,
          content: formattedContent,
          locationPath: relativePath,
          serviceOrigin: 'obsidian',
          wordCount: formattedContent.split(/\s+/).filter(Boolean).length,
        });

        emit({
          event: 'artifact_created',
          data: artifact as unknown as Record<string, unknown>,
        });
      }

      actionCard = {
        id: `card-${artifact?.id || Date.now()}`,
        type: 'document_ready',
        title: docTitle,
        subtitle: relativePath,
        locationPath: relativePath,
        badge: 'Obsidian Note',
        badgeVariant: 'purple',
        description: `Complete Markdown document structured with YAML frontmatter and bi-directional links. Open in Aside editor, save to local folder, or open directly in Obsidian Desktop.`,
        targetResource: artifact?.id || relativePath,
        actions: [
          {
            key: 'open_aside',
            label: 'Open in Workspace Aside',
            primary: true,
            icon: 'edit-3',
          },
          {
            key: 'open_in_obsidian',
            label: 'Open in Obsidian App',
            primary: false,
            icon: 'book-open',
          },
          {
            key: 'write_to_local_disk',
            label: 'Save to Local Folder',
            primary: false,
            icon: 'hard-drive',
          },
        ],
      };
    }

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
        artifactId: artifact?.id,
      },
      intent: {
        toolName,
        service: isObsidian ? 'obsidian' : 'notion',
        status: 'completed',
        summaryText: result.summary,
      },
      artifact,
      actionCard,
    };
  }
}
