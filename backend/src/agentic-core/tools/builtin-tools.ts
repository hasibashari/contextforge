import type { FunctionDeclaration, Schema, Type } from '@google/genai';

const strProp = (description: string): Schema => ({
  type: 'STRING' as unknown as Type,
  description,
});

export const BUILTIN_FUNCTION_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: 'dispatch_action_worker',
    description:
      'Delegates markdown note creation, formatting, and file synchronization to the Action Agent (supports local Obsidian Vaults and Notion workspaces).',
    parameters: {
      type: 'OBJECT' as unknown as Type,
      properties: {
        title: strProp('Title of the markdown document'),
        target: strProp(
          'Target workspace destination: "obsidian" (default) or "notion"',
        ),
        path: strProp(
          'Relative vault file path, e.g. Vault/Work/Notes/system-architecture.md',
        ),
        content: strProp(
          'Complete formatted markdown content including YAML frontmatter, headers, and bi-directional [[backlinks]]',
        ),
      },
      required: ['title', 'content'],
    },
  },
  {
    name: 'web_search',
    description:
      'Performs live web research and factual grounding via the Research Agent to fetch up-to-date documentation and technical facts.',
    parameters: {
      type: 'OBJECT' as unknown as Type,
      properties: {
        query: strProp('Search query keywords or research topic'),
      },
      required: ['query'],
    },
  },
  {
    name: 'search_knowledge_vault',
    description:
      'Searches internal knowledge base, indexed documents, specifications, and notes via the Research Agent using semantic vector similarity (pgvector RAG).',
    parameters: {
      type: 'OBJECT' as unknown as Type,
      properties: {
        query: strProp(
          'Semantic search query or topic to look up in internal knowledge base',
        ),
      },
      required: ['query'],
    },
  },
];
