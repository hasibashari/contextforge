-- =====================================================================
-- ContextForge: Initial Seed Data (v2.0.0)
-- Based on 5 Pillars: Knowledge, MCP, Skills, Connections, Agents
-- =====================================================================

-- 1. Initial Knowledge Sources (Clean by default - populated dynamically by user)
-- No dummy rows inserted

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
    ('d9283f50-cb2d-4ba6-a496-e2aa21919864', 'agent-conversational', 'Conversational Agent', 'task_dispatched', 'Initialized ContextForge backend workspace and database connection.', '{"environment": "local_dev"}', 'info')
ON CONFLICT (id) DO NOTHING;

-- 5. Initial Workspace Connections (4. Connection)
INSERT INTO workspace_connections (id, name, connection_type, provider, auth_type, endpoint_url, config_encrypted, status, is_active)
VALUES
    ('conn-gemini-primary', 'Google Gemini 3.x Flash', 'llm_provider', 'google_gemini', 'api_key', 'https://generativelanguage.googleapis.com', '{"masked_key": "AIzaSy••••••••••••••••••••••••••••••••"}'::jsonb, 'active', true),
    ('conn-github-oauth', 'GitHub Engineering Workspace', 'oauth_service', 'github', 'oauth2', 'https://api.github.com', '{"scope": ["repo", "workflow"]}'::jsonb, 'active', true),
    ('conn-google-calendar', 'Google Calendar Sync', 'oauth_service', 'google_calendar', 'oauth2', 'https://www.googleapis.com/calendar/v3', '{"scope": ["calendar.events"]}'::jsonb, 'active', true),
    ('conn-postgres-prod', 'Cloud SQL PostgreSQL Instance', 'database', 'postgres', 'connection_string', 'postgresql://cloudsql/contextforge_prod', '{"ssl": true}'::jsonb, 'active', true)
ON CONFLICT (id) DO NOTHING;

-- 6. Initial Workspace Agents (5. Agent)
INSERT INTO workspace_agents (id, name, role, agent_type, permissions, description, avatar_color, model, temperature, system_prompt, capabilities, assigned_tools, assigned_skills, status, total_tasks_completed, success_rate_pct)
VALUES
    ('agent-conversational', 'Conversational Agent', 'Main Reasoning & Conversation Agent', 'orchestrator', 'read_only', 'Primary conversational brain for Q&A, technical reasoning, discussion, and coordinating specialized tasks.', 'bg-primary', 'gemini-3.6-flash', 0.2, 'You are ContextForge Conversational Agent. You handle general reasoning, conversational discussion, technical consultations, and coordinate specialized tasks with Research and Action agents.', '[{"id":"c1","name":"Conversational Reasoning","description":"Deep reasoning, Q&A, and technical architecture analysis"},{"id":"c2","name":"Task Delegation","description":"Coordinate and route research queries and document mutations"}]'::jsonb, ARRAY['web_search', 'search_knowledge_vault', 'dispatch_action_worker'], ARRAY['skill-rfc-architect', 'skill-deep-web-research'], 'idle', 142, 99.6),
    ('agent-research', 'Research Agent', 'Information Retrieval & Analysis Agent', 'researcher', 'read_only', 'Dedicated intelligence agent for live web grounding (Google Search) and semantic internal knowledge retrieval (pgvector RAG).', 'bg-[#3b6ea5]', 'gemini-3.6-flash', 0.2, 'You are Research Agent. Search, read, and analyze information from live web sources and indexed vector knowledge bases, synthesizing cited analytical answers.', '[{"id":"c3","name":"Live Web Grounding","description":"Query Google Search and synthesize verified facts with citations"},{"id":"c4","name":"Vector Semantic RAG","description":"Search internal knowledge documents and vector embeddings for technical context"}]'::jsonb, ARRAY['web_search', 'search_knowledge_vault', 'query_memory', 'obsidian_vault_reader', 'notion_search', 'notion_read_page'], ARRAY['skill-deep-web-research'], 'idle', 86, 99.4),
    ('agent-action', 'Action Agent', 'Side Agent: Document & Vault Mutator', 'execution_worker', 'sandbox_write', 'Ephemeral execution worker that creates, formats, and updates structured Markdown notes in Obsidian vaults and Notion workspaces.', 'bg-[#9fbbe0]', 'gemini-3.6-flash', 0.2, 'You are Action Agent. Execute file creation and note formatting in local Obsidian vaults and Notion workspaces.', '[{"id":"c5","name":"Obsidian Vault Writing","description":"Create and update Markdown notes with frontmatter in local Obsidian vaults"},{"id":"c6","name":"Notion & Document Sync","description":"Format and synchronize structured document pages and wiki backlinks"}]'::jsonb, ARRAY['obsidian_vault_writer', 'obsidian_create_daily_note', 'notion_create_page', 'notion_update_database'], ARRAY['skill-obsidian-vault-synthesis'], 'idle', 74, 99.5)
ON CONFLICT (id) DO NOTHING;

