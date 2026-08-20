import type {
  WorkspaceConnection,
} from '@/shared/types/workspace'
import {
  PRESET_AGENTS,
  PRESET_SKILLS,
  PRESET_INTEGRATIONS,
} from '../data/presets'

// =============================================================
// CATALOG REGISTRY PRESETS (Loaded from JSON seeds)
// =============================================================

export const INITIAL_AGENTS = PRESET_AGENTS
export const INITIAL_INTEGRATIONS = PRESET_INTEGRATIONS
export const INITIAL_SKILLS = PRESET_SKILLS

export const INITIAL_CONNECTIONS: WorkspaceConnection[] = [
  {
    id: 'conn-gemini-primary',
    name: 'Google Gemini 3.x Flash',
    connectionType: 'llm_provider',
    provider: 'google_gemini',
    authType: 'api_key',
    endpointUrl: 'https://generativelanguage.googleapis.com',
    configEncrypted: { maskedKey: 'AIzaSy••••••••••••••••••••••••••••••••' },
    status: 'active',
    isActive: true,
    createdAt: '2026-08-20T00:00:00.000Z',
  },
  {
    id: 'conn-github-oauth',
    name: 'GitHub Engineering Workspace',
    connectionType: 'oauth_service',
    provider: 'github',
    authType: 'oauth2',
    endpointUrl: 'https://api.github.com',
    configEncrypted: { scope: ['repo', 'workflow'] },
    status: 'active',
    isActive: true,
    createdAt: '2026-08-20T00:00:00.000Z',
  },
  {
    id: 'conn-google-calendar',
    name: 'Google Calendar Sync',
    connectionType: 'oauth_service',
    provider: 'google_calendar',
    authType: 'oauth2',
    endpointUrl: 'https://www.googleapis.com/calendar/v3',
    configEncrypted: { scope: ['calendar.events'] },
    status: 'active',
    isActive: true,
    createdAt: '2026-08-20T00:00:00.000Z',
  },
  {
    id: 'conn-postgres-prod',
    name: 'Cloud SQL PostgreSQL Instance',
    connectionType: 'database',
    provider: 'postgres',
    authType: 'connection_string',
    endpointUrl: 'postgresql://cloudsql/contextforge_prod',
    configEncrypted: { ssl: true },
    status: 'active',
    isActive: true,
    createdAt: '2026-08-20T00:00:00.000Z',
  },
]
