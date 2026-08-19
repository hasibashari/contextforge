import { Injectable, Logger } from '@nestjs/common';
import { AgentRecorderService } from '../services/agent-recorder.service';
import {
  OrchestrationResult,
  StreamEmitter,
} from '../orchestrator/orchestrator.types';

export interface CalendarToolArgs {
  title?: string;
  eventDate?: string;
  eventTime?: string;
  duration?: string;
  category?: string;
}

@Injectable()
export class CalendarToolHandler {
  private readonly logger = new Logger(CalendarToolHandler.name);

  constructor(private readonly recorder: AgentRecorderService) {}

  async execute(
    prompt: string,
    args: CalendarToolArgs,
    emit: StreamEmitter,
  ): Promise<OrchestrationResult> {
    emit({
      event: 'timeline_stage',
      data: {
        stage: 'editing',
        label: 'Calendar Worker: Scheduling Google Calendar Event...',
      },
    });

    const title = args.title || prompt.slice(0, 50);
    const eventTime = args.eventTime || '09:00 AM';
    const duration = args.duration || '30m';
    const category = args.category || 'task';

    // Smart date parsing
    let eventDate = args.eventDate;
    if (
      !eventDate ||
      eventDate.toLowerCase().includes('today') ||
      eventDate.toLowerCase().includes('hari ini')
    ) {
      eventDate = new Date().toISOString().split('T')[0];
    } else if (
      eventDate.toLowerCase().includes('tomorrow') ||
      eventDate.toLowerCase().includes('besok')
    ) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      eventDate = tomorrow.toISOString().split('T')[0];
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
      eventDate = new Date().toISOString().split('T')[0];
    }

    await this.recorder.recordCalendarEvent({
      title,
      eventDate,
      eventTime,
      duration,
      category,
      status: 'upcoming',
    });

    emit({
      event: 'side_agent_log',
      data: {
        sideAgentId: 'agent-db-platform',
        log: `[CalendarWorker] Scheduled event "${title}" on ${eventDate} @ ${eventTime}`,
        riskLevel: 'low_risk',
      },
    });

    const textContent = `📅 **Jadwal Berhasil Dibuat!**\n\nSaya telah mendelegasikan penjadwalan ke **Calendar & Workflow Worker**:\n- **Acara:** ${title}\n- **Tanggal:** ${eventDate}\n- **Waktu:** ${eventTime} (${duration})\n- **Kategori:** ${category}\n- **Status:** Upcoming & Synced ke panel Schedule.`;

    emit({ event: 'chat_chunk', data: { delta: textContent } });
    emit({
      event: 'timeline_stage',
      data: { stage: 'done', label: 'Completed' },
    });

    return {
      textContent,
      intent: {
        toolName: 'dispatch_side_agent',
        service: 'calendar',
        status: 'completed',
        summaryText: `Side Agent: Calendar Scheduled (${title})`,
      },
    };
  }
}
