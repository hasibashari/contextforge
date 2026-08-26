import type { FunctionDeclaration, Schema, Type } from '@google/genai';
import { OBSIDIAN_MCP_TOOLS } from '../../mcp/connectors/obsidian/obsidian-tools.definition';
import { NOTION_MCP_TOOLS } from '../../mcp/connectors/notion/notion-tools.definition';
import { GOOGLE_CALENDAR_MCP_TOOLS } from '../../mcp/connectors/google-calendar/google-calendar-tools.definition';
import { ANDROID_BRIDGE_MCP_TOOLS } from '../../mcp/connectors/android-bridge/android-bridge-tools.definition';
import { McpToolDefinition } from '../../mcp/core';

const strProp = (description: string): Schema => ({
  type: 'STRING' as unknown as Type,
  description,
});

const arrayProp = (description: string): Schema => ({
  type: 'ARRAY' as unknown as Type,
  description,
  items: { type: 'STRING' as unknown as Type },
});

export interface ToolMetadata {
  name: string;
  category:
    | 'mcp_obsidian'
    | 'mcp_notion'
    | 'mcp_google_calendar'
    | 'mcp_android_bridge'
    | 'internal_rag'
    | 'web_search'
    | 'automation';
  readOnly: boolean;
  serverName: string;
  description: string;
}

function mapSchemaType(rawType?: string): Type {
  const normalized = (rawType || 'STRING').toUpperCase();
  switch (normalized) {
    case 'BOOLEAN':
      return 'BOOLEAN' as unknown as Type;
    case 'OBJECT':
      return 'OBJECT' as unknown as Type;
    case 'ARRAY':
      return 'ARRAY' as unknown as Type;
    case 'INTEGER':
      return 'INTEGER' as unknown as Type;
    case 'NUMBER':
      return 'NUMBER' as unknown as Type;
    default:
      return 'STRING' as unknown as Type;
  }
}

/**
 * Converts a standard MCP JSON Schema parameter definition into a Google GenAI SDK Schema object
 */
export function convertMcpSchemaToGenAi(
  prop: Record<string, unknown> | string,
): Schema {
  if (typeof prop === 'string') {
    const isArray = prop.toUpperCase() === 'ARRAY';
    return {
      type: mapSchemaType(prop),
      ...(isArray ? { items: { type: 'STRING' as unknown as Type } } : {}),
    };
  }

  const pType = (prop.type as string)?.toUpperCase() || 'STRING';
  const isArray = pType === 'ARRAY';
  const schema: Schema = {
    type: mapSchemaType(prop.type as string | undefined),
    description: prop.description as string | undefined,
  };

  if (isArray) {
    if (prop.items) {
      if (typeof prop.items === 'string' || typeof prop.items === 'object') {
        schema.items = convertMcpSchemaToGenAi(
          prop.items as Record<string, unknown> | string,
        );
      } else {
        schema.items = { type: 'STRING' as unknown as Type };
      }
    } else {
      schema.items = { type: 'STRING' as unknown as Type };
    }
  }

  if (prop.properties && typeof prop.properties === 'object') {
    const nestedProps: Record<string, Schema> = {};
    for (const [key, val] of Object.entries(prop.properties)) {
      nestedProps[key] = convertMcpSchemaToGenAi(
        val as Record<string, unknown>,
      );
    }
    schema.properties = nestedProps;
  }

  if (Array.isArray(prop.required)) {
    schema.required = prop.required as string[];
  }

  return schema;
}

/**
 * Converts a standard MCP Tool Definition into a Google GenAI SDK FunctionDeclaration
 */
export function convertMcpToolToGenAiDeclaration(
  tool: McpToolDefinition,
): FunctionDeclaration {
  const paramsSchema = tool.parametersSchema as
    Record<string, unknown> | undefined;
  const properties: Record<string, Schema> = {};
  const required: string[] =
    paramsSchema && Array.isArray(paramsSchema.required)
      ? (paramsSchema.required as string[])
      : [];

  if (
    paramsSchema &&
    paramsSchema.properties &&
    typeof paramsSchema.properties === 'object'
  ) {
    for (const [key, propVal] of Object.entries(paramsSchema.properties)) {
      properties[key] = convertMcpSchemaToGenAi(
        propVal as Record<string, unknown>,
      );
    }
  }

  return {
    name: tool.name,
    description: tool.description,
    parameters: {
      type: 'OBJECT' as unknown as Type,
      properties,
      required: required.length > 0 ? required : undefined,
    },
  };
}

/**
 * Native Built-in Agentic Tools (Internal AI capabilities that do not originate from external MCP servers)
 */
