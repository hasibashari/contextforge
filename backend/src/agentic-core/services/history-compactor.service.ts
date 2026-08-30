import { Injectable, Logger } from '@nestjs/common';

export interface HistoryTurn {
  role: 'user' | 'model';
  parts: { text?: string }[];
}

export interface CompactionResult {
  compactedHistory: HistoryTurn[];
  summaryBlock?: string;
  isCompacted: boolean;
  originalTurnCount: number;
  remainingTurnCount: number;
}

@Injectable()
export class HistoryCompactorService {
  private readonly logger = new Logger(HistoryCompactorService.name);

  // Maximum turns before triggering rolling compaction
  private readonly COMPACTION_THRESHOLD = 10;
  // Recent turns to keep raw and untruncated
  private readonly RECENT_TURNS_TO_PRESERVE = 4;

  /**
   * Compacts long conversation history by creating an executive digest of older turns
   */
  public compactHistory(history: HistoryTurn[]): CompactionResult {
    if (!history || history.length <= this.COMPACTION_THRESHOLD) {
      return {
        compactedHistory: history || [],
        isCompacted: false,
        originalTurnCount: history?.length || 0,
        remainingTurnCount: history?.length || 0,
      };
    }

    const splitIndex = history.length - this.RECENT_TURNS_TO_PRESERVE;
    const olderTurns = history.slice(0, splitIndex);
    const recentTurns = history.slice(splitIndex);

    // Build rolling executive digest
    const summaryLines: string[] = [];
    for (const turn of olderTurns) {
      const text = (turn.parts || [])
        .map((p) => p.text || '')
        .join(' ')
        .trim();
      if (!text) continue;

      const rolePrefix = turn.role === 'user' ? 'User' : 'Assistant';
      const truncated = text.length > 120 ? `${text.slice(0, 120)}...` : text;
      summaryLines.push(`- **${rolePrefix}**: ${truncated}`);
    }

    const summaryBlock = `\n[EXECUTIVE SUMMARY OF EARLIER CONVERSATION]:\n${summaryLines.join('\n')}\n`;

    this.logger.log(
      `📦 Compacted conversation history from ${history.length} to ${recentTurns.length} turns (+ executive digest).`,
    );

    return {
      compactedHistory: recentTurns,
      summaryBlock,
      isCompacted: true,
      originalTurnCount: history.length,
      remainingTurnCount: recentTurns.length,
    };
  }
}
