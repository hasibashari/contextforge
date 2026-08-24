import { NotionRawObject, NotionBlock, NotionRichText } from './notion.types';

/**
 * Tokenizes raw inline markdown into Notion rich_text objects with annotations.
 */
export function parseMarkdownToRichText(
  rawText: string,
): Array<Record<string, unknown>> {
  if (!rawText) return [];

  // Match inline markdown tokens:
  // 1: [label](url) -> label: 2, url: 3
  // 4: ***bold italic*** -> text: 5
  // 6: **bold** -> text: 7
  // 8: *italic* -> text: 9
  // 10: __bold__ -> text: 11
  // 12: _italic_ -> text: 13
  // 14: ~~strikethrough~~ -> text: 15
  // 16: `inline code` -> code: 17
  const inlineRegex =
    /(\[([^\]]+)\]\((https?:\/\/[^\s)]+)\))|(\*\*\*(.+?)\*\*\*)|(\*\*(.+?)\*\*)|(\*([^*\n]+)\*)|(__(.+?)__)|(_([^_\n]+)_)|(~~(.+?)~~)|(`([^`]+)`)/g;

  const items: Array<Record<string, unknown>> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  const pushChunk = (
    content: string,
    annotations: {
      bold?: boolean;
      italic?: boolean;
      strikethrough?: boolean;
      underline?: boolean;
      code?: boolean;
    } = {},
    url?: string | null,
  ) => {
    if (!content) return;
    const MAX_CHUNK = 1900;
    for (let i = 0; i < content.length; i += MAX_CHUNK) {
      const slice = content.slice(i, i + MAX_CHUNK);
      items.push({
        type: 'text',
        text: {
          content: slice,
          link: url ? { url } : null,
        },
        annotations: {
          bold: Boolean(annotations.bold),
          italic: Boolean(annotations.italic),
          strikethrough: Boolean(annotations.strikethrough),
          underline: Boolean(annotations.underline),
          code: Boolean(annotations.code),
          color: 'default',
        },
      });
    }
  };

  while ((match = inlineRegex.exec(rawText)) !== null) {
    if (match.index > lastIndex) {
      pushChunk(rawText.slice(lastIndex, match.index));
    }

    if (match[1]) {
      // [label](url)
      pushChunk(match[2], {}, match[3]);
    } else if (match[4]) {
      // ***bold italic***
      pushChunk(match[5], { bold: true, italic: true });
    } else if (match[6]) {
      // **bold**
      pushChunk(match[7], { bold: true });
    } else if (match[8]) {
      // *italic*
      pushChunk(match[9], { italic: true });
    } else if (match[10]) {
      // __bold__
      pushChunk(match[11], { bold: true });
    } else if (match[12]) {
      // _italic_
      pushChunk(match[13], { italic: true });
    } else if (match[14]) {
      // ~~strikethrough~~
      pushChunk(match[15], { strikethrough: true });
    } else if (match[16]) {
      // `code`
      pushChunk(match[17], { code: true });
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < rawText.length) {
    pushChunk(rawText.slice(lastIndex));
  }

  return items.length > 0
    ? items
    : [{ type: 'text', text: { content: rawText }, annotations: {} }];
}

/**
 * Splits plain title/heading string into Notion rich_text format
 */
export function splitIntoRichText(
  text: string,
): Array<Record<string, unknown>> {
  return parseMarkdownToRichText(text);
}

/**
 * Transforms Markdown text into structured Notion Block AST objects
 */
export function convertMarkdownToBlocks(
  markdown: string,
): Array<Record<string, unknown>> {
  if (!markdown || !markdown.trim()) return [];

  const rawLines = markdown.split(/\r?\n/);
  const blocks: Array<Record<string, unknown>> = [];
  let inCodeBlock = false;
  let codeLanguage = 'plain text';
  let codeContent: string[] = [];

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const trimmed = line.trim();

    // Code block start/end
    if (trimmed.startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeLanguage = trimmed.slice(3).trim() || 'plain text';
        codeContent = [];
      } else {
        inCodeBlock = false;
        const fullCode = codeContent.join('\n');
        blocks.push({
          object: 'block',
          type: 'code',
          code: {
            language:
              codeLanguage.toLowerCase().replace(/[^a-z0-9_]/g, '') ||
              'plain text',
            rich_text: [
              {
                type: 'text',
                text: { content: fullCode.slice(0, 1900) },
              },
            ],
          },
        });
      }
      continue;
    }

    if (inCodeBlock) {
      codeContent.push(line);
      continue;
    }

    if (!trimmed) {
      continue;
    }

    // Divider
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      blocks.push({
        object: 'block',
        type: 'divider',
        divider: {},
      });
      continue;
    }

    // Headings
    if (line.startsWith('# ')) {
      blocks.push({
        object: 'block',
        type: 'heading_1',
        heading_1: {
          rich_text: parseMarkdownToRichText(line.slice(2).trim()),
        },
      });
      continue;
    }

    if (line.startsWith('## ')) {
      blocks.push({
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: parseMarkdownToRichText(line.slice(3).trim()),
        },
      });
      continue;
    }

    if (line.startsWith('### ')) {
      blocks.push({
        object: 'block',
        type: 'heading_3',
        heading_3: {
          rich_text: parseMarkdownToRichText(line.slice(4).trim()),
        },
      });
      continue;
    }

    // Callouts & Quotes
    if (
      line.startsWith('> [!NOTE]') ||
      line.startsWith('> [!TIP]') ||
      line.startsWith('> [!IMPORTANT]') ||
      line.startsWith('> [!WARNING]')
    ) {
      let iconEmoji = '💡';
      if (line.startsWith('> [!TIP]')) iconEmoji = '✨';
      if (line.startsWith('> [!IMPORTANT]')) iconEmoji = '📌';
      if (line.startsWith('> [!WARNING]')) iconEmoji = '⚠️';

      const cleanCallout = line.replace(/^>\s*\[![A-Z]+\]\s*/i, '').trim();
      blocks.push({
        object: 'block',
        type: 'callout',
        callout: {
          icon: { type: 'emoji', emoji: iconEmoji },
          rich_text: parseMarkdownToRichText(cleanCallout || 'Catatan'),
        },
      });
      continue;
    }

    if (line.startsWith('> ')) {
      blocks.push({
        object: 'block',
        type: 'quote',
        quote: {
          rich_text: parseMarkdownToRichText(line.slice(2).trim()),
        },
      });
      continue;
    }

    // To-do list item
    const todoMatch = line.match(/^[-*]\s+\[([ xX])\]\s+(.+)$/);
    if (todoMatch) {
      blocks.push({
        object: 'block',
        type: 'to_do',
        to_do: {
          checked: todoMatch[1].toLowerCase() === 'x',
          rich_text: parseMarkdownToRichText(todoMatch[2].trim()),
        },
      });
      continue;
    }

    // Bulleted list item
    if (line.match(/^[-*+]\s+(.+)$/)) {
      const bulletText = line.replace(/^[-*+]\s+/, '').trim();
      blocks.push({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: parseMarkdownToRichText(bulletText),
        },
      });
      continue;
    }

    // Numbered list item
    const numMatch = line.match(/^\d+\.\s+(.+)$/);
    if (numMatch) {
      blocks.push({
        object: 'block',
        type: 'numbered_list_item',
        numbered_list_item: {
          rich_text: parseMarkdownToRichText(numMatch[1].trim()),
        },
      });
      continue;
    }

    // Default paragraph block
    blocks.push({
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: parseMarkdownToRichText(trimmed),
      },
    });
  }

  return blocks;
}

/**
 * Reconstructs standard Markdown text from an array of Notion Block AST objects
 */
export function convertBlocksToMarkdown(blocks: NotionBlock[]): string {
  const lines: string[] = [];

  const formatRichTextItem = (t: NotionRichText): string => {
    let text = t.plain_text || t.text?.content || '';
    if (!text) return '';
    if (t.annotations?.code) text = `\`${text}\``;
    if (t.annotations?.bold && t.annotations?.italic) text = `***${text}***`;
    else if (t.annotations?.bold) text = `**${text}**`;
    else if (t.annotations?.italic) text = `*${text}*`;
    if (t.annotations?.strikethrough) text = `~~${text}~~`;
    if (t.text?.link?.url) text = `[${text}](${t.text.link.url})`;
    return text;
  };

  const extractFormattedText = (richTextArr?: NotionRichText[]): string => {
    if (!richTextArr || !Array.isArray(richTextArr)) return '';
    return richTextArr.map(formatRichTextItem).join('');
  };

  for (const block of blocks) {
    const type = block.type;
    const data = block[type] as
      { rich_text?: NotionRichText[]; checked?: boolean } | undefined;
    const text = extractFormattedText(data?.rich_text);

    switch (type) {
      case 'heading_1':
        lines.push(`# ${text}\n`);
        break;
      case 'heading_2':
        lines.push(`## ${text}\n`);
        break;
      case 'heading_3':
        lines.push(`### ${text}\n`);
        break;
      case 'bulleted_list_item':
        lines.push(`- ${text}`);
        break;
      case 'numbered_list_item':
        lines.push(`1. ${text}`);
        break;
      case 'to_do':
        lines.push(`- [${data?.checked ? 'x' : ' '}] ${text}`);
        break;
      case 'callout':
        lines.push(`> [!NOTE]\n> ${text}\n`);
        break;
      case 'quote':
        lines.push(`> ${text}\n`);
        break;
      case 'code':
        lines.push(`\`\`\`\n${text}\n\`\`\`\n`);
        break;
      case 'divider':
        lines.push(`---\n`);
        break;
      case 'paragraph':
      default:
        if (text.trim()) lines.push(`${text}\n`);
        break;
    }
  }

  return lines.join('\n').trim() || '*(Halaman kosong)*';
}

