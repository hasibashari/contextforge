import type {
  Agent,
  Skill,
  Plugin,
  Integration,
} from '@/shared/types/workspace'

// =============================================================
// CATALOG REGISTRY TEMPLATES
// Pre-configured system agents, reasoning skills, plugins, and MCP connectors.
// =============================================================

export const INITIAL_AGENTS: Agent[] = [
  {
    id: 'agent-sec-docs',
    name: 'ContextForge Core Orchestrator',
    role: 'Main Reasoning & Analysis Agent',
    agentType: 'orchestrator',
    permissions: 'read_only',
    description:
      'Primary conversational brain for Q&A, live web research, memory retrieval, and formulating execution plans for Side Agents.',
    avatarColor: 'bg-primary',
    model: 'gemini-2.5-flash',
    temperature: 0.1,
    systemPrompt:
      'You are ContextForge Core Orchestrator. You handle general reasoning, conversational discussion, live web search, and analysis. When mutations (file edits, Obsidian writes, CLI runs) are required, formulate a structured delegation spec for a Side Agent.',
    capabilities: [
      { id: 'c1', name: 'Conversational Reasoning', description: 'Deep reasoning, Q&A, and technical architecture analysis' },
      { id: 'c2', name: 'Live Web Grounding', description: 'Query web search engines and synthesize cited answers' },
      { id: 'c3', name: 'Side Agent Delegation', description: 'Formulate structured task specs and dispatch execution sandboxes' },
    ],
    assignedTools: ['web_search', 'read_file', 'query_memory', 'search_vault', 'dispatch_side_agent'],
    assignedSkills: ['skill-rfc-architect', 'skill-deep-web-research'],
    status: 'executing',
    totalTasksCompleted: 128,
    successRatePct: 99.4,
  },
  {
    id: 'agent-doc-crawl',
    name: 'Obsidian Vault Worker',
    role: 'Side Agent: Vault & Document Writer',
    agentType: 'execution_worker',
    permissions: 'sandbox_write',
    description:
      'Ephemeral execution worker that writes structured Markdown notes, updates frontmatter, and syncs Obsidian vaults.',
    avatarColor: 'bg-[#9fbbe0]',
    model: 'claude-3-7-sonnet',
    temperature: 0.2,
    systemPrompt:
      'You are Obsidian Vault Worker Side Agent. Execute file creation and note formatting in local Obsidian vaults.',
    capabilities: [
      { id: 'c4', name: 'Obsidian Vault Writing', description: 'Create and update Markdown notes with frontmatter in Obsidian' },
      { id: 'c5', name: 'Note Formatting', description: 'Apply consistent markdown templates, tags, and bi-directional links' },
    ],
    assignedTools: ['obsidian_vault_writer', 'obsidian_vault_reader'],
    assignedSkills: ['skill-obsidian-vault-synthesis'],
    status: 'idle',
    totalTasksCompleted: 58,
    successRatePct: 98.7,
  },
  {
    id: 'agent-db-platform',
    name: 'PostgreSQL Platform Worker',
    role: 'Side Agent: Database & Schema Introspection',
    agentType: 'execution_worker',
    permissions: 'sandbox_write',
    description:
      'Safe schema analysis, SQL query planning, and DDL migration verification over sandboxed connections.',
    avatarColor: 'bg-[#4b5563]',
    model: 'gemini-2.5-pro',
    temperature: 0.1,
    systemPrompt:
      'You are PostgreSQL Platform Worker. Execute read-only introspection, query plan analysis, and generate safe idempotent migration SQL scripts.',
    capabilities: [
      { id: 'c6', name: 'Schema Introspection', description: 'Inspect tables, columns, indexes, and foreign keys' },
      { id: 'c7', name: 'Safe Migration Generation', description: 'Draft non-blocking DDL scripts with rollback guards' },
    ],
    assignedTools: ['mcp_postgres_query', 'pg_explain_analyzer'],
    assignedSkills: ['skill-postgres-schema-analyzer'],
    status: 'idle',
    totalTasksCompleted: 92,
    successRatePct: 99.8,
  },
]