export const NATIVE_AGENTIC_FUNCTION_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: 'transfer_to_agent',
    description:
      'Multi-Agent Handoff: Delegates the current goal, deep research investigation, or document execution task to a specialized agent persona.',
    parameters: {
      type: 'OBJECT' as unknown as Type,
      properties: {
        target_agent_id: strProp(
          'Target agent identifier: "agent-research" or "agent-search" (for deep technical literature, multi-step query decomposition, source verification & web grounding), or "agent-personal-assistant"',
        ),
        sub_task: strProp(
          'Specific sub-task or question delegated to the target specialist',
        ),
        reason: strProp(
          'Brief reasoning why this specialist persona is needed',
        ),
      },
      required: ['target_agent_id', 'sub_task'],
    },
  },
  {
    name: 'search_knowledge_vault',
    description:
      'Internal Vector RAG: Searches indexed workspace documents and technical files using semantic vector similarity (pgvector).',
    parameters: {
      type: 'OBJECT' as unknown as Type,
      properties: {
        query: strProp(
          'Semantic search query or topic to look up in internal knowledge base',
        ),
      },
      required: ['query'],
    },
  },
  {
    name: 'web_search',
    description:
      'Web Grounding: Performs live web research to retrieve up-to-date documentation and external facts.',
    parameters: {
      type: 'OBJECT' as unknown as Type,
      properties: {
        query: strProp('Search query keywords or research topic'),
      },
      required: ['query'],
    },
  },
  {
    name: 'create_scheduled_automation',
    description:
      'Automation Scheduler: Registers an autonomous background automation rule with cron schedule trigger and assigned MCP tools.',
    parameters: {
      type: 'OBJECT' as unknown as Type,
      properties: {
        name: strProp(
          'Descriptive workflow name, e.g. "Daily Notion Tasks Briefing"',
        ),
        description: strProp(
          'Short description of what the background automation executes',
        ),
        schedule_cron: strProp(
          'Standard 5-field cron expression, e.g. "0 8 * * *" for 08:00 AM daily',
        ),
        schedule_label: strProp(
          'Human-readable schedule string, e.g. "Every day at 08:00 AM"',
        ),
        mcp_server_id: strProp(
          'Target MCP Server identifier, e.g. "int-notion-mcp" or "int-obsidian-vault-mcp"',
        ),
        mcp_tools: arrayProp(
          'Array of tool names to execute, e.g. ["notion_get_tasks", "obsidian_create_daily_note"]',
        ),
        prompt_template: strProp(
          'Instruction prompt template sent to the agent when triggered',
        ),
      },
      required: ['name', 'schedule_cron', 'mcp_server_id'],
    },
  },
  {
    name: 'create_goal',
    description:
      'Goal Management: Registers a new high-level user goal (e.g. "Increase productivity", "Learn TypeScript", "Reduce screen time") with target metrics and cron evaluation schedule.',
    parameters: {
      type: 'OBJECT' as unknown as Type,
      properties: {
        title: strProp('Descriptive title of the goal'),
        description: strProp('Detailed explanation and success criteria'),
        category: strProp(
          'Category: "productivity" | "learning" | "health" | "finance" | "custom"',
        ),
        cron_evaluation: strProp(
          'Evaluation schedule cron expression, defaults to "0 21 * * *"',
        ),
      },
      required: ['title'],
    },
  },
  {
    name: 'list_goals',
    description:
      'Goal Management: Lists all current active user goals, progress rates, streaks, and target metrics.',
    parameters: {
      type: 'OBJECT' as unknown as Type,
      properties: {},
    },
  },
  {
    name: 'decompose_goal_into_tasks',
    description:
      'Goal Planner: Autonomously decomposes a high-level goal into actionable SMART sub-tasks grounded in MCP tools (Google Calendar, Notion, Android Bridge).',
    parameters: {
      type: 'OBJECT' as unknown as Type,
      properties: {
        goal_id: strProp('ID of the target goal to decompose'),
        additional_context: strProp(
          'Optional user preferences or schedule constraints',
        ),
      },
      required: ['goal_id'],
    },
  },
  {
    name: 'verify_task_completion',
    description:
      'Evidence Verification (Epistemic Rigor): Validates whether a specific goal task is completed based on telemetry from Notion (status Done), Google Calendar, or marks it as "unverified" if evidence is absent (Zero-Assumption Policy).',
    parameters: {
      type: 'OBJECT' as unknown as Type,
      properties: {
        task_id: strProp('ID of the task to verify'),
      },
      required: ['task_id'],
    },
  },
  {
    name: 'record_goal_evaluation',
    description:
      'Closed-Loop Reflection: Executes daily evaluation for a goal, computes compliance score, generates adaptive recommendations, and writes reflection journal to Notion Workspace.',
    parameters: {
      type: 'OBJECT' as unknown as Type,
      properties: {
        goal_id: strProp('ID of the goal to evaluate'),
      },
      required: ['goal_id'],
    },
  },
  {
    name: 'manage_automation_lifecycle',
    description:
      'Self-Adaptive Automation Lifecycle: Dynamically pauses, updates, or deletes background automations when a goal evolves or priority changes.',
    parameters: {
      type: 'OBJECT' as unknown as Type,
      properties: {
        automation_id: strProp('ID of the automation workflow'),
        action: strProp(
          'Action to perform: "pause" | "resume" | "update" | "delete"',
        ),
        new_cron: strProp('Optional updated cron schedule expression'),
        new_prompt: strProp('Optional updated instruction prompt template'),
      },
      required: ['automation_id', 'action'],
    },
  },
];

