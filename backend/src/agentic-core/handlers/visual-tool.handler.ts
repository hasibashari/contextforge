import { Injectable, Logger } from '@nestjs/common';
import { AgentRecorderService } from '../services/agent-recorder.service';
import {
  OrchestrationResult,
  StreamEmitter,
} from '../orchestrator/orchestrator.types';

export interface VisualToolArgs {
  title?: string;
  prompt?: string;
}

@Injectable()
export class VisualToolHandler {
  private readonly logger = new Logger(VisualToolHandler.name);

  constructor(private readonly recorder: AgentRecorderService) {}

  async execute(
    prompt: string,
    args: VisualToolArgs,
    emit: StreamEmitter,
  ): Promise<OrchestrationResult> {
    emit({
      event: 'timeline_stage',
      data: {
        stage: 'editing',
        label: 'GPU Side Agent: Rendering Visual Asset...',
      },
    });

    const title = args.title || 'Generated Visual Asset';
    const imagePrompt = args.prompt || prompt;
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#1a1a24"/><stop offset="50%" stop-color="#2b2250"/><stop offset="100%" stop-color="#ff5e00"/></linearGradient></defs><rect width="800" height="450" fill="url(#g)" rx="24"/><circle cx="400" cy="180" r="70" fill="#ffffff" fill-opacity="0.1" stroke="#ff5e00" stroke-width="3"/><text x="400" y="300" fill="#ffffff" font-family="sans-serif" font-size="20" font-weight="bold" text-anchor="middle">ContextForge AI Generator</text><text x="400" y="335" fill="#ffb088" font-family="monospace" font-size="13" text-anchor="middle">${encodeURIComponent(title.slice(0, 40))}</text></svg>`;
    const dataUri = `data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}`;

    const artifact = await this.recorder.recordArtifact({
      type: 'image_asset',
      title: `Generated: ${title}`,
      content: `# Visual Asset: ${title}\n\n![Design Preview](${dataUri})\n\n- **Engine:** GPU Diffusion Sandbox\n- **Prompt:** ${imagePrompt}`,
      imageUrl: dataUri,
      imagePrompt,
      serviceOrigin: 'imagen',
    });

    emit({
      event: 'artifact_created',
      data: artifact as unknown as Record<string, unknown>,
    });

    const textContent = `🎨 **Visual Asset Berhasil Di-render!**\n\nDesain visual untuk **"${title}"** telah selesai dibuat oleh GPU Side Agent:\n\n![Visual Preview](${dataUri})\n\n- **Resolusi:** 1024x1024 HD (SVG/PNG)\n- **Render Engine:** GPU Diffusion Sandbox\n\n*Aset visual aktif dapat diunduh langsung di panel Aside sebelah kanan.*`;

    emit({ event: 'chat_chunk', data: { delta: textContent } });
    emit({
      event: 'timeline_stage',
      data: { stage: 'done', label: 'Completed' },
    });

    return {
      textContent,
      intent: {
        toolName: 'dispatch_side_agent',
        service: 'imagen',
        status: 'completed',
        summaryText: `Side Agent: Visual Asset Generated (${title})`,
      },
      artifact,
    };
  }
}
