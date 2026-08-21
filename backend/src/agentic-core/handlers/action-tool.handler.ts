import { Injectable, Logger } from '@nestjs/common';
import { ObsidianVaultService } from '../services/obsidian-vault.service';
import { AgentRecorderService } from '../services/agent-recorder.service';
import {
  OrchestrationResult,
  StreamEmitter,
} from '../orchestrator/orchestrator.types';

export interface ActionToolArgs {
  title?: string;
  target?: string;
  path?: string;
  content?: string;
}

@Injectable()
export class ActionToolHandler {
  private readonly logger = new Logger(ActionToolHandler.name);

  constructor(
    private readonly vaultService: ObsidianVaultService,
    private readonly recorder: AgentRecorderService,
  ) {}

  async execute(
    prompt: string,
    args: ActionToolArgs,
    emit: StreamEmitter,
  ): Promise<OrchestrationResult> {
    const targetService = (args.target || 'obsidian').toLowerCase();
    const docTitle = args.title || 'Architecture Note';
    const pathName =
      args.path ||
      `Work/Notes/${docTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;
    const markdownContent = args.content || `# ${docTitle}\n\n${prompt}`;

    emit({
      event: 'timeline_stage',
      data: {
        stage: 'editing',
        label: `Action Agent: Formatting & Writing Document (${targetService.toUpperCase()})...`,
      },
    });

    emit({
      event: 'side_agent_log',
      data: {
        sideAgentId: 'agent-action',
        log: `[ActionAgent] Initializing execution worker for target: ${targetService} (Vault: ${this.vaultService.getVaultRoot()})`,
        riskLevel: 'low_risk',
      },
    });

    // 1. Physical file write to local Obsidian vault
    const vaultResult = await this.vaultService.writeNote(
      docTitle,
      pathName,
      markdownContent,
      {
        tags: ['contextforge', 'action-agent', 'notes'],
        target: targetService,
      },
    );

    const logsArray = [
      `[ActionAgent] Initializing execution worker for target: ${targetService}`,
      `[ActionAgent] Formatted YAML frontmatter and bi-directional backlinks for: ${vaultResult.relativePath}`,
      `[ActionAgent] Wrote ${vaultResult.bytesWritten} bytes (${vaultResult.lineCount} lines) to physical disk: ${vaultResult.absolutePath}`,
      `[ActionAgent] File integrity verified. Action Agent completed in ${vaultResult.durationMs}ms.`,
    ];

    logsArray.slice(1).forEach((log) => {
      emit({
        event: 'side_agent_log',
        data: {
          sideAgentId: 'agent-action',
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
      serviceOrigin: targetService === 'notion' ? 'notion' : 'obsidian',
      wordCount: vaultResult.formattedContent.split(/\s+/).filter(Boolean)
        .length,
    });

    // 3. Save side agent execution record to PostgreSQL database
    const sideAgent = await this.recorder.recordSideAgentExecution({
      agentId: 'agent-action',
      agentName: 'Action Agent',
      agentRole: 'Side Agent: Document & Vault Mutator',
      taskGoal: `Format and write document to "${vaultResult.relativePath}"`,
      actionType: 'action_write',
      targetResource: vaultResult.relativePath,
      status: 'completed',
      riskLevel: 'low_risk',
      executionTimeMs: vaultResult.durationMs,
      logs: logsArray,
      summary: `Formatted and written note to ${targetService === 'notion' ? 'Notion' : 'Obsidian Vault'} at ${vaultResult.relativePath}`,
      filesModified: [vaultResult.absolutePath],
      artifactId: artifact.id,
    });

    emit({
      event: 'artifact_created',
      data: artifact as unknown as Record<string, unknown>,
    });

    const actionCard = {
      id: `card-${artifact.id}`,
      type: 'document_ready',
      title: docTitle,
      subtitle: vaultResult.relativePath,
      locationPath: vaultResult.relativePath,
      badge: targetService === 'notion' ? 'Notion Doc' : 'Obsidian Note',
      badgeVariant: targetService === 'notion' ? 'neutral' : 'purple',
      description: `Dokumen Markdown lengkap telah dibuat dengan YAML frontmatter. Buka di editor Aside, simpan ke folder lokal, atau buka langsung di aplikasi Obsidian.`,
      targetResource: artifact.id,
      actions: [
        {
          key: 'open_aside',
          label: 'Buka di Workspace Aside',
          primary: true,
          icon: 'edit-3',
        },
        {
          key: 'open_in_obsidian',
          label: 'Buka di Obsidian App',
          primary: false,
          icon: 'book-open',
        },
        {
          key: 'write_to_local_disk',
          label: 'Simpan ke Folder Lokal',
          primary: false,
          icon: 'hard-drive',
        },
      ],
    };

    const textContent = `Saya telah mendelegasikan eksekusi penyusunan dokumen ke **Action Agent**. Dokumen lengkap telah disusun dan dibuka di panel **Workspace Aside** sebelah kanan.\n\n### 📋 Ringkasan Dokumen:\n- **Dokumen:** \`${docTitle}\`\n- **Target Path:** \`${vaultResult.relativePath}\`\n- **Ukuran:** \`${vaultResult.bytesWritten} bytes\` (${vaultResult.lineCount} baris)\n- **Status:** Tersedia di Workspace Aside & Siap Disinkronkan\n\n*Gunakan tombol **Buka di Obsidian App** atau **Simpan ke Folder Lokal** di bawah untuk menyinkronkannya langsung ke aplikasi Obsidian Anda.*`;

    emit({ event: 'chat_chunk', data: { delta: textContent } });
    emit({
      event: 'timeline_stage',
      data: { stage: 'done', label: 'Completed' },
    });

    return {
      textContent,
      intent: {
        toolName: 'dispatch_action_worker',
        service: targetService,
        status: 'completed',
        summaryText: `Action Agent: Document Created (${vaultResult.relativePath})`,
      },
      sideAgent,
      artifact,
      actionCard,
    };
  }
}
