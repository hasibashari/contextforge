import { runGoogleCalendarTests } from './google-calendar-mcp.spec';
import { runMcpRegistryTests } from './mcp-registry.spec';
import { runNotionAndObsidianTests } from './notion-obsidian-mcp.spec';
import { runAndroidBridgeTests } from './android-bridge-mcp.spec';
import { runPersonalMemoryTests } from './personal-memory.spec';

async function main() {
  console.log('🚀 Running ContextForge MCP & Memory Test Suites...');
  try {
    await runMcpRegistryTests();
    await runNotionAndObsidianTests();
    await runGoogleCalendarTests();
    await runAndroidBridgeTests();
    await runPersonalMemoryTests();
    console.log('✨ All test suites completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('💥 Test suite execution failed:', err);
    process.exit(1);
  }
}

void main();
