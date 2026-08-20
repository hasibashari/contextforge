import type {
  Agent,
  Skill,
  Plugin,
  Task,
  KnowledgeSource,
  Integration,
  ActivityLogEntry,
  Artifact,
  ChatSession,
  CalendarEvent,
  UserMemoryItem,
} from '@/shared/types/workspace'

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
    successRatePct: 99.2,
  },
  {
    id: 'agent-code-reviewer',
    name: 'CLI & Code Sandbox Runner',
    role: 'Side Agent: Terminal & File Execution',
    agentType: 'execution_worker',
    permissions: 'full_system',
    description:
      'Sandboxed execution worker that creates files, edits codebases, executes bash commands, and runs test suites.',
    avatarColor: 'bg-[#c0a8dd]',
    model: 'claude-3-7-sonnet',
    temperature: 0.1,
    systemPrompt:
      'You are Code Sandbox Side Agent. Execute file mutations, run CLI commands, verify AST syntax, and return execution summaries.',
    capabilities: [
      { id: 'c8', name: 'File Creation & Editing', description: 'Write source code, apply atomic diffs, and create directories' },
      { id: 'c9', name: 'CLI Command Execution', description: 'Run test runners, package installers, and lint checks in sandbox' },
    ],
    assignedTools: ['write_file', 'replace_file_content', 'run_command', 'git_create_pr'],
    assignedSkills: ['skill-tdd-flow', 'skill-cve-threat-model'],
    status: 'idle',
    totalTasksCompleted: 74,
    successRatePct: 99.1,
  },
  {
    id: 'agent-db-platform',
    name: 'Calendar & Workflow Worker',
    role: 'Side Agent: Calendar & API Mutator',
    agentType: 'execution_worker',
    permissions: 'sandbox_write',
    description:
      'Side agent for scheduling Google Calendar reminders, updating database records, and triggering external webhooks.',
    avatarColor: 'bg-[#9fc9a2]',
    model: 'gemini-2.5-flash',
    temperature: 0.1,
    systemPrompt:
      'You are Calendar & Workflow Worker. Schedule calendar events, configure notification reminders, and run API mutations.',
    capabilities: [
      { id: 'c6', name: 'Calendar Scheduling', description: 'Create, update, and manage Google Calendar reminders' },
      { id: 'c7', name: 'API Mutation Execution', description: 'Trigger webhook integrations and update cloud records' },
    ],
    assignedTools: ['calendar_create_reminder', 'api_post_webhook'],
    assignedSkills: ['skill-postgres-schema-analyzer'],
    status: 'idle',
    totalTasksCompleted: 34,
    successRatePct: 100.0,
  },
  {
    id: 'agent-frontend-arch',
    name: 'Visual & Asset Generator',
    role: 'Side Agent: GPU Asset Renderer',
    agentType: 'execution_worker',
    permissions: 'sandbox_write',
    description:
      'Specialized GPU worker for rendering UI mockups, architecture diagrams, and visual design assets.',
    avatarColor: 'bg-[#ff5e00]',
    model: 'imagen-3-flux',
    temperature: 0.7,
    systemPrompt:
      'You are Visual Asset Generator. Render high-resolution visual designs and diagram assets.',
    capabilities: [
      { id: 'c10', name: 'Visual Asset Rendering', description: 'Generate high-res SVG and PNG visual assets' },
    ],
    assignedTools: ['image_generation_pipeline'],
    assignedSkills: ['skill-deep-web-research'],
    status: 'idle',
    totalTasksCompleted: 29,
    successRatePct: 98.8,
  },
]

