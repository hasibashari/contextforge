-- =====================================================================
-- ContextForge: Initial Seed Data (v2.0.0)
-- Based on 4 Core Pillars: Knowledge, MCP, Skills, Agents
-- =====================================================================

-- 1. Initial Knowledge Sources (Clean by default - populated dynamically by user)
-- No dummy rows inserted

-- 2. Initial User Memories
INSERT INTO user_memories (id, category, key, value)
VALUES
    ('e287a329-873b-4813-9aa6-ffda2a7cc3f6', 'profile', 'primary_role', 'Lead Fullstack & AI Systems Architect specializing in TypeScript, NestJS, and Gemini models.'),
    ('4b90e960-93a8-48b4-93f8-8ae92be162ea', 'preference', 'code_style', 'Prefers Clean Modular Architecture, Zero ORM overhead with Native SQL, Strict TypeScript typing, and warm-editorial UI design.'),
    ('a39a2d04-18ef-4933-9799-d419b5bfb4f9', 'project', 'current_mission', 'Building ContextForge - AI-First Conversational Workspace & Agentic Control Plane.')
ON CONFLICT (id) DO NOTHING;

-- 3. Initial Activity Logs
INSERT INTO activity_logs (id, agent_id, agent_name, action_type, summary, details, status)
VALUES
    ('d9283f50-cb2d-4ba6-a496-e2aa21919864', 'agent-conversational', 'Personal Assistant Agent', 'task_dispatched', 'Initialized ContextForge backend workspace and database connection.', '{"environment": "local_dev"}', 'info')
ON CONFLICT (id) DO NOTHING;

-- 4. Initial Workspace Agents
INSERT INTO workspace_agents (id, name, role, agent_type, permissions, description, avatar_color, model, temperature, system_prompt, capabilities, assigned_tools, assigned_skills, status, total_tasks_completed, success_rate_pct)
VALUES
    ('agent-conversational', 'Personal Assistant Agent', 'Primary Personal Assistant & Master Orchestrator', 'orchestrator', 'sandbox_write', 'Primary host agent responsible for understanding user goals, multi-turn reasoning, memory recall, and coordinating direct MCP tool executions and research sub-agents.', 'bg-primary', 'gemini-3.5-flash', 0.2, 'You are ContextForge Personal Assistant Agent. You are the central reasoning brain and orchestrator. You handle natural dialogue, strategic planning, direct MCP tool execution, and delegate deep literature investigation to the Research Specialist Agent.', '[{"id":"c1","name":"Goal Understanding & Intent Analysis","description":"Comprehend user goals, context, and complex intent via multi-turn reasoning"},{"id":"c2","name":"Strategic Planning & Decomposition","description":"Decompose user objectives into structured execution plans and milestone steps"},{"id":"c3","name":"Direct MCP Tool & Sub-Agent Orchestration","description":"Coordinate tools directly and delegate specialized deep literature analysis to the Research Agent"}]'::jsonb, ARRAY['web_search', 'search_knowledge_vault', 'obsidian_write_note', 'obsidian_read_note', 'obsidian_create_daily_note', 'notion_get_tasks', 'notion_search', 'notion_create_page', 'create_scheduled_automation', 'transfer_to_agent'], ARRAY['skill-rfc-architect'], 'idle', 142, 99.6),
    ('agent-research', 'Research Specialist Agent', 'Information Retrieval & Grounding Intelligence', 'researcher', 'read_only', 'Dedicated intelligence sub-agent for live web research grounding, source verification, and internal semantic vector retrieval (pgvector RAG).', 'bg-[#3b6ea5]', 'gemini-3.5-flash', 0.2, 'You are Research Specialist Agent in ContextForge AI Workspace. Search, read, and analyze information from live web sources and indexed vector knowledge bases, synthesizing cited analytical answers.', '[{"id":"c4","name":"Live Web Grounding & Citations","description":"Query Google Search, verify source authority, and synthesize cited findings"},{"id":"c5","name":"Internal Semantic Vector RAG","description":"Search indexed knowledge vault and vector embeddings for technical context"},{"id":"c6","name":"Cross-Source Information Synthesis","description":"Cross-reference data across web, documents, and memory into cohesive reports"}]'::jsonb, ARRAY['web_search', 'search_knowledge_vault', 'obsidian_read_note', 'notion_search', 'transfer_to_agent'], ARRAY['skill-deep-web-research'], 'idle', 86, 99.4)
ON CONFLICT (id) DO NOTHING;

