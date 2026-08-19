import { Injectable, Logger } from '@nestjs/common';
import { CodeSandboxService } from '../services/code-sandbox.service';
import { AgentRecorderService } from '../services/agent-recorder.service';
import {
  OrchestrationResult,
  StreamEmitter,
} from '../orchestrator/orchestrator.types';

export interface CodeToolArgs {
  filePath?: string;
  codeContent?: string;
  summary?: string;
}

@Injectable()
export class CodeToolHandler {
  private readonly logger = new Logger(CodeToolHandler.name);

  constructor(
    private readonly sandboxService: CodeSandboxService,
    private readonly recorder: AgentRecorderService,
  ) {}

  async execute(
    prompt: string,
    args: CodeToolArgs,
    emit: StreamEmitter,
  ): Promise<OrchestrationResult> {
    emit({
      event: 'timeline_stage',
      data: {
        stage: 'editing',
        label: 'Code Sandbox: Writing & Verifying Code...',
      },
    });

    const fileTarget = args.filePath || 'src/modules/example.ts';
    const codeContent = args.codeContent || '// TypeScript Implementation';
    const summary = args.summary || `Implemented ${fileTarget}`;

    emit({
      event: 'side_agent_log',
      data: {
        sideAgentId: 'agent-code-reviewer',
        log: `[CodeSandbox] Initializing isolated workspace at: ${this.sandboxService.getSandboxRoot()}`,
        riskLevel: 'medium_risk',
      },
    });

    // 1. Physical file write to local sandbox & AST compiler validation
    const sandboxResult = await this.sandboxService.writeAndValidateCode(
      fileTarget,
      codeContent,
      summary,
    );

    emit({
      event: 'side_agent_log',
      data: {
        sideAgentId: 'agent-code-reviewer',
        log: `[CodeSandbox] Wrote ${sandboxResult.bytesWritten} bytes to disk at: ${sandboxResult.relativePath}`,
        riskLevel: 'medium_risk',
      },
    });

    for (const diag of sandboxResult.diagnostics) {
      emit({
        event: 'side_agent_log',
        data: {
          sideAgentId: 'agent-code-reviewer',
          log: `[CodeSandbox] ${diag}`,
          riskLevel: sandboxResult.astValid ? 'low_risk' : 'medium_risk',
        },
      });
    }

    emit({
      event: 'side_agent_log',
      data: {
        sideAgentId: 'agent-code-reviewer',
        log: `[CodeSandbox] Verification: ${sandboxResult.astValid ? 'PASS (0 syntax errors)' : 'COMPLETED WITH NOTICES'} in ${sandboxResult.durationMs}ms.`,
        riskLevel: 'low_risk',
      },
    });

    // 2. Save artifact to PostgreSQL database
    const artifact = await this.recorder.recordArtifact({
      type: 'code_patch',
      title: `Source Code: ${sandboxResult.relativePath}`,
      content: `\`\`\`typescript\n${codeContent}\n\`\`\``,
      locationPath: sandboxResult.relativePath,
      serviceOrigin: 'github',
      diffs: [
        {
          file: sandboxResult.relativePath,
          additions: sandboxResult.diffStats.additions,
          deletions: sandboxResult.diffStats.deletions,
          newCode: codeContent,
        },
      ],
      wordCount: codeContent.split(/\s+/).filter(Boolean).length,
    });

    const logsArray = [
      `[CodeSandbox] Initializing isolated workspace at: ${this.sandboxService.getSandboxRoot()}`,
      `[CodeSandbox] Wrote ${sandboxResult.bytesWritten} bytes to disk at: ${sandboxResult.relativePath}`,
      ...sandboxResult.diagnostics.map((d) => `[CodeSandbox] ${d}`),
      `[CodeSandbox] Verification: ${sandboxResult.astValid ? 'PASS' : 'WARN'} in ${sandboxResult.durationMs}ms.`,
    ];

    // 3. Save side agent execution record to PostgreSQL database
    const sideAgent = await this.recorder.recordSideAgentExecution({
      agentId: 'agent-code-reviewer',
      agentName: 'CLI & Code Sandbox Runner',
      agentRole: 'Side Agent: Terminal & File Execution',
      taskGoal: `Generate, write, and verify code for "${sandboxResult.relativePath}"`,
      actionType: 'create_file',
      targetResource: sandboxResult.relativePath,
      status: 'completed',
      riskLevel: 'medium_risk',
      executionTimeMs: sandboxResult.durationMs,
      logs: logsArray,
      summary: `Created ${sandboxResult.relativePath} (${sandboxResult.bytesWritten} bytes) with AST verification: ${sandboxResult.astValid ? 'PASS' : 'WARN'}.`,
      filesModified: [sandboxResult.absolutePath],
      artifactId: artifact.id,
    });

    emit({
      event: 'artifact_created',
      data: artifact as unknown as Record<string, unknown>,
    });

    const textContent = `Saya telah mendelegasikan penulisan kode ke **CLI & Code Sandbox Runner**. File lengkap telah ditulis secara fisik ke sandbox dan dibuka di panel **Workspace Aside** sebelah kanan.\n\n### 🔍 Ringkasan Implementasi (\`${sandboxResult.relativePath}\`):\n- **Target File:** \`${sandboxResult.relativePath}\`\n- **Ukuran File:** \`${sandboxResult.bytesWritten} bytes\` (${sandboxResult.lineCount} baris)\n- **Lokasi Fisik:** \`${sandboxResult.absolutePath}\`\n- **AST Verification:** ${sandboxResult.astValid ? '✅ Lolos validasi sintaksis TypeScript AST (0 errors)' : '⚠️ Periksa catatan sintaksis'}\n- **Summary:** ${summary}\n\n*Anda dapat melihat kode lengkap, diff perubahan, dan mengunduh file langsung di panel editor.*`;

    emit({ event: 'chat_chunk', data: { delta: textContent } });
    emit({
      event: 'timeline_stage',
      data: { stage: 'done', label: 'Completed' },
    });

    return {
      textContent,
      intent: {
        toolName: 'dispatch_side_agent',
        service: 'github',
        status: 'completed',
        summaryText: `Side Agent: File Created (${sandboxResult.relativePath})`,
      },
      sideAgent,
      artifact,
    };
  }
}
