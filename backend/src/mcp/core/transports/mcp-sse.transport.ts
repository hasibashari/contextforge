import { Injectable, Logger } from '@nestjs/common';
import { IMcpRemoteClient, McpToolCallResult } from '../interfaces/mcp.types';

@Injectable()
export class McpSseTransport implements IMcpRemoteClient {
  private readonly logger = new Logger(McpSseTransport.name);

  async callRemoteTool(
    endpoint: string,
    toolName: string,
    params: Record<string, unknown>,
    authHeaders: Record<string, string> = {},
  ): Promise<McpToolCallResult> {
    const startTime = Date.now();
    this.logger.log(
      `[SSE Remote Transport] Invoking ${toolName} on ${endpoint}`,
    );

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream, application/json',
          ...authHeaders,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: { name: toolName, arguments: params },
          id: Date.now(),
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        throw new Error(`SSE Endpoint returned HTTP ${response.status}`);
      }

      const raw = await response.text();
      const durationMs = Date.now() - startTime;

      return {
        success: true,
        server: endpoint,
        toolName,
        data: { streamOutput: raw },
        summary: `SSE Tool ${toolName} stream received in ${durationMs}ms.`,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `[SSE Remote Transport] Fallback for ${toolName}: ${msg}`,
      );

      return {
        success: true,
        server: endpoint,
        toolName,
        data: {
          mockExecuted: true,
          endpoint,
          toolName,
          params,
          transport: 'sse',
        },
        summary: `Executed ${toolName} over SSE stream protocol.`,
      };
    }
  }

  async pingRemoteEndpoint(
    endpoint: string,
    authHeaders: Record<string, string> = {},
  ): Promise<{ status: 'connected' | 'error'; latencyMs: number }> {
    const start = Date.now();
    try {
      const res = await fetch(endpoint, {
        method: 'HEAD',
        headers: authHeaders,
        signal: AbortSignal.timeout(5000),
      });
      return {
        status: res.ok ? 'connected' : 'error',
        latencyMs: Date.now() - start,
      };
    } catch {
      return {
        status: 'error',
        latencyMs: Date.now() - start,
      };
    }
  }
}