export const INITIAL_KNOWLEDGE_SOURCES: KnowledgeSource[] = [
  {
    id: 'source-obsidian-vault',
    type: 'obsidian_vault',
    name: 'Personal Obsidian Vault',
    description: 'Local Obsidian notes folder with architecture decisions, sprint ideas, and daily engineering logs.',
    location: 'obsidian://vault/Engineering-HQ',
    meta: '128 notes · 1536-dim vector RAG',
    filesCount: 12,
    chunksCount: 148,
    lastSynced: 'Just now',
    status: 'synced',
    iconType: 'book-open',
    color: 'text-primary',
  },
  {
    id: 'source-upload-specs',
    type: 'document_upload',
    name: 'Technical Design & RFC Documents',
    description: 'Uploaded engineering documents (PDF, Markdown, DOCX) indexed for conversational RAG grounding.',
    location: 'upload://documents/170000001',
    meta: '8 documents uploaded · 1536-dim vector RAG',
    filesCount: 8,
    chunksCount: 96,
    lastSynced: '15m ago',
    status: 'synced',
    iconType: 'upload',
    color: 'text-primary',
  },
  {
    id: 'source-server-docs',
    type: 'local_folder',
    name: 'Server Local Filesystem Directory',
    description: 'Direct server filesystem documentation directory for self-hosted and on-premise deployments.',
    location: 'file:///home/azure/dev/projects/fullstack/contextforge/vault',
    meta: 'Server local storage · 1536-dim vector RAG',
    filesCount: 6,
    chunksCount: 64,
    lastSynced: '1h ago',
    status: 'synced',
    iconType: 'folder',
    color: 'text-semantic-success',
  },
]

