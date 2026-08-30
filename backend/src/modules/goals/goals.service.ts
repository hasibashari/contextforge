import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  Logger,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { GoogleGenAI } from '@google/genai';
import { GEMINI_CLIENT } from '../../agentic-core/gemini-client.provider';
import {
  GoalsRepository,
  GoalRow,
  GoalTaskRow,
  GoalEvaluationRow,
} from './goals.repository';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import {
  CreateGoalTaskDto,
  UpdateGoalTaskStatusDto,
} from './dto/goal-task.dto';
import { UniversalMcpToolHandler } from '../../agentic-core/handlers/universal-mcp-tool.handler';
import { PersonalHubService } from '../personal-hub/personal-hub.service';
import { AutomationService } from '../automation/automation.service';

interface AiDecomposedTask {
  title: string;
  description?: string;
  mcpTarget?: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  riskLevel?: 'low_risk' | 'medium_risk' | 'high_risk';
  requiresUserApproval?: boolean;
}

interface AiDecompositionResult {
  targetMetrics?: Record<string, any>;
  tasks?: AiDecomposedTask[];
}

interface NotionTaskRecord {
  id?: string;
  title?: string;
  status?: string;
  completed?: boolean;
  lastEditedTime?: string;
}

interface CalendarEventRecord {
  id?: string;
  summary?: string;
  status?: string;
  start?: { dateTime?: string };
  end?: { dateTime?: string };
}

interface AiEvaluationResult {
  summary?: string;
  insights?: string[];
  adaptations?: string[];
}

@Injectable()
export class GoalsService {
  private readonly logger = new Logger(GoalsService.name);

  constructor(
    private readonly repo: GoalsRepository,
    @Inject(GEMINI_CLIENT) private readonly ai: GoogleGenAI,
    private readonly configService: ConfigService,
    private readonly mcpHandler: UniversalMcpToolHandler,
    private readonly personalHubService: PersonalHubService,
    @Inject(forwardRef(() => AutomationService))
    private readonly automationService: AutomationService,
  ) {}

  // --- Goal CRUD ---
  async getAllGoals(guestId?: string): Promise<GoalRow[]> {
    return this.repo.getAllGoals(guestId);
  }

  async getGoalById(id: string, guestId?: string): Promise<GoalRow> {
    const goal = await this.repo.getGoalById(id, guestId);
    if (!goal) {
      throw new NotFoundException(`Goal with ID "${id}" not found`);
    }
    return goal;
  }

