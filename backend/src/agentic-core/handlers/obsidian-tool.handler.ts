import { Injectable, Logger } from '@nestjs/common';
import { ObsidianVaultService } from '../services/obsidian-vault.service';
import { AgentRecorderService } from '../services/agent-recorder.service';
import {
  OrchestrationResult,
  StreamEmitter,
} from '../orchestrator/orchestrator.types';

export interface ObsidianToolArgs {
  title?: string;
  path?: string;
  content?: string;
}

@Injectable()
export class ObsidianToolHandler {
  private readonly logger = new Logger(ObsidianToolHandler.name);

  constructor(
    private readonly vaultService: ObsidianVaultService,
    private readonly recorder: AgentRecorderService,
  ) {}

  async execute(
    prompt: string,
    args: ObsidianToolArgs,
    emit: StreamEmitter,
  ): Promise<OrchestrationResult> {
    emit({
      event: 'timeline_stage',
      data: {
        stage: 'editing',
        label: 'Obsidian Worker: Formatting & Writing Note to Local Vault...',
      },
    });

    const docTitle = args.title || 'Architecture Note';
    const pathName =
      args.path ||
      `Vault/Work/Notes/${docTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;
    const markdownContent = args.content || `# ${docTitle}\n\n${prompt}`;

    emit({
      event: 'side_agent_log',
      data: {
        sideAgentId: 'agent-doc-crawl',
        log: `[ObsidianWorker] Initializing worker for vault at: ${this.vaultService.getVaultRoot()}`,
        riskLevel: 'low_risk',
      },
    });

    // 1. Physical file write to local disk
    const vaultResult = await this.vaultService.writeNote(
      docTitle,
      pathName,
      markdownContent,
      { tags: ['contextforge', 'architecture', 'notes'] },
    );

    const logsArray = [
      `[ObsidianWorker] Initializing worker for vault at: ${this.vaultService.getVaultRoot()}`,
      `[ObsidianWorker] Formatted YAML frontmatter and backlinks for: ${vaultResult.relativePath}`,
      `[ObsidianWorker] Wrote ${vaultResult.bytesWritten} bytes (${vaultResult.lineCount} lines) to physical disk: ${vaultResult.absolutePath}`,
      `[ObsidianWorker] File integrity verified. Worker completed in ${vaultResult.durationMs}ms.`,
    ];

    logsArray.slice(1).forEach((log) => {
      emit({
        event: 'side_agent_log',
        data: {
          sideAgentId: 'agent-doc-crawl',
          log,
          riskLevel: 'low_risk',
        },
      });
    });

    // 2. Save artifact to PostgreSQL database
    const artifact = await this.recorder.recordArtifact({
      type: 'markdown_doc',
      title: docTitle,
      content: vaultResult.formattedContent,
      locationPath: vaultResult.relativePath,
      serviceOrigin: 'obsidian',
      wordCount: vaultResult.formattedContent.split(/\s+/).filter(Boolean)
        .length,
    });

    // 3. Save side agent execution record to PostgreSQL database
    const sideAgent = await this.recorder.recordSideAgentExecution({
      agentId: 'agent-doc-crawl',
      agentName: 'Obsidian Vault Worker',
      agentRole: 'Side Agent: Vault & Document Writer',
      taskGoal: `Format markdown and write note to "${vaultResult.relativePath}"`,
      actionType: 'obsidian_write',
      targetResource: vaultResult.relativePath,
      status: 'completed',
      riskLevel: 'low_risk',
      executionTimeMs: vaultResult.durationMs,
      logs: logsArray,
      summary: `Formatted and written note to Obsidian vault at ${vaultResult.relativePath}`,
      filesModified: [vaultResult.absolutePath],
      artifactId: artifact.id,
    });

    emit({
      event: 'artifact_created',
      data: artifact as unknown as Record<string, unknown>,
    });

    const textContent = `Saya telah mendelegasikan penyusunan dokumen ke **Obsidian Vault Worker**. Dokumen lengkap telah ditulis langsung ke folder vault disk lokal dan dibuka di panel **Workspace Aside** sebelah kanan.\n\n### 📋 Ringkasan Dokumen:\n- **Dokumen:** \`${docTitle}\`\n- **Target Vault:** \`${vaultResult.relativePath}\`\n- **Ukuran File:** \`${vaultResult.bytesWritten} bytes\` (${vaultResult.lineCount} baris)\n- **Lokasi Fisik:** \`${vaultResult.absolutePath}\`\n- **Status:** Disk Write Completed & Synced to DB\n\n*Anda dapat membaca, menyunting, atau mengunduh dokumen langsung dari panel editor di sebelah kanan.*`;

    emit({ event: 'chat_chunk', data: { delta: textContent } });
    emit({
      event: 'timeline_stage',
      data: { stage: 'done', label: 'Completed' },
    });

    return {
      textContent,
      intent: {
        toolName: 'dispatch_side_agent',
        service: 'obsidian',
        status: 'completed',
        summaryText: `Obsidian Note Created: ${vaultResult.relativePath}`,
      },
      sideAgent,
      artifact,
    };
  }
}
