-- =====================================================================
-- ContextForge: Native PostgreSQL Schema Definition (v2.0.0)
-- Multi-environment resilient schema (Local Dev & Google Cloud SQL)
-- Based on 5 Pillars: Knowledge, MCP, Skills, Connections, Agents
-- =====================================================================

-- 1. Inisialisasi Ekstensi Wajib
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Inisialisasi pgvector jika tersedia di sistem
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'vector') THEN
        CREATE EXTENSION IF NOT EXISTS "vector";
    END IF;
END $$;

-- 2. Entitas Sesi & Pesan Percakapan
CREATE TABLE IF NOT EXISTS chat_sessions (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID,
    title VARCHAR(255) NOT NULL,
    active_artifact_id VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS artifacts (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    session_id VARCHAR(100) REFERENCES chat_sessions(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('markdown_doc', 'code_patch', 'reminder_event', 'search_synthesis', 'image_asset')),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    location_path TEXT,
    service_origin VARCHAR(50),
    diffs JSONB,
    image_url TEXT,
    image_prompt TEXT,
    word_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Foreign Key sirkular aman: Update chat_sessions ref ke artifacts
ALTER TABLE chat_sessions 
    DROP CONSTRAINT IF EXISTS fk_active_artifact,
    ADD CONSTRAINT fk_active_artifact FOREIGN KEY (active_artifact_id) REFERENCES artifacts(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS chat_messages (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    session_id VARCHAR(100) NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    intent JSONB,
    side_agent JSONB,
    action_card JSONB,
    artifact_id VARCHAR(100) REFERENCES artifacts(id) ON DELETE SET NULL,
    source_domains TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Entitas Side Agent & Task Orchestration
CREATE TABLE IF NOT EXISTS side_agent_executions (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    message_id VARCHAR(100) REFERENCES chat_messages(id) ON DELETE SET NULL,
    agent_id VARCHAR(100) NOT NULL,
    agent_name VARCHAR(150) NOT NULL,
    agent_role VARCHAR(150) NOT NULL,
    task_goal TEXT NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    target_resource TEXT NOT NULL,
    status VARCHAR(30) NOT NULL CHECK (status IN ('queued', 'running', 'completed', 'failed')),
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('low_risk', 'medium_risk', 'high_risk')),
    execution_time_ms INTEGER DEFAULT 0,
    tokens_used JSONB,
    logs TEXT[] DEFAULT '{}',
    summary TEXT NOT NULL,
    files_modified TEXT[],
    diff_preview TEXT,
    artifact_id VARCHAR(100) REFERENCES artifacts(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title VARCHAR(255) NOT NULL,
    objective TEXT NOT NULL,
    repo VARCHAR(255) DEFAULT '',
    agent_id VARCHAR(100) NOT NULL,
    status VARCHAR(30) NOT NULL CHECK (status IN ('queued', 'planning', 'running_tools', 'analyzing', 'waiting_approval', 'completed', 'failed')),
    current_stage VARCHAR(30) NOT NULL CHECK (current_stage IN ('planning', 'context_retrieval', 'tool_execution', 'validation', 'deliverable')),
    knowledge_sources TEXT[] DEFAULT '{}',
    tools_used TEXT[] DEFAULT '{}',
    deliverable JSONB,
    tokens_used JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS execution_steps (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    task_id VARCHAR(100) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    stage VARCHAR(30) NOT NULL,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(30) NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
    logs TEXT[] DEFAULT '{}',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS tool_calls (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    step_id VARCHAR(100) NOT NULL REFERENCES execution_steps(id) ON DELETE CASCADE,
    tool_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    status VARCHAR(30) NOT NULL CHECK (status IN ('running', 'success', 'error')),
    duration_ms INTEGER DEFAULT 0,
    input_params JSONB,
    output_result JSONB,
    started_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Entitas Personal Hub (Schedule & Memories)
CREATE TABLE IF NOT EXISTS calendar_events (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID,
    title VARCHAR(255) NOT NULL,
    event_date DATE NOT NULL,
    event_time VARCHAR(20) NOT NULL,
    duration VARCHAR(50) DEFAULT '30m',
    location TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'in_progress', 'completed')),
    category VARCHAR(30) NOT NULL DEFAULT 'task' CHECK (category IN ('meeting', 'task', 'review', 'personal')),
    attendees TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_memories (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID,
    category VARCHAR(50) NOT NULL CHECK (category IN ('profile', 'preference', 'project', 'workflow')),
    key VARCHAR(100) NOT NULL,
    value TEXT NOT NULL,
    embedding JSONB,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Entitas Multi-Source Knowledge (1. Knowledge)
CREATE TABLE IF NOT EXISTS knowledge_sources (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID,
    type VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    location TEXT NOT NULL,
    meta TEXT,
    files_count INTEGER DEFAULT 0,
    chunks_count INTEGER DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'synced' CHECK (status IN ('synced', 'syncing', 'error')),
    icon_type VARCHAR(50) DEFAULT 'file',
    color VARCHAR(50) DEFAULT 'text-primary',
    last_synced TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS knowledge_chunks (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    source_id VARCHAR(100) NOT NULL REFERENCES knowledge_sources(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    chunk_content TEXT NOT NULL,
    embedding JSONB,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Entitas Activity Telemetry & Audit Logs
CREATE TABLE IF NOT EXISTS activity_logs (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    task_id VARCHAR(100),
    task_title VARCHAR(255),
    agent_id VARCHAR(100) NOT NULL,
    agent_name VARCHAR(150) NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    summary TEXT NOT NULL,
    details JSONB,
    status VARCHAR(20) NOT NULL DEFAULT 'info' CHECK (status IN ('info', 'success', 'warning', 'error'))
);

-- 7. Entitas Connections & Credential Vault (4. Connection)
CREATE TABLE IF NOT EXISTS workspace_connections (
    id VARCHAR(100) PRIMARY KEY,
    user_id UUID,
    name VARCHAR(150) NOT NULL,
    connection_type VARCHAR(50) NOT NULL CHECK (connection_type IN ('llm_provider', 'mcp_server', 'database', 'oauth_service')),
    provider VARCHAR(50) NOT NULL,
    auth_type VARCHAR(50) NOT NULL CHECK (auth_type IN ('api_key', 'oauth2', 'connection_string', 'bearer_token', 'none')),
    endpoint_url TEXT,
    config_encrypted JSONB DEFAULT '{}',
    status VARCHAR(30) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invalid', 'testing', 'disabled')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Entitas Workspace Agents (5. Agent)
CREATE TABLE IF NOT EXISTS workspace_agents (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    role VARCHAR(150) NOT NULL,
    agent_type VARCHAR(50) NOT NULL CHECK (agent_type IN ('orchestrator', 'execution_worker', 'planner')),
    permissions VARCHAR(50) NOT NULL CHECK (permissions IN ('read_only', 'sandbox_write', 'full_system')),
    description TEXT NOT NULL,
    avatar_color VARCHAR(50) DEFAULT 'bg-primary',
    model VARCHAR(100) DEFAULT 'gemini-3.6-flash',
    temperature NUMERIC(3,2) DEFAULT 0.2,
    system_prompt TEXT NOT NULL,
    capabilities JSONB DEFAULT '[]',
    assigned_tools TEXT[] DEFAULT '{}',
    assigned_skills TEXT[] DEFAULT '{}',
    status VARCHAR(30) DEFAULT 'idle' CHECK (status IN ('idle', 'busy', 'waiting_approval', 'offline')),
    total_tasks_completed INTEGER DEFAULT 0,
    success_rate_pct NUMERIC(5,2) DEFAULT 100.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Entitas Workspace Skills (3. Skill)
CREATE TABLE IF NOT EXISTS workspace_skills (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('architecture', 'engineering', 'security', 'knowledge', 'productivity', 'database', 'qa_testing')),
    icon VARCHAR(50) DEFAULT 'sparkles',
    sop_summary TEXT NOT NULL,
    instructions TEXT NOT NULL,
    assigned_tools TEXT[] DEFAULT '{}',
    enabled BOOLEAN DEFAULT true,
    is_custom BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Entitas Workspace Integrations (2. MCP Server)
CREATE TABLE IF NOT EXISTS workspace_integrations (
    id VARCHAR(100) PRIMARY KEY,
    connection_id VARCHAR(100) REFERENCES workspace_connections(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(50) DEFAULT 'mcp_server',
    status VARCHAR(30) DEFAULT 'connected' CHECK (status IN ('connected', 'disconnected', 'error')),
    endpoint TEXT NOT NULL,
    version VARCHAR(50) DEFAULT 'v1.0.0',
    transport VARCHAR(30) DEFAULT 'stdio' CHECK (transport IN ('stdio', 'streamable_http', 'sse', 'rest')),
    auth_type VARCHAR(30) DEFAULT 'none' CHECK (auth_type IN ('none', 'bearer', 'oauth', 'api_key')),
    auth_config JSONB DEFAULT '{}',
    description TEXT NOT NULL,
    tools JSONB DEFAULT '[]',
    last_ping_ms INTEGER DEFAULT 12,
    latency_ms INTEGER DEFAULT 12,
    is_custom BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Entitas Autonomous Workflows & Trigger Scheduler
CREATE TABLE IF NOT EXISTS automations (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    agent_id VARCHAR(100) NOT NULL,
    agent_name VARCHAR(150),
    mcp_server_id VARCHAR(100),
    mcp_tools TEXT[] DEFAULT '{}',
    trigger_type VARCHAR(50) NOT NULL CHECK (trigger_type IN ('schedule', 'event', 'manual')),
    schedule_cron VARCHAR(100),
    schedule_label VARCHAR(150),
    event_source VARCHAR(100),
    prompt_template TEXT NOT NULL,
    guardrail_strict_hitl BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    last_run_at TIMESTAMPTZ,
    last_run_status VARCHAR(30) DEFAULT 'idle' CHECK (last_run_status IN ('idle', 'running', 'success', 'failed')),
    total_runs INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS automation_runs (
    id VARCHAR(100) PRIMARY KEY,
    workflow_id VARCHAR(100) REFERENCES automations(id) ON DELETE CASCADE,
    workflow_name VARCHAR(255) NOT NULL,
    agent_id VARCHAR(100) NOT NULL,
    agent_name VARCHAR(150) NOT NULL,
    trigger_source VARCHAR(150) NOT NULL,
    status VARCHAR(30) NOT NULL CHECK (status IN ('idle', 'running', 'success', 'failed')),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER DEFAULT 0,
    tokens_used JSONB DEFAULT '{}',
    steps JSONB DEFAULT '[]',
    output_summary TEXT NOT NULL,
    output_artifact_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- 12. Performance Indexing
-- =====================================================================

CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_artifacts_session ON artifacts(session_id);
CREATE INDEX IF NOT EXISTS idx_execution_steps_task ON execution_steps(task_id);
CREATE INDEX IF NOT EXISTS idx_tool_calls_step ON tool_calls(step_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON calendar_events(event_date, status);
CREATE INDEX IF NOT EXISTS idx_activity_logs_time ON activity_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_source ON knowledge_chunks(source_id);
CREATE INDEX IF NOT EXISTS idx_workspace_connections_provider ON workspace_connections(provider, is_active);
CREATE INDEX IF NOT EXISTS idx_workspace_skills_category ON workspace_skills(category, enabled);
CREATE INDEX IF NOT EXISTS idx_workspace_integrations_status ON workspace_integrations(status);
CREATE INDEX IF NOT EXISTS idx_automations_active ON automations(is_active, trigger_type);
CREATE INDEX IF NOT EXISTS idx_automation_runs_workflow ON automation_runs(workflow_id, started_at DESC);