  async createGoal(dto: CreateGoalDto, guestId?: string): Promise<GoalRow> {
    if (!dto.title || dto.title.trim() === '') {
      throw new BadRequestException('Goal title is required');
    }

    const createdGoal = await this.repo.createGoal(
      {
        title: dto.title.trim(),
        description: dto.description || '',
        category: dto.category || 'productivity',
        target_metrics: dto.targetMetrics || {
          max_daily_screentime_mins: 90,
          weekly_focus_hours: 10,
        },
        cron_evaluation: dto.cronEvaluation || '0 21 * * *',
        linked_mcp_servers: dto.linkedMcpServers || [
          'android-bridge',
          'google-calendar',
          'notion',
        ],
        notion_parent_page_id: dto.notionParentPageId,
        notion_database_id: dto.notionDatabaseId,
        guest_id: guestId || 'default_guest',
      },
      guestId,
    );

    // Create initial sub-tasks if provided
    if (dto.initialTasks && dto.initialTasks.length > 0) {
      for (const t of dto.initialTasks) {
        await this.repo.createTask({
          goal_id: createdGoal.id,
          title: t.title,
          description: t.description,
          scheduled_start: t.scheduledStart,
          scheduled_end: t.scheduledEnd,
          mcp_target: t.mcpTarget || 'google-calendar',
          risk_level: t.riskLevel || 'low_risk',
        });
      }
    }

    // Register background daily evaluation automation
    try {
      await this.automationService.createAutomation({
        name: `Daily Goal Evaluator: ${createdGoal.title}`,
        description: `Automated closed-loop evaluation & Notion reflection report for goal "${createdGoal.title}"`,
        agent_id: 'agent-personal-assistant',
        agent_name: 'Personal Assistant',
        mcp_server_id: 'notion',
        mcp_tools: [
          'android_get_usage_summary',
          'google_calendar_list_events',
          'notion_create_page',
          'notion_get_tasks',
        ],
        trigger_type: 'schedule',
        schedule_cron: createdGoal.cron_evaluation,
        schedule_label: 'Every Night at 21:00 (Evaluation Closed Loop)',
        prompt_template: `Execute daily evaluation for Goal "${createdGoal.title}" (ID: ${createdGoal.id}). Collect telemetry from Android Bridge, compare against today's Google Calendar, verify task completion status in Notion, compute overall compliance score, and log reflection summary to Notion.`,
        is_active: true,
      });
      this.logger.log(
        `Registered background automation for goal: ${createdGoal.title}`,
      );
    } catch (err: unknown) {
      this.logger.warn(
        `Could not auto-register automation: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    return createdGoal;
  }

  async updateGoal(id: string, dto: UpdateGoalDto): Promise<GoalRow> {
    await this.getGoalById(id);
    return this.repo.updateGoal(id, {
      title: dto.title,
      description: dto.description,
      category: dto.category,
      status: dto.status,
      target_metrics: dto.targetMetrics,
      current_progress_pct: dto.currentProgressPct,
      streak_days: dto.streakDays,
      cron_evaluation: dto.cronEvaluation,
      linked_mcp_servers: dto.linkedMcpServers,
      notion_parent_page_id: dto.notionParentPageId,
      notion_database_id: dto.notionDatabaseId,
    });
  }

  async deleteGoal(id: string): Promise<{ success: boolean }> {
    const success = await this.repo.deleteGoal(id);
    return { success };
  }

  // --- Goal Tasks Management & Tri-State Verification ---
  async getTasksByGoalId(goalId: string): Promise<GoalTaskRow[]> {
    await this.getGoalById(goalId);
    return this.repo.getTasksByGoalId(goalId);
  }

  async createTask(dto: CreateGoalTaskDto): Promise<GoalTaskRow> {
    await this.getGoalById(dto.goalId);
    return this.repo.createTask({
      goal_id: dto.goalId,
      title: dto.title,
      description: dto.description,
      scheduled_start: dto.scheduledStart,
      scheduled_end: dto.scheduledEnd,
      mcp_target: dto.mcpTarget || 'google-calendar',
      mcp_resource_id: dto.mcpResourceId,
      risk_level: dto.riskLevel || 'low_risk',
      requires_user_approval: dto.requiresUserApproval || false,
    });
  }

  async updateTaskStatus(
    taskId: string,
    dto: UpdateGoalTaskStatusDto,
  ): Promise<GoalTaskRow> {
    const task = await this.repo.getTaskById(taskId);
    if (!task) {
      throw new NotFoundException(`Task with ID "${taskId}" not found`);
    }

    const updated = await this.repo.updateTask(taskId, {
      status: dto.status,
      verification_evidence: dto.verificationEvidence,
      verification_notes: dto.verificationNotes,
      user_approval_status: dto.userApprovalStatus,
    });

    // Recalculate goal progress
    await this.recalculateGoalProgress(task.goal_id);

    return updated;
  }

  async deleteTask(taskId: string): Promise<{ success: boolean }> {
    const task = await this.repo.getTaskById(taskId);
    if (!task) throw new NotFoundException(`Task "${taskId}" not found`);

    const success = await this.repo.deleteTask(taskId);
    await this.recalculateGoalProgress(task.goal_id);
    return { success };
  }

  // --- AI Autonomous Goal Decomposition ---
  async decomposeGoalWithAi(
    goalId: string,
    additionalContext?: string,
  ): Promise<{ goal: GoalRow; tasks: GoalTaskRow[] }> {
    const goal = await this.getGoalById(goalId);
    const modelName = this.configService.get<string>(
      'gemini.defaultModel',
      'gemini-3.5-flash',
    );

    const now = new Date();
    const isoToday = now.toISOString().slice(0, 10);

    const prompt = `You are the Goal-Oriented Strategic Decomposition Engine in ContextForge.
Decompose the following high-level user goal into 3 to 5 concrete, actionable, SMART sub-tasks grounded in available MCP tools (Google Calendar, Notion, Android Bridge).

Goal Title: "${goal.title}"
Goal Category: ${goal.category}
Goal Description: "${goal.description}"
Additional Context: "${additionalContext || 'None'}"
Current Reference Date: "${isoToday}"

Return strictly a JSON object with this format (no markdown formatting outside JSON):
{
  "summary": "Brief executive summary of strategy",
  "targetMetrics": {
    "daily_focus_mins": 120,
    "max_screentime_mins": 90
  },
  "tasks": [
    {
      "title": "Clear action title",
      "description": "Details of what to do",
      "mcpTarget": "google-calendar" | "notion" | "android-bridge",
      "scheduledStart": "${isoToday}T09:00:00+07:00",
      "scheduledEnd": "${isoToday}T11:00:00+07:00",
      "riskLevel": "low_risk" | "medium_risk" | "high_risk",
      "requiresUserApproval": false
    }
  ]
}`;

    try {
      const response = await this.ai.models.generateContent({
        model: modelName,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      });

      const rawJson = response.text || '{}';
      const parsed = JSON.parse(rawJson) as AiDecompositionResult;

      // Update goal metrics if provided
      if (parsed.targetMetrics) {
        await this.repo.updateGoal(goalId, {
          target_metrics: {
            ...goal.target_metrics,
            ...parsed.targetMetrics,
          },
        });
      }

      // Create decomposed tasks
      const createdTasks: GoalTaskRow[] = [];
      if (Array.isArray(parsed.tasks)) {
        for (const t of parsed.tasks) {
          const created = await this.repo.createTask({
            goal_id: goalId,
            title: t.title,
            description: t.description,
            scheduled_start: t.scheduledStart,
            scheduled_end: t.scheduledEnd,
            mcp_target: t.mcpTarget || 'google-calendar',
            risk_level: t.riskLevel || 'low_risk',
            requires_user_approval: Boolean(t.requiresUserApproval),
          });
          createdTasks.push(created);
        }
      }

      const updatedGoal = await this.getGoalById(goalId);
      return { goal: updatedGoal, tasks: createdTasks };
    } catch (err: unknown) {
      this.logger.error(
        `Failed to decompose goal with AI: ${err instanceof Error ? err.message : String(err)}`,
      );
      throw new BadRequestException(
        'Failed to decompose goal. Please check input parameters.',
      );
    }
  }

  // --- Tri-State Verification Engine ---
  async verifyTaskWithMcp(taskId: string): Promise<{
    status: 'verified_completed' | 'incomplete' | 'unverified';
    evidence: Record<string, any>;
    notes: string;
  }> {
    const task = await this.repo.getTaskById(taskId);
    if (!task) throw new NotFoundException(`Task "${taskId}" not found`);

    let verificationStatus: 'verified_completed' | 'incomplete' | 'unverified' =
      'unverified';
    let evidence: Record<string, any> = {};
    let notes = '';

    try {
      if (task.mcp_target === 'notion') {
        // Query Notion tasks to check if the item is marked as Done
        const notionRes = await this.mcpHandler.execute(
          'notion_get_tasks',
          task.title,
          { filter: task.title },
          () => {},
        );

        const rawNotion = (notionRes.rawResult || {}) as {
          tasks?: NotionTaskRecord[];
        };
        if (rawNotion.tasks && Array.isArray(rawNotion.tasks)) {
          const matched = rawNotion.tasks.find(
            (t: NotionTaskRecord) =>
              (t.title &&
                t.title.toLowerCase().includes(task.title.toLowerCase())) ||
              (t.title &&
                task.title.toLowerCase().includes(t.title.toLowerCase())),
          );

          if (matched) {
            const statusStr = (matched.status || '').toLowerCase();
            if (
              statusStr === 'done' ||
              statusStr === 'completed' ||
              matched.completed === true
            ) {
              verificationStatus = 'verified_completed';
              evidence = {
                source: 'notion_workspace',
                pageId: matched.id,
                status: matched.status,
                lastEdited: matched.lastEditedTime,
              };
              notes = `Verified completed in Notion Workspace (Page: ${matched.title || task.title}).`;
            } else {
              verificationStatus = 'incomplete';
              evidence = {
                source: 'notion_workspace',
                status: matched.status,
              };
              notes = `Found in Notion but status is still: "${matched.status || 'pending'}".`;
            }
          } else {
            verificationStatus = 'unverified';
            notes =
              'Task was not found in Notion Workspace during automated check.';
          }
        }
      } else if (task.mcp_target === 'google-calendar') {
        const calRes = await this.mcpHandler.execute(
          'google_calendar_list_events',
          task.title,
          {
            q: task.title,
            timeMin: task.scheduled_start || new Date().toISOString(),
          },
          () => {},
        );

        const rawCal = (calRes.rawResult || {}) as {
          events?: CalendarEventRecord[];
        };
        const events = rawCal.events || [];
        if (events.length > 0) {
          const ev = events[0];
          const summaryStr = ev.summary || '';
          if (
            summaryStr.includes('✅') ||
            summaryStr.toLowerCase().includes('done') ||
            summaryStr.toLowerCase().includes('selesai') ||
            ev.status === 'confirmed'
          ) {
            verificationStatus = 'verified_completed';
            evidence = {
              source: 'google_calendar',
              eventId: ev.id,
              summary: ev.summary,
            };
            notes = `Verified from Google Calendar schedule: ${summaryStr}`;
          } else {
            verificationStatus = 'unverified';
            notes =
              'Calendar event exists, but requires manual completion confirmation from user.';
          }
        }
      } else if (task.mcp_target === 'android-bridge') {
        const goal = await this.repo.getGoalById(task.goal_id);
        const targetMetrics = goal?.target_metrics || {};
        const maxMinutes =
          typeof targetMetrics.max_screentime_mins === 'number'
            ? targetMetrics.max_screentime_mins
            : typeof targetMetrics.max_daily_screentime_mins === 'number'
              ? targetMetrics.max_daily_screentime_mins
              : 90;
        const maxMs = Number(maxMinutes) * 60 * 1000;

        const androidRes = await this.mcpHandler.execute(
          'android_get_usage_summary',
          task.title,
          { days: 1 },
          () => {},
        );

        const rawResult = (androidRes.rawResult || {}) as Record<
          string,
          unknown
        >;
        const rawData = (rawResult.data || {}) as {
          totalScreenTimeMs?: number;
          formattedTotalScreenTime?: string;
          apps?: Array<{
            packageName: string;
            totalTimeInForegroundMs: number;
          }>;
        };

        const totalScreenTime = rawData.totalScreenTimeMs ?? 0;
        const formattedTotal =
          rawData.formattedTotalScreenTime ||
          `${Math.round(totalScreenTime / 60000)} mins`;

        const targetPkg = task.mcp_resource_id;
        let appUsageMs = totalScreenTime;
        let appLabel = 'Total Screen Time';

        if (targetPkg && rawData.apps) {
          const matchedApp = rawData.apps.find(
            (a) => a.packageName.toLowerCase() === targetPkg.toLowerCase(),
          );
          if (matchedApp) {
            appUsageMs = matchedApp.totalTimeInForegroundMs;
            appLabel = targetPkg;
          }
        }

        if (rawResult.success === false) {
          verificationStatus = 'unverified';
          notes =
            'Android Bridge device is currently offline or unreachable. Marked as unverified.';
        } else if (appUsageMs <= maxMs) {
          verificationStatus = 'verified_completed';
          evidence = {
            source: 'android_bridge_telemetry',
            target: appLabel,
            actualUsageMs: appUsageMs,
            limitMs: maxMs,
            formattedActualUsage: formattedTotal,
            formattedLimit: `${maxMinutes} mins`,
          };
          notes = `Verified via Android Telemetry: ${appLabel} usage (${formattedTotal}) is within the target limit of ${maxMinutes} mins.`;
        } else {
          verificationStatus = 'incomplete';
          evidence = {
            source: 'android_bridge_telemetry',
            target: appLabel,
            actualUsageMs: appUsageMs,
            limitMs: maxMs,
            formattedActualUsage: formattedTotal,
            formattedLimit: `${maxMinutes} mins`,
          };
          notes = `Screen time target exceeded: ${appLabel} reached ${formattedTotal}, exceeding the ${maxMinutes} mins limit.`;
        }
      } else {
        // Physical or general offline task
        verificationStatus = 'unverified';
        notes =
          'Task requires explicit human-in-the-loop confirmation (Zero-Assumption Policy).';
      }
    } catch (mcpErr: unknown) {
      verificationStatus = 'unverified';
      notes = `MCP connector offline/failed: ${mcpErr instanceof Error ? mcpErr.message : String(mcpErr)}. Marked as unverified.`;
    }

    await this.repo.updateTask(taskId, {
      status: verificationStatus,
      verification_evidence: evidence,
      verification_notes: notes,
    });

    await this.recalculateGoalProgress(task.goal_id);

    return { status: verificationStatus, evidence, notes };
  }

  // --- Daily Evaluation Pipeline & Notion Sync ---
  async runDailyGoalEvaluation(goalId: string): Promise<GoalEvaluationRow> {
    const goal = await this.getGoalById(goalId);
    const tasks = await this.repo.getTasksByGoalId(goalId);

    const completed = tasks.filter(
      (t) => t.status === 'verified_completed',
    ).length;
    const incomplete = tasks.filter(
      (t) => t.status === 'incomplete' || t.status === 'pending',
    ).length;
    const unverified = tasks.filter((t) => t.status === 'unverified').length;

    const total = tasks.length || 1;
    const scorePct = Math.round((completed / total) * 100);

    const isStreakMaintained = scorePct >= 70;
    const newStreak = isStreakMaintained ? goal.streak_days + 1 : 0;

    // Optional: Fetch Android Telemetry for multi-day context if linked
    let androidTelemetrySummary = '';
    const hasAndroid =
      goal.linked_mcp_servers?.includes('android-bridge') ||
      tasks.some((t) => t.mcp_target === 'android-bridge');
    if (hasAndroid) {
      try {
        const androidRes = await this.mcpHandler.execute(
          'android_get_usage_summary',
          goal.title,
          { days: 7 },
          () => {},
        );
        if (androidRes.summary) {
          androidTelemetrySummary = `\n\nAndroid Bridge 7-Day Telemetry Context:\n${androidRes.summary}`;
        }
      } catch {
        // Telemetry fetch fallback safe
      }
    }

    // AI Synthesis for Reflection & Adaptation
    const modelName = this.configService.get<string>(
      'gemini.defaultModel',
      'gemini-3.5-flash',
    );

    const todayStr = new Date().toISOString().slice(0, 10);
    const evalPrompt = `You are ContextForge Daily Goal Evaluation Agent.
Synthesize the daily productivity evaluation for:
Goal: "${goal.title}"
Date: "${todayStr}"
Tasks Completed: ${completed}/${tasks.length}
Tasks Incomplete: ${incomplete}
Tasks Unverified: ${unverified}
Compliance Score: ${scorePct}%
Current Streak: ${newStreak} days

Tasks Breakdown:
${tasks.map((t) => `- [${t.status}] ${t.title} (${t.mcp_target || 'general'})`).join('\n')}${androidTelemetrySummary}

Generate a JSON with:
{
  "summary": "Multi-paragraph rich reflection in Indonesian",
  "insights": ["Key behavioral insight 1", "Chronotype observation 2"],
  "adaptations": ["Suggested schedule adjustment for tomorrow", "Habit tip"]
}`;

    let summary = `Daily evaluation for ${goal.title}: ${scorePct}% compliance score. ${completed} of ${tasks.length} tasks verified completed.`;
    let insights: string[] = [];
    let adaptations: string[] = [];

    try {
      const aiRes = await this.ai.models.generateContent({
        model: modelName,
        contents: [{ role: 'user', parts: [{ text: evalPrompt }] }],
        config: {
          temperature: 0.3,
          responseMimeType: 'application/json',
        },
      });

      const parsed = JSON.parse(aiRes.text || '{}') as AiEvaluationResult;
      if (parsed.summary) summary = parsed.summary;
      if (Array.isArray(parsed.insights)) insights = parsed.insights;
      if (Array.isArray(parsed.adaptations)) adaptations = parsed.adaptations;
    } catch {
      // Fallback safe
    }

    // Write Journal to Notion Workspace
    let notionPageUrl: string | undefined;
    try {
      const notionMarkdown = `# 🎯 Daily Reflection: ${goal.title} (${todayStr})

> [!NOTE] **Productivity Compliance Score: ${scorePct}%** | **🔥 Streak: ${newStreak} Days**

### 📊 Execution Overview
${summary}

### 📋 Daily Task Breakdown
${tasks.map((t) => `- [${t.status === 'verified_completed' ? 'x' : ' '}] **${t.title}** (${t.status.toUpperCase()})`).join('\n')}

### 💡 Productivity Insights & Focus Patterns
${insights.map((i) => `- ${i}`).join('\n')}

### 🚀 Actionable Adaptations for Tomorrow
${adaptations.map((a) => `- ${a}`).join('\n')}
`;

      const notionRes = await this.mcpHandler.execute(
        'notion_create_page',
        `Daily Reflection: ${goal.title}`,
        {
          title: `🎯 Goal Reflection: ${goal.title} (${todayStr})`,
          content: notionMarkdown,
          parentPageId: goal.notion_parent_page_id,
        },
        () => {},
      );

      const rawNotion = (notionRes.rawResult || {}) as { url?: string };
      if (rawNotion.url) {
        notionPageUrl = rawNotion.url;
      }
    } catch (notionErr: unknown) {
      this.logger.warn(
        `Failed to sync evaluation to Notion: ${notionErr instanceof Error ? notionErr.message : String(notionErr)}`,
      );
    }

    // Save Long-Term Memory
    try {
      await this.personalHubService.createUserMemory({
        category: 'workflow',
        key: `goal_chronotype_${goal.id}`,
        value: `Evaluation ${todayStr}: Score ${scorePct}%. Insight: ${insights.join('; ')}`,
      });
    } catch {
      // Memory fallback safe
    }

    // Update Goal Status
    await this.repo.updateGoal(goalId, {
      current_progress_pct: scorePct,
      streak_days: newStreak,
    });

    return this.repo.createEvaluation({
      goal_id: goalId,
      evaluation_date: todayStr,
      score_pct: scorePct,
      summary,
      tasks_completed: completed,
      tasks_incomplete: incomplete,
      tasks_unverified: unverified,
      insights,
      adaptations_proposed: adaptations,
      notion_page_url: notionPageUrl,
    });
  }

  async getEvaluations(goalId: string): Promise<GoalEvaluationRow[]> {
    await this.getGoalById(goalId);
    return this.repo.getEvaluationsByGoalId(goalId);
  }

  private async recalculateGoalProgress(goalId: string): Promise<void> {
    try {
      const tasks = await this.repo.getTasksByGoalId(goalId);
      if (tasks.length === 0) return;

      const completed = tasks.filter(
        (t) => t.status === 'verified_completed',
      ).length;
      const progress = Math.round((completed / tasks.length) * 100);

      await this.repo.updateGoal(goalId, {
        current_progress_pct: progress,
      });
    } catch (err: unknown) {
      this.logger.warn(
        `Failed to recalculate goal progress: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
