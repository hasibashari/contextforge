/**
 * LLM Wiki Schema & Compiler Prompts
 * Implements the persistent compounding knowledge base pattern:
 * - Incremental compilation & cross-linking ([[wikilinks]])
 * - Indexing (index.md) & Chronological auditing (log.md)
 * - Contradiction tracking & Knowledge health linting
 */

export const WIKI_COMPILER_SYSTEM_PROMPT = `You are the ContextForge LLM Wiki Compiler & Knowledge Architect.
Your mission is to maintain a persistent, compounding, highly interlinked Wiki Knowledge Base.

Unlike simple RAG (which re-chunks and re-discovers knowledge from scratch every query), you incrementally compile raw source documents into a living network of Markdown pages with bi-directional [[wikilinks]].

### 📐 Wiki Structure & Conventions:
1. **index.md** (Catalog & Root Map):
   - Categorized directory of all concepts, entities, and synthesis documents.
   - Every page has a link e.g. '[[Concepts/Agentic-AI|Agentic AI]]' and a concise 1-line description.
   - Must be updated on every ingestion.

2. **log.md** (Chronological Event Audit):
   - Append-only log with standard prefix:
     \`## [YYYY-MM-DD] ingest | {Document Title}\`
     \`- Added concepts: [[Concepts/...]]\`
     \`- Updated entities: [[Entities/...]]\`
     \`- Noted contradictions: ...\`

3. **Concepts/ ({Concept-Name}.md)**:
   - In-depth, evolving synthesis of key ideas, mechanisms, or architectural patterns.
   - Rich cross-references using '[[Wikilink Title]]' syntax.
   - Include '## Synthesis', '## Key Principles', '## Related Concepts', and '## Sources'.

4. **Entities/ ({Entity-Name}.md)**:
   - Profiles of tools, frameworks, people, systems, modules, or organizations.
   - Properties, role, capabilities, and dependencies.

5. **Synthesis/ ({Topic-Comparison}.md)**:
   - Comparative analyses, architectural decisions, and high-value research answers.

### 🔄 Ingestion Rules (Compounding Knowledge):
- **Cross-Linking**: Always use double brackets \`[[Target Page]]\` for any named entities, concepts, or related documents.
- **Contradiction Detection**: If new source information conflicts with an earlier claim, document the discrepancy in both the concept note and \`log.md\`.
- **Atomic & Modular**: Keep notes focused and cohesive. A single source should update or spawn 2-5 interconnected concept/entity notes.
`;

export function getWikiIngestionPrompt(
  sourceTitle: string,
  sourceContent: string,
  existingIndexContent?: string,
): string {
  return `### Task: Ingest Source Document into LLM Wiki

**Source Title:** ${sourceTitle}
**Source Content:**
"""
${sourceContent.slice(0, 15000)}
"""

${existingIndexContent ? `**Current index.md Context:**\n"""\n${existingIndexContent.slice(0, 3000)}\n"""\n` : ''}

### Required Actions:
1. Extract the primary concepts, architecture patterns, and entity profiles from this source.
2. Determine which existing pages need updating and which new concept/entity pages need to be created.
3. Formulate the exact Markdown notes with YAML frontmatter and [[wikilinks]].
4. Prepare the updated entry for 'index.md' and the audit entry for 'log.md'.

Output your compilation plan and structured notes in clean JSON format:
{
  "summary": "Executive overview of findings and updates",
  "pagesToCreateOrUpdate": [
    {
      "path": "Concepts/Example-Topic.md",
      "title": "Example Topic",
      "category": "concept",
      "tags": ["agentic", "architecture"],
      "content": "Full markdown body with [[Wikilinks]]..."
    }
  ],
  "indexEntry": "- [[Concepts/Example-Topic|Example Topic]]: One line summary description",
  "logEntry": "## [${new Date().toISOString().slice(0, 10)}] ingest | ${sourceTitle}\\n- Created [[Concepts/Example-Topic]]\\n- Updated [[index]]"
}
`;
}

export function getWikiLintPrompt(
  allPagesSummaries: Array<{
    path: string;
    title: string;
    category: string;
    outlinks: string[];
    contentSnippet: string;
  }>,
): string {
  return `### Task: LLM Wiki Health Check & Linting Pass

You are reviewing the current state of the Wiki Knowledge Base.
Here is the summary of all existing pages and their outlinks:
${JSON.stringify(allPagesSummaries, null, 2)}

### Your Objective:
1. **Contradictions & Stale Claims**: Flag any inconsistencies or superseded facts between notes.
2. **Orphan Pages**: Identify notes with 0 inbound or 0 outbound links.
3. **Broken Links**: Identify [[wikilinks]] pointing to concepts that do not yet have their own page.
4. **Knowledge Gaps**: Suggest 3-5 new exploratory questions or topics to investigate.

Output a structured JSON report:
{
  "healthScore": 85,
  "issues": [
    {
      "type": "broken_link",
      "title": "Missing concept page",
      "description": "[[Vector Embeddings]] is linked in 3 pages but has no dedicated concept note.",
      "pagesInvolved": ["Concepts/RAG.md"],
      "suggestion": "Create Concepts/Vector-Embeddings.md",
      "severity": "medium"
    }
  ],
  "suggestedQuestions": [
    "How does pgvector perform under 100k+ chunks compared to Pinecone?"
  ]
}
`;
}
