import * as fs from 'fs';
import * as path from 'path';

export interface ParsedSkill {
  id: string;
  name: string;
  description: string;
  category:
    | 'architecture'
    | 'qa_testing'
    | 'security'
    | 'knowledge'
    | 'database'
    | 'productivity'
    | 'engineering';
  icon: string;
  sopSummary: string;
  instructions: string;
  assignedTools: string[];
  enabled: boolean;
  isCustom: boolean;
}

/**
 * Parses markdown files with YAML frontmatter from docs/SKILL/
 */
export function loadSkillsFromDocs(): ParsedSkill[] {
  // Path to docs/SKILL
  const docsSkillPath = path.resolve(__dirname, '../../../../docs/SKILL');
  if (!fs.existsSync(docsSkillPath)) {
    console.warn(`[SkillLoader] Path not found: ${docsSkillPath}`);
    return [];
  }

  const entries = fs.readdirSync(docsSkillPath, { withFileTypes: true });
  const skills: ParsedSkill[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const skillId = `skill-${entry.name}`;
    const skillFilePath = path.join(docsSkillPath, entry.name, 'SKILL.md');

    if (!fs.existsSync(skillFilePath)) continue;

    const rawContent = fs.readFileSync(skillFilePath, 'utf8');
    const parsed = parseSkillMarkdown(rawContent, skillId, entry.name);
    if (parsed) {
      skills.push(parsed);
    }
  }

  return skills;
}

function parseSkillMarkdown(
  content: string,
  id: string,
  folderName: string,
): ParsedSkill | null {
  const frontmatterMatch = content.match(
    /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/,
  );

  let name = folderName.replace(/-/g, ' ');
  let description = '';
  let category: ParsedSkill['category'] = 'knowledge';
  let icon = 'book-open';
  const assignedTools: string[] = [];

  let body = content;

  if (frontmatterMatch) {
    const yamlBlock = frontmatterMatch[1];
    body = frontmatterMatch[2].trim();

    // Simple line-by-line YAML parser
    const lines = yamlBlock.split('\n');
    let currentKey = '';

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;

      if (line.startsWith('- ') && currentKey === 'assignedTools') {
        assignedTools.push(
          line
            .replace(/^- \s*/, '')
            .replace(/['"]/g, '')
            .trim(),
        );
        continue;
      }

      const colonIndex = line.indexOf(':');
      if (colonIndex !== -1) {
        const key = line.slice(0, colonIndex).trim();
        const value = line
          .slice(colonIndex + 1)
          .trim()
          .replace(/^['"]|['"]$/g, '');
        currentKey = key;

        if (key === 'name' && value) name = value;
        if (key === 'description' && value) description = value;
        if (key === 'category' && value)
          category = value as ParsedSkill['category'];
        if (key === 'icon' && value) icon = value;
      }
    }
  }

  // Parse Instructions section
  let instructions = '';
  const instructionsMatch = body.match(
    /## Instructions\r?\n([\s\S]*?)(?=\r?\n## Examples|$)/i,
  );
  if (instructionsMatch) {
    instructions = instructionsMatch[1].trim();
  } else {
    instructions = body;
  }

  // Extract a brief SOP Summary from description or first instruction paragraph
  const sopSummary =
    description || 'Standard Operating Procedure and reasoning playbook.';

  return {
    id,
    name,
    description,
    category,
    icon,
    sopSummary,
    instructions,
    assignedTools,
    enabled: true,
    isCustom: false,
  };
}

/**
 * Synchronizes parsed docs/SKILL into seeds/skills.json
 */
export function syncSkillsToJsonFiles(skills: ParsedSkill[]) {
  const backendSeedPath = path.resolve(
    __dirname,
    '../../../database/seeds/skills.json',
  );
  const frontendPresetPath = path.resolve(
    __dirname,
    '../../../../frontend/src/shared/data/presets/skills.json',
  );

  const jsonContent = JSON.stringify(skills, null, 2);

  fs.writeFileSync(backendSeedPath, jsonContent, 'utf8');
  console.log(`   ✓ Synced ${skills.length} skills to ${backendSeedPath}`);

  if (fs.existsSync(path.dirname(frontendPresetPath))) {
    fs.writeFileSync(frontendPresetPath, jsonContent, 'utf8');
    console.log(`   ✓ Synced ${skills.length} skills to ${frontendPresetPath}`);
  }
}
