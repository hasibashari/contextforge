-- =====================================================================
-- ContextForge: Initial Seed Data
-- =====================================================================

-- 1. Initial Knowledge Sources
INSERT INTO knowledge_sources (id, type, name, description, location, meta, files_count, chunks_count, status, icon_type, color)
VALUES
    ('c5881477-8df2-4217-a068-d069a319f390', 'obsidian_vault', 'Engineering HQ Vault', 'Team architecture decision records, RFC drafts, and system guidelines', 'obsidian://vault/Engineering-HQ', 'Markdown · 142 notes', 142, 580, 'synced', 'book-open', 'text-[#9fbbe0]'),
    ('50b297b8-2bfa-4c6e-8260-26463eb4c7e8', 'github_repo', 'contextforge-core', 'Core orchestrator and worker execution engine repository', 'github.com/contextforge/core', 'TypeScript · main branch', 86, 320, 'synced', 'terminal', 'text-[#c0a8dd]'),
    ('36bcbb30-4e31-419b-a36c-9418a096c4be', 'database_schema', 'Cloud SQL PostgreSQL', 'Production relational schema and telemetry data catalog', 'postgresql://cloudsql/contextforge_prod', 'PostgreSQL 16 · 14 tables', 14, 45, 'synced', 'database', 'text-[#9fc9a2]')
ON CONFLICT (id) DO NOTHING;

-- 2. Initial Calendar Events
INSERT INTO calendar_events (id, title, event_date, event_time, duration, location, status, category, attendees)
VALUES
    ('83c07248-2834-4554-ba79-11c778401314', 'ContextForge Architecture Sync', CURRENT_DATE, '10:00 AM', '45m', 'Google Meet', 'upcoming', 'meeting', ARRAY['Sarah (Architect)', 'Dev Team']),
    ('26d4ca91-d309-482a-a92c-5ae713374828', 'Review Security & CVE Threat Model', CURRENT_DATE, '02:00 PM', '30m', 'Engineering Room A', 'upcoming', 'review', ARRAY['Security Lead']),
    ('fa7bc652-e9c5-4ca2-8a9d-b63118cf1859', 'Ship Agentic Dual-Privilege RFC', CURRENT_DATE + 1, '09:00 AM', '1h', 'Obsidian Vault', 'upcoming', 'task', ARRAY['Self'])
ON CONFLICT (id) DO NOTHING;

-- 3. Initial User Memories
INSERT INTO user_memories (id, category, key, value)
VALUES
    ('e287a329-873b-4813-9aa6-ffda2a7cc3f6', 'profile', 'primary_role', 'Lead Fullstack & AI Systems Architect specializing in TypeScript, NestJS, and Gemini models.'),
    ('4b90e960-93a8-48b4-93f8-8ae92be162ea', 'preference', 'code_style', 'Prefers Clean Modular Architecture, Zero ORM overhead with Native SQL, Strict TypeScript typing, and warm-editorial UI design.'),
    ('a39a2d04-18ef-4933-9799-d419b5bfb4f9', 'project', 'current_mission', 'Building ContextForge - AI-First Conversational Workspace & Agentic Control Plane.')
ON CONFLICT (id) DO NOTHING;

-- 4. Initial Activity Logs
INSERT INTO activity_logs (id, agent_id, agent_name, action_type, summary, details, status)
VALUES
    ('d9283f50-cb2d-4ba6-a496-e2aa21919864', 'agent-sec-docs', 'Core Orchestrator', 'task_dispatched', 'Initialized ContextForge backend workspace and database connection.', '{"environment": "local_dev"}', 'info')
ON CONFLICT (id) DO NOTHING;