-- 5. Initial Workspace Skills
INSERT INTO workspace_skills (id, name, description, category, icon, sop_summary, instructions, assigned_tools, enabled, is_custom)
VALUES
    ('skill-rfc-architect', 'Architecture RFC & Decision Records', 'Standard operating procedure for drafting comprehensive technical design docs (TDD) and architecture decision records (ADR).', 'engineering', 'book-open', 'Enforces strict section hierarchy: Executive Summary, System Architecture, SQL DDL Schema, API Specifications, and Rollout Strategy.', 'Follow the RFC template: 1. Executive Summary, 2. High-Level Mermaid Architecture, 3. Relational/Vector Schema, 4. REST & SSE Contract, 5. Step-by-Step Implementation.', ARRAY['read_file', 'obsidian_vault_writer'], true, false),
    ('skill-deep-web-research', 'Deep Web Synthesis & Citation Grounding', 'Structured research playbook that queries search engines, evaluates source authority, and synthesizes cited answers.', 'knowledge', 'globe', 'Formulate multi-angle search queries, extract primary domain sources, filter commercial noise, and append numbered markdown footnotes.', 'Execute web search queries, verify 2+ sources, synthesize findings, cite domain URLs.', ARRAY['web_search'], true, false),
    ('skill-obsidian-vault-synthesis', 'Obsidian Vault Note Ingestion & Linking', 'Playbook for writing bi-directionally linked Markdown files with frontmatter tags and Obsidian YAML metadata.', 'knowledge', 'book-open', 'Structures frontmatter YAML (created, tags, aliases), uses [[WikiLinks]] for cross-note referencing, and writes atomic notes.', 'Format YAML frontmatter with date and tags, write concise markdown, link related topics.', ARRAY['obsidian_vault_writer', 'obsidian_vault_reader'], true, false),
    ('skill-ast-code-patcher', 'AST-Verified Code Patching & Refactoring', 'Strict code modification playbook that checks Abstract Syntax Trees (AST) before applying file diffs.', 'engineering', 'cpu', 'Generates minimal unified diffs, runs AST parsing to prevent syntax breakage, and verifies unit test passing.', 'Inspect original code, generate atomic diff, run syntax check, format output cleanly.', ARRAY['code_editor', 'code_ast_checker', 'bash_executor'], true, false),
    ('skill-threat-model-review', 'CVE & Security Threat Model Review', 'Standard protocol for auditing authentication boundaries, SQL injection risks, and secret leakage.', 'security', 'shield', 'Applies STRIDE threat modeling methodology, checks for hardcoded tokens, and verifies SQL parameterization.', 'Audit code for unsanitized inputs, check CORS and auth boundaries, document mitigations.', ARRAY['code_ast_checker', 'read_file'], true, false)
ON CONFLICT (id) DO NOTHING;

-- 6. Initial Workspace Integrations (MCP Connectors)
INSERT INTO workspace_integrations (id, name, category, status, endpoint, version, transport, auth_type, auth_config, description, tools, last_ping_ms, latency_ms, is_custom)
VALUES
    ('int-obsidian-vault-mcp', 'Obsidian Vault MCP Bridge', 'mcp_server', 'connected', 'npx -y @modelcontextprotocol/server-obsidian ~/Documents/ObsidianVault', 'v2.1.0', 'stdio', 'none', '{}'::jsonb, 'Direct bi-directional Model Context Protocol bridge into local Obsidian vault files & daily notes.', '[{"id":"t-obs-1","name":"obsidian_write_note","description":"Append or create structured Markdown files with frontmatter inside Obsidian","readOnly":false},{"id":"t-obs-2","name":"obsidian_read_note","description":"Read and search note contents, backlinks, and tags across markdown files","readOnly":true},{"id":"t-obs-3","name":"obsidian_create_daily_note","description":"Create or append today daily scratchpad note","readOnly":false}]'::jsonb, 14, 11, false),
    ('int-notion-mcp', 'Notion Workspace MCP Server', 'mcp_server', 'connected', 'https://mcp.notion.com/mcp', 'v1.2.0', 'streamable_http', 'oauth', '{"workspaceName": "ContextForge Workspace"}'::jsonb, 'Official Model Context Protocol server for Notion workspace databases, page trees, and document sync.', '[{"id":"t-notion-1","name":"notion_search","description":"Search pages and database titles across Notion workspace","readOnly":true},{"id":"t-notion-2","name":"notion_get_tasks","description":"Retrieve active task boards and database items from Notion","readOnly":true},{"id":"t-notion-3","name":"notion_create_page","description":"Create new child pages and structured document entries in Notion","readOnly":false}]'::jsonb, 16, 14, false)
ON CONFLICT (id) DO NOTHING;
