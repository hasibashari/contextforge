import { runGoogleCalendarTests } from './google-calendar-mcp.spec';
import { runMcpRegistryTests } from './mcp-registry.spec';
import { runNotionAndObsidianTests } from './notion-obsidian-mcp.spec';
import { runAndroidBridgeTests } from './android-bridge-mcp.spec';
import { runPersonalMemoryTests } from './personal-memory.spec';
import { runAgentEnhancementTests } from './agent-enhancements.spec';
import { runAutomationTests } from './automation-engine.spec';
import { runGoalsTests } from './goals-engine.spec';
import { runMultilingualOrchestrationTests } from './multilingual-orchestration.spec';

async function main() {
  console.log('🚀 Running ContextForge MCP, Memory & Agent Test Suites...');
  try {
    await runMcpRegistryTests();
    await runNotionAndObsidianTests();
    await runGoogleCalendarTests();
    await runAndroidBridgeTests();
    await runPersonalMemoryTests();
    await runAgentEnhancementTests();
    await runAutomationTests();
    await runGoalsTests();
    await runMultilingualOrchestrationTests();
    console.log('✨ All test suites completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('💥 Test suite execution failed:', err);
    process.exit(1);
  }
}

void main();
