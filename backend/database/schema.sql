-- =====================================================================
-- ContextForge: Native PostgreSQL Schema Definition
-- Multi-environment resilient schema (Local Dev & Google Cloud SQL)
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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    title VARCHAR(255) NOT NULL,
    active_artifact_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS artifacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES chat_sessions(id) ON DELETE SET NULL,
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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    intent JSONB,
    side_agent JSONB,
    action_card JSONB,
    artifact_id UUID REFERENCES artifacts(id) ON DELETE SET NULL,
    source_domains TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Entitas Side Agent & Task Orchestration
CREATE TABLE IF NOT EXISTS side_agent_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL,
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
    artifact_id UUID REFERENCES artifacts(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    stage VARCHAR(30) NOT NULL,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(30) NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
    logs TEXT[] DEFAULT '{}',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS tool_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    step_id UUID NOT NULL REFERENCES execution_steps(id) ON DELETE CASCADE,
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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    category VARCHAR(50) NOT NULL CHECK (category IN ('profile', 'preference', 'project', 'workflow')),
    key VARCHAR(100) NOT NULL,
    value TEXT NOT NULL,
    embedding JSONB,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Entitas Multi-Source Knowledge
CREATE TABLE IF NOT EXISTS knowledge_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    last_synced TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS knowledge_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL REFERENCES knowledge_sources(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    chunk_content TEXT NOT NULL,
    embedding JSONB,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Entitas Activity Telemetry & Audit Logs
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    task_id UUID,
    task_title VARCHAR(255),
    agent_id VARCHAR(100) NOT NULL,
    agent_name VARCHAR(150) NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    summary TEXT NOT NULL,
    details JSONB,
    status VARCHAR(20) NOT NULL DEFAULT 'info' CHECK (status IN ('info', 'success', 'warning', 'error'))
);

-- =====================================================================
-- 7. Performance Indexing
-- =====================================================================

CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_artifacts_session ON artifacts(session_id);
CREATE INDEX IF NOT EXISTS idx_execution_steps_task ON execution_steps(task_id);
CREATE INDEX IF NOT EXISTS idx_tool_calls_step ON tool_calls(step_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON calendar_events(event_date, status);
CREATE INDEX IF NOT EXISTS idx_activity_logs_time ON activity_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_source ON knowledge_chunks(source_id);