/**
 * Extracts title string from Notion raw page/database object properties
 */
export function extractTitle(obj: NotionRawObject): string {
  if (obj.title && Array.isArray(obj.title) && obj.title.length > 0) {
    const text = obj.title
      .map((t) => t.plain_text || '')
      .filter(Boolean)
      .join('');
    if (text) return text;
  }

  if (obj.properties && typeof obj.properties === 'object') {
    for (const key of Object.keys(obj.properties)) {
      const prop = obj.properties[key];
      if (prop && typeof prop === 'object') {
        if (
          prop.type === 'title' &&
          'title' in prop &&
          Array.isArray(prop.title)
        ) {
          const text = prop.title
            .map((t: NotionRichText) => t.plain_text || '')
            .filter(Boolean)
            .join('');
          if (text) return text;
        }
        if (
          prop.type === 'rich_text' &&
          key.toLowerCase().includes('name') &&
          'rich_text' in prop &&
          Array.isArray(prop.rich_text)
        ) {
          const text = prop.rich_text
            .map((t: NotionRichText) => t.plain_text || '')
            .filter(Boolean)
            .join('');
          if (text) return text;
        }
      }
    }
  }

  return 'Untitled Page';
}

/**
 * Extracts status property name from Notion database item properties
 */
export function extractStatus(obj: NotionRawObject): string {
  if (obj.properties && typeof obj.properties === 'object') {
    for (const key of Object.keys(obj.properties)) {
      const prop = obj.properties[key];
      if (prop && typeof prop === 'object') {
        if (
          prop.type === 'status' &&
          'status' in prop &&
          prop.status &&
          typeof prop.status === 'object' &&
          'name' in prop.status &&
          typeof prop.status.name === 'string'
        ) {
          return prop.status.name;
        }
        if (
          prop.type === 'select' &&
          'select' in prop &&
          prop.select &&
          typeof prop.select === 'object' &&
          'name' in prop.select &&
          typeof prop.select.name === 'string'
        ) {
          return prop.select.name;
        }
      }
    }
  }
  return 'Active';
}
