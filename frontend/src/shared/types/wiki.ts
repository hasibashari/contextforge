export type WikiCategory =
  | 'index'
  | 'log'
  | 'concept'
  | 'entity'
  | 'synthesis'
  | 'overview';

export interface WikiPageFrontmatter {
  title?: string;
  category?: WikiCategory;
  tags?: string[];
  status?: string;
  sourceCount?: number;
  sources?: string[];
  aliases?: string[];
  lastUpdated?: string;
  [key: string]: unknown;
}

export interface WikiPage {
  id: string;
  slug: string;
  title: string;
  category: WikiCategory;
  path: string;
  content: string;
  frontmatter: WikiPageFrontmatter;
  backlinks: string[];
  outlinks: string[];
  wordCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface WikiGraphNode {
  id: string;
  label: string;
  category: WikiCategory;
  path: string;
  val: number; // size relative to backlinks / connections
  group: number;
}

export interface WikiGraphLink {
  source: string;
  target: string;
  value: number;
}

export interface WikiGraphData {
  nodes: WikiGraphNode[];
  links: WikiGraphLink[];
}

export interface WikiLintIssue {
  type: 'contradiction' | 'orphan' | 'broken_link' | 'stale_claim' | 'missing_concept';
  title: string;
  description: string;
  pagesInvolved: string[];
  suggestion: string;
  severity: 'low' | 'medium' | 'high';
}

export interface WikiLintReport {
  timestamp: string;
  healthScore: number; // 0 - 100
  totalPages: number;
  totalConnections: number;
  issues: WikiLintIssue[];
  suggestedQuestions: string[];
}

export interface WikiIngestRequest {
  sourceId?: string;
  sourceTitle: string;
  content: string;
  tags?: string[];
}

export interface WikiIngestResult {
  success: boolean;
  sourceTitle: string;
  pagesCreated: string[];
  pagesUpdated: string[];
  logEntry: string;
  summary: string;
}