export const INITIAL_INTEGRATIONS: Integration[] = [
  {
    id: 'int-obsidian-vault-mcp',
    name: 'Obsidian Vault MCP Bridge',
    category: 'documentation',
    status: 'connected',
    endpoint: 'http://localhost:27123/mcp/obsidian',
    version: 'v2.1.0',
    transport: 'stdio',
    description: 'Direct bi-directional Model Context Protocol bridge into local Obsidian vault files & daily notes.',
    lastPingMs: 14,
    latencyMs: 11,
    tools: [
      {
        name: 'obsidian_vault_writer',
        description: 'Append or create structured Markdown files with frontmatter inside Obsidian',
        parametersSchema: { vaultName: 'string', path: 'string', content: 'string' },
        readOnly: false,
      },
      {
        name: 'obsidian_vault_reader',
        description: 'Read and search note contents, backlinks, and tags across markdown files',
        parametersSchema: { vaultName: 'string', query: 'string' },
        readOnly: true,
      },
    ],
  },
  {
    id: 'int-web-search-engine',
    name: 'Live Web Grounding Engine',
    category: 'telemetry',
    status: 'connected',
    endpoint: 'https://api.tavily.com/v1/search',
    version: 'v1.4.2',
    transport: 'rest',
    description: 'Grounding search engine provider for real-time web facts, documentation verification, & source citations.',
    lastPingMs: 68,
    latencyMs: 54,
    tools: [
      {
        name: 'web_search',
        description: 'Query search index for real-time technical documentation and cited news',
        parametersSchema: { query: 'string', maxResults: 'number' },
        readOnly: true,
      },
      {
        name: 'web_crawl_openapi',
        description: 'Crawl and parse remote OpenAPI/Swagger JSON specifications',
        parametersSchema: { url: 'string' },
        readOnly: true,
      },
    ],
  },
  {
    id: 'int-google-calendar',
    name: 'Google Calendar API',
    category: 'productivity',
    status: 'connected',
    endpoint: 'https://googleapis.com/calendar/v3/calendars/primary',
    version: 'v3.0.1',
    transport: 'rest',
    description: 'Sync reminders, schedule engineering reviews, and set autonomous agent checkpoints.',
    lastPingMs: 42,
    latencyMs: 38,
    tools: [
      {
        name: 'calendar_list_events',
        description: 'List upcoming events and agenda items for current workspace',
        parametersSchema: { timeMin: 'string', timeMax: 'string' },
        readOnly: true,
      },
      {
        name: 'calendar_schedule_review',
        description: 'Insert new calendar reminder event for code reviews and deadlines',
        parametersSchema: { title: 'string', dateTime: 'string', durationMinutes: 'number' },
        readOnly: false,
      },
    ],
  },
  {
    id: 'int-mcp-postgres',
    name: 'PostgreSQL Direct MCP Connector',
    category: 'mcp_server',
    status: 'connected',
    endpoint: 'postgres://contextforge:secret@localhost:5432/platform_db',
    version: 'v1.0.0',
    transport: 'stdio',
    description: 'Model Context Protocol adapter for read-only database introspection, EXPLAIN ANALYZE, & schema inspection.',
    lastPingMs: 8,
    latencyMs: 6,
    tools: [
      {
        name: 'mcp_postgres_query',
        description: 'Execute parameterized read-only SQL query against database',
        parametersSchema: { sql: 'string' },
        readOnly: true,
      },
      {
        name: 'pg_explain_analyzer',
        description: 'Run EXPLAIN (ANALYZE, BUFFERS) on target query to diagnose table scans',
        parametersSchema: { query: 'string' },
        readOnly: true,
      },
    ],
  },
  {
    id: 'int-github-app',
    name: 'GitHub Cloud / App',
    category: 'git_provider',
    status: 'connected',
    endpoint: 'https://api.github.com/repos/acme/platform-core',
    version: 'v3.0.0',
    transport: 'rest',
    description: 'Read AST files, inspect pull requests, and commit audited deliverables directly to Git.',
    lastPingMs: 45,
    latencyMs: 38,
    tools: [
      {
        name: 'github_grep',
        description: 'Ripgrep regex pattern across entire remote repository codebase',
        parametersSchema: { query: 'string', pathFilter: 'string' },
        readOnly: true,
      },
      {
        name: 'github_create_pr',
        description: 'Submit an automated branch and pull request for reviewed changes',
        parametersSchema: { branch: 'string', title: 'string', body: 'string' },
        readOnly: false,
      },
    ],
  },
]

