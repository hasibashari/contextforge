/**
 * Standard interface for MCP Connectors that support OAuth 2.0 authentication
 */

export interface McpOAuthUrlResponse {
  authUrl: string;
  configured: boolean;
  scopes?: string[];
  message?: string;
}

export interface McpOAuthExchangeResult {
  workspaceName?: string;
  email?: string;
  [key: string]: unknown;
}

export interface IMcpOAuthHandler {
  /**
   * Unique provider identifier (e.g. 'google-calendar', 'notion', 'github', 'slack')
   */
  readonly providerId: string;

  /**
   * Generates the OAuth 2.0 authorization URL
   */
  getOAuthUrl(): McpOAuthUrlResponse;

  /**
   * Exchanges an authorization code for access/refresh tokens and persists them
   */
  exchangeOAuthCode(code: string): Promise<McpOAuthExchangeResult>;

  /**
   * Verifies and connects a direct API/integration token
   */
  verifyAndConnectToken(
    token: string,
    additionalParam?: string,
  ): Promise<McpOAuthExchangeResult>;
}
