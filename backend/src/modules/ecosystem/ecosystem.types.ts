export type {
  WorkspaceAgentRow,
  WorkspaceSkillRow,
  WorkspaceIntegrationRow,
} from './ecosystem.repository';

export interface McpDiscoveredTool {
  id?: string;
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
  parametersSchema?: Record<string, unknown>;
  readOnly?: boolean;
}

export interface CreateSkillDto {
  name: string;
  description: string;
  category:
    | 'architecture'
    | 'qa_testing'
    | 'security'
    | 'knowledge'
    | 'database'
    | 'productivity';
  sopSummary: string;
  instructions: string;
  assignedTools: string[];
  icon?: string;
}

export interface CreateIntegrationDto {
  name: string;
  category?: string;
  endpoint: string;
  description: string;
  transport?: 'stdio' | 'streamable_http' | 'sse' | 'rest';
  authType?: 'none' | 'bearer' | 'oauth' | 'api_key';
  authConfig?: {
    token?: string;
    apiKey?: string;
    workspaceName?: string;
    workspaceId?: string;
    workspaceIcon?: string;
    botId?: string;
    vaultName?: string;
    vaultPath?: string;
    headers?: Record<string, string>;
    env?: Record<string, string>;
  };
  tools?: any[];
}
