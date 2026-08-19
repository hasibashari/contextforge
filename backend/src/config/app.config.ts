import { registerAs } from '@nestjs/config';
import * as path from 'path';

export const appConfig = registerAs('app', () => ({
  port: parseInt(process.env.PORT || '3001', 10),
  environment: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  obsidianVaultPath:
    process.env.OBSIDIAN_VAULT_PATH || path.resolve(process.cwd(), 'vault'),
  workspaceSandboxPath:
    process.env.WORKSPACE_SANDBOX_PATH ||
    path.resolve(process.cwd(), 'workspace_sandbox'),
}));
