import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// Seed JSON data
import knowledgeSeed from '../../../database/seeds/knowledge_sources.json';
import calendarSeed from '../../../database/seeds/calendar_events.json';
import memoriesSeed from '../../../database/seeds/user_memories.json';
import activitySeed from '../../../database/seeds/activity_logs.json';
import connectionsSeed from '../../../database/seeds/workspace_connections.json';
import agentsSeed from '../../../database/seeds/agents.json';
import skillsSeed from '../../../database/seeds/skills.json';
import integrationsSeed from '../../../database/seeds/integrations.json';

async function runSeed() {
  console.log('🌱 Starting ContextForge Native Database Seeder...');

  const connectionString =
    process.env.DATABASE_URL ||
    'postgresql://dev_user:admin@localhost:5432/context_db?schema=public';

  const pool = new Pool({ connectionString });

  try {
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL database');

    // 1. Execute schema.sql if exists
    const schemaPath = path.resolve(__dirname, '../../../database/schema.sql');
    if (fs.existsSync(schemaPath)) {
      console.log('📜 Applying database schema (schema.sql)...');
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await client.query(schemaSql);
    }

    // Drop any legacy check constraints on existing tables and ensure new columns
    await client.query(`
      ALTER TABLE IF EXISTS workspace_agents DROP CONSTRAINT IF EXISTS workspace_agents_status_check;
      ALTER TABLE IF EXISTS workspace_agents DROP CONSTRAINT IF EXISTS workspace_agents_agent_type_check;
      ALTER TABLE IF EXISTS workspace_agents DROP CONSTRAINT IF EXISTS workspace_agents_permissions_check;
      ALTER TABLE IF EXISTS workspace_integrations DROP CONSTRAINT IF EXISTS workspace_integrations_category_check;
      ALTER TABLE IF EXISTS workspace_integrations DROP CONSTRAINT IF EXISTS workspace_integrations_transport_check;
      ALTER TABLE IF EXISTS workspace_integrations DROP CONSTRAINT IF EXISTS workspace_integrations_auth_type_check;
      ALTER TABLE IF EXISTS workspace_integrations DROP CONSTRAINT IF EXISTS workspace_integrations_status_check;
      ALTER TABLE IF EXISTS workspace_integrations ADD COLUMN IF NOT EXISTS auth_type VARCHAR(30) DEFAULT 'none';
      ALTER TABLE IF EXISTS workspace_integrations ADD COLUMN IF NOT EXISTS auth_config JSONB DEFAULT '{}';
    `);

    // 2. Seed Knowledge Sources (Clean - populated by real user documents/vaults)
    console.log('📚 Seeding Knowledge Sources...');
    await client.query(`
      DELETE FROM knowledge_sources WHERE id IN (
        'c5881477-8df2-4217-a068-d069a319f390',
        '50b297b8-2bfa-4c6e-8260-26463eb4c7e8',
        '36bcbb30-4e31-419b-a36c-9418a096c4be'
      );
    `);
    const knowledgeList = knowledgeSeed as Array<{
      id: string;
      type: string;
      name: string;
      description: string;
      location: string;
      meta: string;
      filesCount: number;
      chunksCount: number;
      status: string;
      iconType: string;
      color: string;
    }>;
    for (const item of knowledgeList) {
      await client.query(
        `INSERT INTO knowledge_sources (
          id, type, name, description, location, meta, files_count, chunks_count, status, icon_type, color
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          location = EXCLUDED.location,
          meta = EXCLUDED.meta,
          files_count = EXCLUDED.files_count,
          chunks_count = EXCLUDED.chunks_count,
          status = EXCLUDED.status;`,
        [
          item.id,
          item.type,
          item.name,
          item.description,
          item.location,
          item.meta,
          item.filesCount,
          item.chunksCount,
          item.status,
          item.iconType,
          item.color,
        ],
      );
    }
    console.log(`   ✓ Seeded ${knowledgeList.length} knowledge sources`);

    // 3. Seed Calendar Events
    console.log('📅 Seeding Calendar Events...');
    for (const item of calendarSeed) {
      const dateVal =
        item.eventDate === 'CURRENT_DATE + 1'
          ? new Date(Date.now() + 86400000).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0];

      await client.query(
        `INSERT INTO calendar_events (
          id, title, event_date, event_time, duration, location, status, category, attendees
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          event_time = EXCLUDED.event_time,
          duration = EXCLUDED.duration,
          location = EXCLUDED.location,
          status = EXCLUDED.status;`,
        [
          item.id,
          item.title,
          dateVal,
          item.eventTime,
          item.duration,
          item.location,
          item.status,
          item.category,
          item.attendees,
        ],
      );
    }
    console.log(`   ✓ Seeded ${calendarSeed.length} calendar events`);

    // 4. Seed User Memories
    console.log('🧠 Seeding User Memories...');
    for (const item of memoriesSeed) {
      await client.query(
        `INSERT INTO user_memories (id, category, key, value)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO UPDATE SET
          category = EXCLUDED.category,
          key = EXCLUDED.key,
          value = EXCLUDED.value;`,
        [item.id, item.category, item.key, item.value],
      );
    }
    console.log(`   ✓ Seeded ${memoriesSeed.length} user memories`);

    // 5. Seed Activity Logs
    console.log('📝 Seeding Activity Logs...');
    for (const item of activitySeed) {
      await client.query(
        `INSERT INTO activity_logs (
          id, agent_id, agent_name, action_type, summary, details, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO NOTHING;`,
        [
          item.id,
          item.agentId,
          item.agentName,
          item.actionType,
          item.summary,
          JSON.stringify(item.details),
          item.status,
        ],
      );
    }
    console.log(`   ✓ Seeded ${activitySeed.length} activity logs`);

    // 6. Seed Workspace Connections
    console.log('🔌 Seeding Workspace Connections...');
    for (const item of connectionsSeed) {
      await client.query(
        `INSERT INTO workspace_connections (
          id, name, connection_type, provider, auth_type, endpoint_url, config_encrypted, status, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          connection_type = EXCLUDED.connection_type,
          provider = EXCLUDED.provider,
          auth_type = EXCLUDED.auth_type,
          endpoint_url = EXCLUDED.endpoint_url,
          status = EXCLUDED.status,
          is_active = EXCLUDED.is_active;`,
        [
          item.id,
          item.name,
          item.connectionType,
          item.provider,
          item.authType,
          item.endpointUrl,
          JSON.stringify(item.configEncrypted),
          item.status,
          item.isActive,
        ],
      );
    }
    console.log(`   ✓ Seeded ${connectionsSeed.length} workspace connections`);

    // 7. Seed Workspace Agents
    console.log('🤖 Seeding Workspace Agents...');
    for (const agent of agentsSeed) {
      await client.query(
        `INSERT INTO workspace_agents (
          id, name, role, agent_type, permissions, description, avatar_color, model, temperature, system_prompt, capabilities, assigned_tools, assigned_skills, status, total_tasks_completed, success_rate_pct
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          role = EXCLUDED.role,
          agent_type = EXCLUDED.agent_type,
          permissions = EXCLUDED.permissions,
          description = EXCLUDED.description,
          avatar_color = EXCLUDED.avatar_color,
          model = EXCLUDED.model,
          temperature = EXCLUDED.temperature,
          system_prompt = EXCLUDED.system_prompt,
          capabilities = EXCLUDED.capabilities,
          assigned_tools = EXCLUDED.assigned_tools,
          assigned_skills = EXCLUDED.assigned_skills,
          status = EXCLUDED.status,
          total_tasks_completed = EXCLUDED.total_tasks_completed,
          success_rate_pct = EXCLUDED.success_rate_pct;`,
        [
          agent.id,
          agent.name,
          agent.role,
          agent.agentType,
          agent.permissions,
          agent.description,
          agent.avatarColor,
          agent.model,
          agent.temperature,
          agent.systemPrompt,
          JSON.stringify(agent.capabilities),
          agent.assignedTools,
          agent.assignedSkills,
          agent.status,
          agent.totalTasksCompleted,
          agent.successRatePct,
        ],
      );
    }
    console.log(`   ✓ Seeded ${agentsSeed.length} workspace agents`);

    // 8. Seed Workspace Skills
    console.log('✨ Seeding Workspace Skills...');
    for (const skill of skillsSeed) {
      await client.query(
        `INSERT INTO workspace_skills (
          id, name, description, category, icon, sop_summary, instructions, assigned_tools, enabled, is_custom
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          category = EXCLUDED.category,
          icon = EXCLUDED.icon,
          sop_summary = EXCLUDED.sop_summary,
          instructions = EXCLUDED.instructions,
          assigned_tools = EXCLUDED.assigned_tools,
          enabled = EXCLUDED.enabled;`,
        [
          skill.id,
          skill.name,
          skill.description,
          skill.category,
          skill.icon,
          skill.sopSummary,
          skill.instructions,
          skill.assignedTools,
          skill.enabled,
          skill.isCustom,
        ],
      );
    }
    console.log(`   ✓ Seeded ${skillsSeed.length} workspace skills`);

    // 9. Seed Workspace Integrations (MCP Connectors)
    console.log('⚡ Seeding Workspace Integrations (MCP Connectors)...');
    for (const intg of integrationsSeed) {
      await client.query(
        `INSERT INTO workspace_integrations (
          id, name, category, status, endpoint, version, transport, auth_type, auth_config, description, tools, last_ping_ms, latency_ms, is_custom
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          category = EXCLUDED.category,
          status = EXCLUDED.status,
          endpoint = EXCLUDED.endpoint,
          version = EXCLUDED.version,
          transport = EXCLUDED.transport,
          auth_type = EXCLUDED.auth_type,
          auth_config = EXCLUDED.auth_config,
          description = EXCLUDED.description,
          tools = EXCLUDED.tools,
          last_ping_ms = EXCLUDED.last_ping_ms,
          latency_ms = EXCLUDED.latency_ms;`,
        [
          intg.id,
          intg.name,
          intg.category,
          intg.status,
          intg.endpoint,
          intg.version,
          intg.transport,
          intg.auth_type,
          JSON.stringify(intg.auth_config || {}),
          intg.description,
          JSON.stringify(intg.tools || []),
          intg.last_ping_ms,
          intg.latency_ms,
          false,
        ],
      );
    }
    const intgCheck = await client.query(
      'SELECT id, name, status FROM workspace_integrations;',
    );
    console.log(
      '   📋 PostgreSQL workspace_integrations rows:',
      intgCheck.rows,
    );

    client.release();
    console.log('🎉 Database seeding completed successfully!');
  } catch (err: unknown) {
    console.error('❌ Database seeding failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

void runSeed();
