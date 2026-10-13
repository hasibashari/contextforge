import { Injectable, Logger } from '@nestjs/common';
import { ISubAgent, SubAgentId, SubAgentPersonaConfig } from './subagent.types';
import { SecondBrainSubAgent } from './personas/second-brain.subagent';
import { ExecutiveSchedulerSubAgent } from './personas/executive-scheduler.subagent';
import { ResearchSpecialistSubAgent } from './personas/research-specialist.subagent';

@Injectable()
export class SubAgentRegistryService {
  private readonly logger = new Logger(SubAgentRegistryService.name);
  private readonly subAgents = new Map<SubAgentId, ISubAgent>();

  constructor(
    secondBrain: SecondBrainSubAgent,
    executiveScheduler: ExecutiveSchedulerSubAgent,
    researchSpecialist: ResearchSpecialistSubAgent,
  ) {
    this.register(secondBrain);
    this.register(executiveScheduler);
    this.register(researchSpecialist);
    // Alias agent-research to the research specialist
    this.subAgents.set('agent-research', researchSpecialist);
  }

  public register(subAgent: ISubAgent): void {
    this.subAgents.set(subAgent.id, subAgent);
    this.logger.log(
      `🤖 Registered Sub-Agent Persona: [${subAgent.id}] ${subAgent.name}`,
    );
  }

  public getSubAgent(id: SubAgentId): ISubAgent | undefined {
    return this.subAgents.get(id);
  }

  public getAllSubAgents(): ISubAgent[] {
    // Unique list of subagents
    return Array.from(new Set(this.subAgents.values()));
  }

  public listPersonas(): SubAgentPersonaConfig[] {
    return this.getAllSubAgents().map((sa) => sa.getPersonaConfig());
  }

  /**
   * Fast rule-based + keyword heuristic router to auto-assign a specialized sub-agent
   */
  public routePromptToSubAgent(prompt: string): ISubAgent | undefined {
    const p = prompt.toLowerCase();

    // 2. Second Brain / Obsidian / Zettelkasten notes
    if (
      p.includes('obsidian') ||
      p.includes('vault') ||
      p.includes('catatan') ||
      p.includes('note') ||
      p.includes('zettelkasten') ||
      p.includes('wikilink')
    ) {
      return this.subAgents.get('second_brain');
    }

    // 3. Executive / Calendar / Notion / Schedule
    if (
      p.includes('calendar') ||
      p.includes('kalender') ||
      p.includes('jadwal') ||
      p.includes('meeting') ||
      p.includes('notion') ||
      p.includes('sprint') ||
      p.includes('target') ||
      p.includes('goal')
    ) {
      return this.subAgents.get('executive_scheduler');
    }

    // 4. Web Search / Research / Fact-checking / Live Grounding
    if (
      p.includes('search') ||
      p.includes('cari') ||
      p.includes('googling') ||
      p.includes('google') ||
      p.includes('riset') ||
      p.includes('research') ||
      p.includes('berita') ||
      p.includes('fakta') ||
      p.includes('referensi') ||
      p.includes('jurnal') ||
      p.includes('paper') ||
      p.includes('terbaru') ||
      p.includes('latest')
    ) {
      return this.subAgents.get('research_specialist');
    }

    return undefined;
  }
}