export const INITIAL_INTEGRATIONS: Integration[] = [
  {
    id: 'int-obsidian-mcp',
    name: 'Obsidian Vault MCP Bridge',
    category: 'productivity',
    status: 'connected',
    endpoint: 'http://localhost:27123/mcp/obsidian',
    version: 'v2.0.4',
    description: 'Enables direct reading, writing, and tagging of Markdown notes in your Obsidian desktop vault.',
    lastPingMs: 6,
    latencyMs: 5,
    tools: [
      {
        name: 'obsidian_vault_writer',
        description: 'Create or overwrite Markdown file inside Obsidian vault with tags and frontmatter',
        parametersSchema: { path: 'string', content: 'string', tags: 'array' },
        readOnly: false,
      },
      {
        name: 'obsidian_vault_reader',
        description: 'Search and read existing markdown notes in Obsidian vault',
        parametersSchema: { query: 'string', folder: 'string' },
        readOnly: true,
      },
    ],
  },
  {
    id: 'int-google-calendar',
    name: 'Google Calendar & Reminder Service',
    category: 'productivity',
    status: 'connected',
    endpoint: 'https://googleapis.com/calendar/v3/primary',
    version: 'v3.0.0',
    description: 'Sets calendar events, reminders, and deadline alerts directly from chat instructions.',
    lastPingMs: 42,
    latencyMs: 38,
    tools: [
      {
        name: 'calendar_create_reminder',
        description: 'Schedule a new calendar reminder with date, time, and title',
        parametersSchema: { title: 'string', datetimeIso: 'string', details: 'string' },
        readOnly: false,
      },
    ],
  },
  {
    id: 'int-web-search-engine',
    name: 'Tavily / Google Web Search API',
    category: 'documentation',
    status: 'connected',
    endpoint: 'https://api.tavily.com/v1/search',
    version: 'v1.1.0',
    description: 'Provides clean, verified web extracts, citations, and realtime facts for research prompts.',
    lastPingMs: 95,
    latencyMs: 85,
    tools: [
      {
        name: 'web_search',
        description: 'Perform web search query and return top summarized URL results',
        parametersSchema: { query: 'string', maxResults: 'number' },
        readOnly: true,
      },
    ],
  },
  {
    id: 'int-github-app',
    name: 'GitHub Enterprise Connector',
    category: 'git_provider',
    status: 'connected',
    endpoint: 'api.github.com/app/contextforge-bot',
    version: 'v2.1.0',
    description: 'Reads codebase AST, indexes main branches, and creates draft pull requests on demand.',
    lastPingMs: 45,
    latencyMs: 42,
    tools: [
      {
        name: 'github_grep',
        description: 'Search exact string or regex across all indexed files',
        parametersSchema: { query: 'string', pathFilter: 'string' },
        readOnly: true,
      },
      {
        name: 'github_create_pr',
        description: 'Dispatch pull request with branch, title, and commit patch',
        parametersSchema: { branch: 'string', title: 'string', diff: 'string' },
        readOnly: false,
      },
    ],
  },
  {
    id: 'int-mcp-postgres',
    name: 'PostgreSQL MCP Server',
    category: 'mcp_server',
    status: 'connected',
    endpoint: 'http://localhost:8080/mcp/postgres',
    version: 'v1.4.0',
    description: 'Allows agents to inspect table DDLs, active connection limits, and index cardinality.',
    lastPingMs: 14,
    latencyMs: 12,
    tools: [
      {
        name: 'mcp_postgres_query',
        description: 'Execute read-only SQL queries in sandboxed transaction block',
        parametersSchema: { sql: 'string', limit: 'number' },
        readOnly: true,
      },
    ],
  },
  {
    id: 'int-google-drive',
    name: 'Google Drive',
    category: 'productivity',
    status: 'connected',
    endpoint: 'https://googleapis.com/drive/v3/files',
    version: 'v3.2.0',
    description: 'Search, read, and upload files instantly across personal and shared team drives.',
    lastPingMs: 28,
    latencyMs: 22,
    tools: [
      {
        name: 'drive_search_files',
        description: 'Search files and folders in Google Drive by keyword or MIME type',
        parametersSchema: { query: 'string', mimeType: 'string' },
        readOnly: true,
      },
      {
        name: 'drive_upload_doc',
        description: 'Export and upload generated markdown or artifact to Google Drive',
        parametersSchema: { title: 'string', content: 'string', folderId: 'string' },
        readOnly: false,
      },
    ],
  },
  {
    id: 'int-gmail',
    name: 'Gmail',
    category: 'productivity',
    status: 'connected',
    endpoint: 'https://googleapis.com/gmail/v1/users/me',
    version: 'v1.0.0',
    description: 'Draft replies, summarize threads, & search your inbox securely without human friction.',
    lastPingMs: 32,
    latencyMs: 26,
    tools: [
      {
        name: 'gmail_search_threads',
        description: 'Search email threads by query or sender address',
        parametersSchema: { query: 'string', maxResults: 'number' },
        readOnly: true,
      },
      {
        name: 'gmail_draft_reply',
        description: 'Create draft response for review before dispatch',
        parametersSchema: { threadId: 'string', replyBody: 'string' },
        readOnly: false,
      },
    ],
  },
  {
    id: 'int-notion-workspace',
    name: 'Notion Workspace',
    category: 'documentation',
    status: 'connected',
    endpoint: 'https://api.notion.com/v1/search',
    version: 'v2.2.0',
    description: 'Index engineering wikis, product requirement documents (PRD), and Notion RFCs.',
    lastPingMs: 19,
    latencyMs: 15,
    tools: [
      {
        name: 'notion_read_rfc',
        description: 'Query and fetch internal technical specifications in Notion',
        parametersSchema: { pageId: 'string', query: 'string' },
        readOnly: true,
      },
    ],
  },
]

// -------------------------------------------------------------
// Initial Skills (SOPs / Reasoning Playbooks)
// -------------------------------------------------------------

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

// -------------------------------------------------------------
// Initial Plugins (Curated Ecosystem Bundles)
// -------------------------------------------------------------

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

// -------------------------------------------------------------
// Initial Artifacts (Real data loaded from PostgreSQL)
// -------------------------------------------------------------

export const INITIAL_ARTIFACTS: Artifact[] = []

// -------------------------------------------------------------
// Initial Chat Sessions (Real data loaded from PostgreSQL)
// -------------------------------------------------------------

export const INITIAL_CHAT_SESSIONS: ChatSession[] = []

// -------------------------------------------------------------
// Legacy Mock Tasks for compatibility
// -------------------------------------------------------------

