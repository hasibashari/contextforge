import { Injectable } from '@nestjs/common';

@Injectable()
export class EcosystemService {
  private agents = [
    {
      id: 'agent-sec-docs',
      name: 'ContextForge Core Orchestrator',
      role: 'Main Reasoning & Analysis Agent',
      agentType: 'orchestrator',
      permissions: 'read_only',
      description:
        'Primary conversational brain for Q&A, live web research, memory retrieval, and formulating execution plans for Side Agents.',
      avatarColor: 'bg-primary',
      model: 'gemini-3.6-flash',
      temperature: 0.2,
      systemPrompt:
        'You are ContextForge Core Orchestrator. You handle general reasoning, conversational discussion, live web search, and analysis.',
      capabilities: [
        {
          id: 'c1',
          name: 'Conversational Reasoning',
          description:
            'Deep reasoning, Q&A, and technical architecture analysis',
        },
        {
          id: 'c2',
          name: 'Live Web Grounding',
          description: 'Query web search engines and synthesize cited answers',
        },
        {
          id: 'c3',
          name: 'Side Agent Delegation',
          description:
            'Formulate structured task specs and dispatch execution sandboxes',
        },
      ],
      assignedTools: [
        'web_search',
        'read_file',
        'query_memory',
        'search_vault',
        'dispatch_side_agent',
      ],
      assignedSkills: ['skill-rfc-architect', 'skill-deep-web-research'],
      status: 'idle',
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
      model: 'gemini-3.6-flash',
      temperature: 0.2,
      systemPrompt:
        'You are Obsidian Vault Worker Side Agent. Execute file creation and note formatting in local Obsidian vaults.',
      capabilities: [
        {
          id: 'c4',
          name: 'Obsidian Vault Writing',
          description:
            'Create and update Markdown notes with frontmatter in Obsidian',
        },
        {
          id: 'c5',
          name: 'Note Formatting',
          description:
            'Apply consistent markdown templates, tags, and bi-directional links',
        },
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
      model: 'gemini-3.6-flash',
      temperature: 0.1,
      systemPrompt:
        'You are Code Sandbox Side Agent. Execute file mutations, run CLI commands, verify AST syntax, and return execution summaries.',
      capabilities: [
        {
          id: 'c8',
          name: 'File Creation & Editing',
          description:
            'Write source code, apply atomic diffs, and create directories',
        },
        {
          id: 'c9',
          name: 'CLI Command Execution',
          description:
            'Run test runners, package installers, and lint checks in sandbox',
        },
      ],
      assignedTools: [
        'write_file',
        'replace_file_content',
        'run_command',
        'git_create_pr',
      ],
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
      model: 'gemini-3.6-flash',
      temperature: 0.1,
      systemPrompt:
        'You are Calendar & Workflow Worker. Schedule calendar events, configure notification reminders, and run API mutations.',
      capabilities: [
        {
          id: 'c6',
          name: 'Calendar Scheduling',
          description: 'Create, update, and manage Google Calendar reminders',
        },
        {
          id: 'c7',
          name: 'API Mutation Execution',
          description: 'Trigger webhook integrations and update cloud records',
        },
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
      model: 'gemini-3.6-flash',
      temperature: 0.7,
      systemPrompt:
        'You are Visual & Asset Generator. Create visual UI designs, diagrams, and media specifications.',
      capabilities: [
        {
          id: 'c10',
          name: 'UI Mockup Rendering',
          description: 'Generate high-fidelity vector & bitmap layout previews',
        },
        {
          id: 'c11',
          name: 'Architecture Diagrams',
          description: 'Produce clean SVG topology and sequence charts',
        },
      ],
      assignedTools: ['imagen_render_visual', 'svg_vector_generator'],
      assignedSkills: ['skill-editorial-design-system'],
      status: 'idle',
      totalTasksCompleted: 42,
      successRatePct: 98.8,
    },
  ];

  private skills = [
    {
      id: 'skill-rfc-architect',
      name: 'RFC Architecture Drafting',
      description:
        'Standard Operating Procedure (SOP) for creating Request for Comments (RFC) documents with trade-off analysis.',
      category: 'architecture',
      icon: 'FileCode2',
      sopSummary:
        'Synthesizes domain constraints, designs modular boundaries, and writes structured RFC markdown.',
      instructions:
        '1. Identify problem statement. 2. Define non-goals. 3. Draft architecture spec. 4. Compile verification matrix.',
      assignedTools: ['obsidian_vault_writer', 'search_vault'],
      enabled: true,
    },
    {
      id: 'skill-tdd-flow',
      name: 'Test-Driven Development (TDD) Flow',
      description:
        'Enforces Red-Green-Refactor loop with vitest / jest runners in isolated code sandbox.',
      category: 'qa_testing',
      icon: 'CheckCircle2',
      sopSummary:
        'Write failing test first, implement minimal code to pass, then refactor with AST verification.',
      instructions:
        '1. Scaffold test file. 2. Verify failure. 3. Implement business logic. 4. Re-run suite until 100% green.',
      assignedTools: ['write_file', 'run_command', 'ast_syntax_checker'],
      enabled: true,
    },
  ];

  getAgents() {
    return this.agents;
  }

  getSkills() {
    return this.skills;
  }
}