-- 7. Initial Workspace Skills (3. Skill)
INSERT INTO workspace_skills (id, name, description, category, icon, sop_summary, instructions, assigned_tools, enabled, is_custom)
VALUES
    ('skill-rfc-architect', 'Architecture RFC & Decision Records', 'Standard operating procedure for drafting comprehensive technical design docs (TDD) and architecture decision records (ADR).', 'engineering', 'book-open', 'Enforces strict section hierarchy: Executive Summary, System Architecture, SQL DDL Schema, API Specifications, and Rollout Strategy.', 'Follow the RFC template: 1. Executive Summary, 2. High-Level Mermaid Architecture, 3. Relational/Vector Schema, 4. REST & SSE Contract, 5. Step-by-Step Implementation.', ARRAY['read_file', 'obsidian_vault_writer'], true, false),
    ('skill-deep-web-research', 'Deep Web Synthesis & Citation Grounding', 'Structured research playbook that queries search engines, evaluates source authority, and synthesizes cited answers.', 'knowledge', 'globe', 'Formulate multi-angle search queries, extract primary domain sources, filter commercial noise, and append numbered markdown footnotes.', 'Execute web search queries, verify 2+ sources, synthesize findings, cite domain URLs.', ARRAY['web_search'], true, false),
    ('skill-obsidian-vault-synthesis', 'Obsidian Vault Note Ingestion & Linking', 'Playbook for writing bi-directionally linked Markdown files with frontmatter tags and Obsidian YAML metadata.', 'knowledge', 'book-open', 'Structures frontmatter YAML (created, tags, aliases), uses [[WikiLinks]] for cross-note referencing, and writes atomic notes.', 'Format YAML frontmatter with date and tags, write concise markdown, link related topics.', ARRAY['obsidian_vault_writer', 'obsidian_vault_reader'], true, false),
    ('skill-ast-code-patcher', 'AST-Verified Code Patching & Refactoring', 'Strict code modification playbook that checks Abstract Syntax Trees (AST) before applying file diffs.', 'engineering', 'cpu', 'Generates minimal unified diffs, runs AST parsing to prevent syntax breakage, and verifies unit test passing.', 'Inspect original code, generate atomic diff, run syntax check, format output cleanly.', ARRAY['code_editor', 'code_ast_checker', 'bash_executor'], true, false),
    ('skill-threat-model-review', 'CVE & Security Threat Model Review', 'Standard protocol for auditing authentication boundaries, SQL injection risks, and secret leakage.', 'security', 'shield', 'Applies STRIDE threat modeling methodology, checks for hardcoded tokens, and verifies SQL parameterization.', 'Audit code for unsanitized inputs, check CORS and auth boundaries, document mitigations.', ARRAY['code_ast_checker', 'read_file'], true, false),
    ('skill-calendar-workflow-sync', 'Calendar & Agenda Intelligent Dispatch', 'Procedural standard for parsing conversational meeting requests, resolving timezones, and creating calendar events.', 'productivity', 'calendar', 'Resolves relative dates (tomorrow, next Monday), validates duration against free slots, and populates attendee metadata.', 'Extract event title, date, time, and attendees, verify slot availability, create calendar event.', ARRAY['calendar_event_creator', 'calendar_schedule_reader'], true, false)
ON CONFLICT (id) DO NOTHING;

-- 8. Initial Workspace Integrations (2. MCP Connectors)
INSERT INTO workspace_integrations (id, connection_id, name, category, status, endpoint, version, transport, auth_type, auth_config, description, tools, last_ping_ms, latency_ms, is_custom)
VALUES
    ('int-obsidian-vault-mcp', NULL, 'Obsidian Vault MCP Bridge', 'mcp_server', 'connected', 'npx -y @modelcontextprotocol/server-obsidian ~/Documents/ObsidianVault', 'v2.1.0', 'stdio', 'none', '{}'::jsonb, 'Direct bi-directional Model Context Protocol bridge into local Obsidian vault files & daily notes.', '[{"id":"t-obs-1","name":"obsidian_vault_writer","description":"Append or create structured Markdown files with frontmatter inside Obsidian","readOnly":false},{"id":"t-obs-2","name":"obsidian_vault_reader","description":"Read and search note contents, backlinks, and tags across markdown files","readOnly":true}]'::jsonb, 14, 11, false),
    ('int-notion-mcp', NULL, 'Notion Workspace MCP Server', 'mcp_server', 'connected', 'https://mcp.notion.com/mcp', 'v1.2.0', 'streamable_http', 'oauth', '{"workspaceName": "ContextForge Workspace"}'::jsonb, 'Official Model Context Protocol server for Notion workspace databases, page trees, and document sync.', '[{"id":"t-notion-1","name":"notion_search","description":"Search pages and database titles across Notion workspace","readOnly":true},{"id":"t-notion-2","name":"notion_read_page","description":"Read blocks, markdown content, and page properties from Notion","readOnly":true},{"id":"t-notion-3","name":"notion_create_page","description":"Create new child pages and structured document entries in Notion","readOnly":false},{"id":"t-notion-4","name":"notion_update_database","description":"Insert records and update schema rows in Notion databases","readOnly":false}]'::jsonb, 16, 14, false)
ON CONFLICT (id) DO NOTHING;