export const INITIAL_SKILLS: Skill[] = [
  {
    id: 'skill-tdd-flow',
    name: 'Test-Driven Development (TDD) Playbook',
    description: 'Enforces red-green-refactor cycle with isolated Vitest suites and zero-regression AST checks.',
    category: 'qa_testing',
    icon: 'TestTube2',
    sopSummary: 'Write failing tests first -> Implement minimum required code -> Refactor cleanly',
    instructions: `1. Always write unit tests before modifying any business logic.
2. Run test runners in sandboxed worker containers to confirm failure (RED).
3. Implement only the minimal logic needed to satisfy assertions (GREEN).
4. Run full AST analysis and linter passes with zero warnings.`,
    assignedTools: ['vitest_sandbox_runner', 'eslint_ast_checker'],
    enabled: true,
  },
  {
    id: 'skill-cve-threat-model',
    name: 'Security Threat Model & CVE Audit',
    description: 'Inspects AST nodes, audits dependencies against CVE registries, and enforces zero-trust token flows.',
    category: 'security',
    icon: 'ShieldAlert',
    sopSummary: 'Static AST scan -> CVE vulnerability lookup -> Human authorization checkpoint',
    instructions: `1. Scan imported packages against the latest CVE advisory database.
2. Check OAuth token expiration, refresh rotation, and sensitive secret leaks.
3. If critical severity is found, immediately halt automated dispatch and request engineer approval.`,
    assignedTools: ['npm_audit_scanner', 'github_grep', 'notion_read_rfc'],
    enabled: true,
  },
  {
    id: 'skill-obsidian-vault-synthesis',
    name: 'Obsidian Markdown Note Synthesizer',
    description: 'Structures complex multi-source findings into clean markdown with YAML frontmatter and bidirectional wikilinks.',
    category: 'knowledge',
    icon: 'BookOpen',
    sopSummary: 'Format YAML metadata -> Add [[Wikilinks]] -> Write to vault via MCP',
    instructions: `1. Generate standardized YAML frontmatter (tags, date, author, status).
2. Use concise headings, bullet checklists, and reciprocal wikilinks [[Topic]].
3. Validate atomic write lock on the target Obsidian vault path via MCP.`,
    assignedTools: ['obsidian_vault_writer', 'obsidian_vault_reader'],
    enabled: true,
  },
  {
    id: 'skill-deep-web-research',
    name: 'Deep Web Fact Verification & Citations',
    description: 'Executes multi-query web crawling, extracts peer-reviewed facts, and formats academic citations.',
    category: 'knowledge',
    icon: 'Globe',
    sopSummary: 'Multi-engine search -> Cross-reference facts -> Format inline citations',
    instructions: `1. Formulate search queries optimized for technical API specs and research papers.
2. Synthesize at least 2 independent sources before asserting critical technical facts.
3. Provide clickable markdown footnotes with domain origin and timestamp.`,
    assignedTools: ['web_search', 'web_crawl_openapi'],
    enabled: true,
  },
  {
    id: 'skill-postgres-schema-analyzer',
    name: 'PostgreSQL Performance & DDL Optimizer',
    description: 'Analyzes query execution plans, indexes cardinality, and recommends zero-downtime migration scripts.',
    category: 'database',
    icon: 'Database',
    sopSummary: 'Inspect DDL schema -> EXPLAIN ANALYZE cost check -> Safe migration drafting',
    instructions: `1. Run read-only introspection on table schemas and index usage statistics.
2. Detect potential sequential table scans on high-traffic relations.
3. Output idempotent SQL statements with rollback guards.`,
    assignedTools: ['mcp_postgres_query', 'pg_explain_analyzer'],
    enabled: true,
  },
  {
    id: 'skill-rfc-architect',
    name: 'Technical RFC Specification Formulator',
    description: 'Drafts RFC documents adhering to industry engineering standards with architecture diagrams.',
    category: 'architecture',
    icon: 'Layers',
    sopSummary: 'Draft motivation & problem statement -> Architecture design -> Threat model',
    instructions: `1. Structure RFC into Abstract, Motivation, Detailed Design, Drawbacks, and Alternatives.
2. Cross-reference internal company RFC guidelines in Notion.
3. Generate mermaid architectural diagrams for complex subsystems.`,
    assignedTools: ['notion_read_rfc', 'obsidian_vault_writer', 'github_create_pr'],
    enabled: true,
  },
]

export const INITIAL_PLUGINS: Plugin[] = [
  {
    id: 'plugin-devops-automation',
    name: 'DevOps & Git Automation Pack',
    description: 'Automates Git branch creation, PR generation, AST syntax verification, and CI/CD audit workflows.',
    category: 'devops',
    icon: 'GitPullRequest',
    author: 'ContextForge Core',
    version: 'v1.4.0',
    installed: true,
    badge: 'Popular',
    bundledConnectorIds: ['int-github-app', 'int-web-search-engine'],
    bundledSkillIds: ['skill-tdd-flow', 'skill-cve-threat-model'],
  },
  {
    id: 'plugin-obsidian-knowledge-master',
    name: 'Obsidian Knowledge Synthesizer',
    description: 'Local Markdown vault synchronization with bidirectional wikilinking, web fact-checking, and auto-tagging.',
    category: 'knowledge',
    icon: 'BookOpen',
    author: 'Obsidian Community',
    version: 'v2.1.0',
    installed: true,
    badge: 'Essential',
    bundledConnectorIds: ['int-obsidian-vault-mcp', 'int-web-search-engine'],
    bundledSkillIds: ['skill-obsidian-vault-synthesis', 'skill-deep-web-research'],
  },
  {
    id: 'plugin-database-telemetry',
    name: 'PostgreSQL Telemetry & Productivity Suite',
    description: 'Read-only schema introspection, query plan optimizer, and automatic DBA reminder scheduler.',
    category: 'productivity',
    icon: 'Database',
    author: 'DataOps Lab',
    version: 'v1.2.0',
    installed: true,
    badge: 'Verified',
    bundledConnectorIds: ['int-mcp-postgres', 'int-google-calendar'],
    bundledSkillIds: ['skill-postgres-schema-analyzer'],
  },
  {
    id: 'plugin-security-compliance',
    name: 'Enterprise Security & RFC Suite',
    description: 'Continuous zero-regression AST checks, CVE audit scanner, and RFC specification formulation.',
    category: 'security',
    icon: 'ShieldCheck',
    author: 'SecOps Standard',
    version: 'v2.0.0',
    installed: false,
    badge: 'Enterprise',
    bundledConnectorIds: ['int-github-app'],
    bundledSkillIds: ['skill-cve-threat-model', 'skill-rfc-architect'],
  },
]