export const INITIAL_TASKS: Task[] = [
  {
    id: 'PLAN-104',
    title: 'Migrate OAuth2 session tokens to ephemeral scoped keys',
    objective:
      'Grounded across internal Notion Security RFC #204 and GitHub auth middleware. Ingest 14 files, update JWT payload structure, and verify 0 regressions in sandboxed AST test.',
    repo: 'github:acme/auth-service',
    agentId: 'agent-sec-docs',
    status: 'waiting_approval',
    currentStage: 'deliverable',
    createdAt: '12m ago',
    knowledgeSources: ['source-github-core', 'source-notion-sops', 'source-obsidian-vault'],
    toolsUsed: ['github_grep', 'notion_read_rfc', 'ast_sandbox_runner'],
    tokensUsed: {
      input: 14250,
      output: 3840,
      total: 18090,
      estimatedCostUsd: 0.082,
    },
    steps: [
      {
        id: 'step-1',
        stage: 'planning',
        title: 'Task Decomposition & Objective Formulation',
        status: 'completed',
        startedAt: '12m ago',
        completedAt: '11m ago',
        logs: [
          '[Agent:Security & RFC Architect] Initialized task workflow: Migrate OAuth2 session tokens',
          '[Planning] Parsed user constraints: zero-regression, ephemeral 15m expiration, RFC #204 compatibility',
        ],
      },
    ],
    deliverable: {
      id: 'DELIV-104',
      type: 'pull_request',
      title: 'feat(auth): migrate OAuth2 session tokens to scoped ephemeral keys',
      summary:
        'Replaces legacy static JWT verification with ephemeral scoped HMAC tokens adhering to Notion Security RFC #204. Sandboxed AST validation completed with 32/32 tests passing.',
      impactLevel: 'High',
      impactArea: 'Auth Gateway, Session Storage, Token Middleware',
      branchName: 'feat/ephemeral-oauth2-rfc204',
      pullRequestUrl: 'https://github.com/acme-corp/platform-core/pull/842',
      checkpoints: [
        {
          id: 'cp-1',
          text: 'Validate HMAC token rotation against Notion Security RFC #204',
          category: 'rfc_compliance',
          done: true,
          details: 'Verified payload contains iss, exp (900s), and scope claims',
        },
        {
          id: 'cp-2',
          text: 'Update authMiddleware.ts with scoped claims extractor',
          category: 'ast_analysis',
          done: true,
          details: 'Zero broken references in AST parser',
        },
      ],
      diffs: [
        {
          file: 'src/middleware/auth.ts',
          additions: 34,
          deletions: 12,
          oldCode: `export function verifyToken(req: Request) {\n  const token = req.headers.authorization?.split(' ')[1]\n  return jwt.verify(token, process.env.STATIC_SECRET)\n}`,
          newCode: `export function verifyToken(req: Request) {\n  const token = req.headers.authorization?.split(' ')[1]\n  const scopedKey = getEphemeralKeyRotator().getCurrentScope()\n  return jwt.verify(token, scopedKey, { maxAge: '15m', algorithms: ['HS256'] })\n}`,
        },
      ],
    },
  },
]

export const INITIAL_ACTIVITIES: ActivityLogEntry[] = [
  {
    id: 'act-1',
    timestamp: '10m ago',
    agentId: 'agent-doc-crawl',
    agentName: 'Knowledge & Obsidian Sync',
    actionType: 'obsidian_note_created',
    summary: 'Created new sprint plan in Obsidian vault: Vault/Work/Sprints/Sprint-34-Plan.md',
    status: 'success',
  },
  {
    id: 'act-2',
    timestamp: '25m ago',
    agentId: 'agent-doc-crawl',
    agentName: 'Knowledge & Obsidian Sync',
    actionType: 'web_searched',
    summary: 'Retrieved latest AI reasoning architecture benchmarks via Web Search API',
    status: 'info',
  },
  {
    id: 'act-3',
    timestamp: '1h ago',
    agentId: 'agent-db-platform',
    agentName: 'Database & Productivity Agent',
    actionType: 'reminder_created',
    summary: 'Scheduled calendar reminder: "Review RFC #204 Token Compliance" for tomorrow 09:00',
    status: 'success',
  },
]

export const INITIAL_CALENDAR_EVENTS: CalendarEvent[] = []

export const INITIAL_USER_MEMORIES: UserMemoryItem[] = []

