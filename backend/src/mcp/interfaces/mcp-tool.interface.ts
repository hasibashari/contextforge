/**
 * Schema definition for an individual MCP Tool
 */
export interface McpToolParameterSchema {
  type: string;
  description?: string;
  properties?: Record<
    string,
    {
      type: string;
      description?: string;
      enum?: string[];
      items?: Record<string, unknown>;
    }
  >;
  required?: string[];
}

export interface McpToolDefinition {
  id?: string;
  name: string;
  description: string;
  parametersSchema?: Record<string, unknown> | McpToolParameterSchema;
  readOnly?: boolean;
}

export interface McpToolCallResult {
  success: boolean;
  server: string;
  toolName: string;
  data: Record<string, unknown> | Array<Record<string, unknown>> | string;
  summary: string;
  filesModified?: string[];
}
