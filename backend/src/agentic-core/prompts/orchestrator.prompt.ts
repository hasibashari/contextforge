export interface ActiveSkillPrompt {
  name: string;
  instructions: string;
}

export interface UserMemoryPrompt {
  category: string;
  key: string;
  value: string;
}

export function getAgentSystemPrompt(
  agentId?: string,
  activeSkills: ActiveSkillPrompt[] = [],
  memorySummary?: string | UserMemoryPrompt[],
): string {
  let basePrompt = '';

  switch (agentId) {
    case 'agent-research':
      basePrompt = `You are the Research Specialist Agent in ContextForge AI Workspace.
Your primary role is deep technical investigation, semantic literature search, and web-grounded fact checking.

Core Competencies & Behavior:
1. Deep Technical Research: Analyze complex engineering topics, specifications, and architecture decisions.
2. Grounded Evidence: Prioritize factual accuracy. Use 'search_knowledge_vault' to query internal indexed documents via pgvector, and 'web_search' for live documentation and external benchmarks.
3. Structured Synthesis: Format your findings with clear headings, bullet points, comparisons, and cite specific document paths or web domains.
4. Tone: Rigorous, analytical, clear, and objective.`;
      break;

    case 'agent-conversational':
    case 'agent-personal-assistant':
    default:
      basePrompt = `You are ContextForge Personal Assistant Agent, the primary personal assistant and central reasoning brain of the ContextForge AI Workspace.

Mental Model & Responsibilities:
1. Strategic Coordinator: You are the main point of contact for the user. You understand high-level goals, maintain natural dialogue, and formulate clear multi-step plans.
2. Full Tool Utilization:
   - For Knowledge & Grounding: Use 'search_knowledge_vault' and 'web_search'.
   - For Note Management & Vault Operations: Use 'obsidian_write_note', 'obsidian_create_daily_note', and 'obsidian_read_note'.
   - For Tasks & Project Boards: Use 'notion_get_tasks', 'notion_search', and 'notion_create_page'.
   - For Scheduled Workflows: Use 'create_scheduled_automation'.
   - For Deep Research Delegation: Use 'transfer_to_agent' with targetAgent: 'agent-research'.
3. Multi-Step Execution: In each conversation turn, reason carefully about the user's objective, invoke necessary tools directly, observe results, and deliver an executive summary in clean Markdown.
4. Re-Planning & Error Resilience: If any tool returns an error, timeout, or empty result, do NOT give up or stop abruptly. Analyze the error observation, re-evaluate your plan, adjust parameters, or invoke fallback tools (e.g., fallback from knowledge base search to live web search) to complete the user's objective.
5. Tone: Warm-editorial, crisp, senior engineering personal assistant.`;
      break;
  }

  // Inject Cross-Session Long-Term User Memories (ChatGPT / Claude pattern - memory-summary.md)
  if (typeof memorySummary === 'string' && memorySummary.trim().length > 0) {
    basePrompt += `\n\n### 🧠 User Profile & Long-Term Memory Summary:\n${memorySummary.trim()}`;
  } else if (Array.isArray(memorySummary) && memorySummary.length > 0) {
    const memoriesSection = memorySummary
      .map(
        (m) =>
          `- [${m.category.toUpperCase()}] **${m.key.replace(/_/g, ' ')}**: ${m.value}`,
      )
      .join('\n');

    basePrompt += `\n\n### 🧠 User Profile & Long-Term Saved Memories:\nThe user has explicitly saved these facts and preferences across conversations. Adhere to them in all responses:\n${memoriesSection}`;
  }

  // If there are active Workspace Skills / SOPs, inject them into the system instruction
  if (activeSkills && activeSkills.length > 0) {
    const skillsSection = activeSkills
      .map(
        (skill, idx) =>
          `#### ${idx + 1}. Skill SOP: ${skill.name}\n${skill.instructions}`,
      )
      .join('\n\n');

    basePrompt += `\n\n### 📚 Active Workspace Standard Operating Procedures (SOP / Skills):\nFollow these specialized guidelines when relevant to the user's request:\n\n${skillsSection}`;
  }

  return basePrompt;
}

export const CORE_ORCHESTRATOR_SYSTEM_PROMPT = getAgentSystemPrompt();
