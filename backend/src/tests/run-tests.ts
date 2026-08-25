import { runGoogleCalendarTests } from './google-calendar-mcp.spec';
import { runMcpRegistryTests } from './mcp-registry.spec';
import { runNotionAndObsidianTests } from './notion-obsidian-mcp.spec';

async function main() {
  console.log('🚀 Running ContextForge MCP Test Suites...');
  try {
    await runMcpRegistryTests();
    await runNotionAndObsidianTests();
    await runGoogleCalendarTests();
    console.log('✨ All test suites completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('💥 Test suite execution failed:', err);
    process.exit(1);
  }
}

void main();
