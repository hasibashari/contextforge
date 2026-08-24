import type { FunctionDeclaration, Schema, Type } from '@google/genai';
import { OBSIDIAN_MCP_TOOLS } from '../../mcp/internal/obsidian/obsidian-tools.definition';
import { NOTION_MCP_TOOLS } from '../../mcp/remote/connectors/notion/notion-tools.definition';
import { McpToolDefinition } from '../../mcp/mcp.types';

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
    | 'internal_rag'
    | 'web_search'
    | 'automation';
  readOnly: boolean;
  serverName: string;
  description: string;
}

/**
 * Converts a standard MCP JSON Schema parameter definition into a Google GenAI SDK Schema object
 */
export function convertMcpSchemaToGenAi(
  prop: Record<string, unknown> | string,
): Schema {
  if (typeof prop === 'string') {
    const typeStr = prop.toUpperCase();
    return {
      type: (typeStr === 'BOOLEAN'
        ? 'BOOLEAN'
        : typeStr === 'OBJECT'
          ? 'OBJECT'
          : typeStr === 'ARRAY'
            ? 'ARRAY'
            : 'STRING') as unknown as Type,
    };
  }

  const pType = (prop.type as string)?.toUpperCase() || 'STRING';
  const schema: Schema = {
    type: (pType === 'BOOLEAN'
      ? 'BOOLEAN'
      : pType === 'OBJECT'
        ? 'OBJECT'
        : pType === 'ARRAY'
          ? 'ARRAY'
          : 'STRING') as unknown as Type,
    description: prop.description as string | undefined,
  };

  if (prop.items && typeof prop.items === 'object') {
    schema.items = convertMcpSchemaToGenAi(
      prop.items as Record<string, unknown>,
    );
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
];

/**
 * Unified Catalog of All Available Tools in the Reasoning Workspace
 */
export const BUILTIN_FUNCTION_DECLARATIONS: FunctionDeclaration[] = [
  ...NATIVE_AGENTIC_FUNCTION_DECLARATIONS,
  ...OBSIDIAN_MCP_TOOLS.map(convertMcpToolToGenAiDeclaration),
  ...NOTION_MCP_TOOLS.map(convertMcpToolToGenAiDeclaration),
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
};
