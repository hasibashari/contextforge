import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getRoot() {
    return {
      name: 'ContextForge AI Agentic Platform API',
      version: '1.0.0',
      status: 'online',
      engine: 'Google Gemini 3.5 Flash',
      database: 'PostgreSQL Native (pg.Pool)',
      endpoints: {
        chatSessions: '/api/chat/sessions',
        artifacts: '/api/artifacts',
        personalHubMemories: '/api/personal-hub/memories',
        knowledgeSources: '/api/knowledge/sources',
        ecosystemAgents: '/api/ecosystem/agents',
        ecosystemSkills: '/api/ecosystem/skills',
        activityLogs: '/api/activity/logs',
        automations: '/api/automations',
        automationRuns: '/api/automations/runs',
      },
      frontendApp: 'http://localhost:5173',
      timestamp: new Date().toISOString(),
    };
  }
}
