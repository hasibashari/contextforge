export interface NotionRichText {
  type?: 'text' | 'mention' | 'equation';
  plain_text?: string;
  text?: {
    content: string;
    link?: { url: string } | null;
  };
  annotations?: {
    bold?: boolean;
    italic?: boolean;
    strikethrough?: boolean;
    underline?: boolean;
    code?: boolean;
    color?: string;
  };
}

export interface NotionPropertyTitle {
  type: 'title';
  title?: NotionRichText[];
}

export interface NotionPropertyRichText {
  type: 'rich_text';
  rich_text?: NotionRichText[];
}

export interface NotionPropertyStatus {
  type: 'status';
  status?: { name?: string };
}

export interface NotionPropertySelect {
  type: 'select';
  select?: { name?: string };
}

export type NotionProperty =
  | NotionPropertyTitle
  | NotionPropertyRichText
  | NotionPropertyStatus
  | NotionPropertySelect
  | { type: string; [key: string]: unknown };

export interface NotionRawObject {
  id: string;
  object: 'page' | 'database';
  url: string;
  created_time: string;
  last_edited_time: string;
  parent?: {
    type: string;
    database_id?: string;
    page_id?: string;
    workspace?: boolean;
  };
  properties?: Record<string, NotionProperty>;
  title?: NotionRichText[];
  icon?: { type: string; emoji?: string };
  archived?: boolean;
  in_trash?: boolean;
}

export interface NotionBlock {
  id?: string;
  type: string;
  [key: string]: unknown;
}
