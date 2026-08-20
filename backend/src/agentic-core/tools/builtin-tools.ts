import type { FunctionDeclaration, Schema, Type } from '@google/genai';

const strProp = (description: string): Schema => ({
  type: 'STRING' as unknown as Type,
  description,
});

export const BUILTIN_FUNCTION_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: 'dispatch_obsidian_worker',
    description:
      'Delegates markdown note creation and formatting to the Obsidian Vault Worker side agent.',
    parameters: {
      type: 'OBJECT' as unknown as Type,
      properties: {
        title: strProp('Title of the markdown document'),
        path: strProp(
          'Relative vault file path, e.g. Vault/Work/Notes/system-architecture.md',
        ),
        content: strProp(
          'Complete formatted markdown content including frontmatter and sections',
        ),
      },
      required: ['title', 'path', 'content'],
    },
  },
  {
    name: 'dispatch_code_worker',
    description:
      'Delegates code creation, editing, and sandbox verification to the CLI & Code Sandbox Runner.',
    parameters: {
      type: 'OBJECT' as unknown as Type,
      properties: {
        filePath: strProp(
          'Target code file path, e.g. src/modules/auth/auth.service.ts',
        ),
        codeContent: strProp('Complete source code content'),
        summary: strProp('Summary of code changes and implementation points'),
      },
      required: ['filePath', 'codeContent', 'summary'],
    },
  },
  {
    name: 'dispatch_calendar_worker',
    description:
      'Schedules a calendar event or reminder in Google Calendar via Calendar & Workflow Worker.',
    parameters: {
      type: 'OBJECT' as unknown as Type,
      properties: {
        title: strProp('Event or meeting title'),
        eventDate: strProp(
          'Date in YYYY-MM-DD format (or relative like tomorrow)',
        ),
        eventTime: strProp('Time string e.g. 09:00 AM'),
        duration: strProp('Duration e.g. 30m, 45m, 1h'),
        category: strProp('Category: meeting | task | review | personal'),
      },
      required: ['title', 'eventDate', 'eventTime'],
    },
  },
  {
    name: 'dispatch_visual_worker',
    description:
      'Generates a visual design mockup or architecture diagram asset via GPU Side Agent.',
    parameters: {
      type: 'OBJECT' as unknown as Type,
      properties: {
        title: strProp('Title of the visual asset'),
        prompt: strProp('Detailed visual generation prompt'),
      },
      required: ['title', 'prompt'],
    },
  },
  {
    name: 'web_search',
    description:
      'Performs live web research and grounding to fetch up-to-date documentation and facts.',
    parameters: {
      type: 'OBJECT' as unknown as Type,
      properties: {
        query: strProp('Search query keywords'),
      },
      required: ['query'],
    },
  },
  {
    name: 'search_knowledge_vault',
    description:
      'Searches internal knowledge base, indexed documents, specifications, and notes for relevant technical context using semantic vector similarity.',
    parameters: {
      type: 'OBJECT' as unknown as Type,
      properties: {
        query: strProp(
          'Semantic search query or topic to look up in knowledge base',
        ),
      },
      required: ['query'],
    },
  },
];