/**
 * Unified Catalog of All Available Tools in the Reasoning Workspace
 */
export const BUILTIN_FUNCTION_DECLARATIONS: FunctionDeclaration[] = [
  ...NATIVE_AGENTIC_FUNCTION_DECLARATIONS,
  ...OBSIDIAN_MCP_TOOLS.map(convertMcpToolToGenAiDeclaration),
  ...NOTION_MCP_TOOLS.map(convertMcpToolToGenAiDeclaration),
  ...GOOGLE_CALENDAR_MCP_TOOLS.map(convertMcpToolToGenAiDeclaration),
  ...ANDROID_BRIDGE_MCP_TOOLS.map(convertMcpToolToGenAiDeclaration),
];

/**
 * Metadata Registry for Tool Categories and Server Origins
 */
export const TOOL_CATALOG: Record<string, ToolMetadata> = {
  // 1. Native Agentic Tools
  transfer_to_agent: {
    name: 'transfer_to_agent',
    category: 'internal_rag',
    readOnly: true,
    serverName: 'ContextForge Multi-Agent Router',
    description:
      'Delegates conversational context or a specialized sub-task to another agent persona.',
  },
  search_knowledge_vault: {
    name: 'search_knowledge_vault',
    category: 'internal_rag',
    readOnly: true,
    serverName: 'PostgreSQL pgvector RAG',
    description:
      'Searches internal knowledge base, specifications, and uploaded documents using vector embeddings.',
  },
  web_search: {
    name: 'web_search',
    category: 'web_search',
    readOnly: true,
    serverName: 'Google Search Grounding',
    description:
      'Fetches live technical documentation and factual grounding from the web.',
  },
  create_scheduled_automation: {
    name: 'create_scheduled_automation',
    category: 'automation',
    readOnly: false,
    serverName: 'ContextForge Automation Scheduler',
    description:
      'Registers a background automation workflow triggered by cron schedule.',
  },
  create_goal: {
    name: 'create_goal',
    category: 'automation',
    readOnly: false,
    serverName: 'Goal-Oriented AI Engine',
    description: 'Registers a new long-term goal with target metrics.',
  },
  list_goals: {
    name: 'list_goals',
    category: 'automation',
    readOnly: true,
    serverName: 'Goal-Oriented AI Engine',
    description: 'Lists all current active goals and their progress.',
  },
  decompose_goal_into_tasks: {
    name: 'decompose_goal_into_tasks',
    category: 'automation',
    readOnly: false,
    serverName: 'Goal-Oriented AI Engine',
    description: 'Decomposes goals into actionable MCP tasks.',
  },
  verify_task_completion: {
    name: 'verify_task_completion',
    category: 'automation',
    readOnly: false,
    serverName: 'Goal-Oriented AI Engine',
    description:
      'Verifies task completion against telemetry without assumption.',
  },
  record_goal_evaluation: {
    name: 'record_goal_evaluation',
    category: 'automation',
    readOnly: false,
    serverName: 'Goal-Oriented AI Engine',
    description:
      'Performs closed-loop daily reflection and Notion journal creation.',
  },
  manage_automation_lifecycle: {
    name: 'manage_automation_lifecycle',
    category: 'automation',
    readOnly: false,
    serverName: 'ContextForge Automation Scheduler',
    description: 'Manages dynamic lifecycle of background automations.',
  },

  // 2. Obsidian MCP Tools (Mapped dynamically)
  ...Object.fromEntries(
    OBSIDIAN_MCP_TOOLS.map((t) => [
      t.name,
      {
        name: t.name,
        category: 'mcp_obsidian' as const,
        readOnly: Boolean(t.readOnly),
        serverName: 'Obsidian MCP Server',
        description: t.description,
      },
    ]),
  ),

  // 3. Notion MCP Tools (Mapped dynamically)
  ...Object.fromEntries(
    NOTION_MCP_TOOLS.map((t) => [
      t.name,
      {
        name: t.name,
        category: 'mcp_notion' as const,
        readOnly: Boolean(t.readOnly),
        serverName: 'Notion MCP Server',
        description: t.description,
      },
    ]),
  ),

  // 4. Google Calendar MCP Tools (Mapped dynamically)
  ...Object.fromEntries(
    GOOGLE_CALENDAR_MCP_TOOLS.map((t) => [
      t.name,
      {
        name: t.name,
        category: 'mcp_google_calendar' as const,
        readOnly: Boolean(t.readOnly),
        serverName: 'Google Calendar MCP Server',
        description: t.description,
      },
    ]),
  ),

  // 5. Android Bridge MCP Tools (Mapped dynamically)
  ...Object.fromEntries(
    ANDROID_BRIDGE_MCP_TOOLS.map((t) => [
      t.name,
      {
        name: t.name,
        category: 'mcp_android_bridge' as const,
        readOnly: Boolean(t.readOnly),
        serverName: 'Android Bridge MCP Server',
        description: t.description,
      },
    ]),
  ),
};
