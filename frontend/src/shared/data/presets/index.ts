import type { Agent, Skill, Integration, AutomationWorkflow } from '@/shared/types/workspace'
import rawAgents from './agents.json'
import rawSkills from './skills.json'
import rawIntegrations from './integrations.json'
import rawAutomations from './automations.json'

export const PRESET_AGENTS: Agent[] = rawAgents as Agent[]
export const PRESET_SKILLS: Skill[] = rawSkills as Skill[]
export const PRESET_INTEGRATIONS: Integration[] = rawIntegrations as Integration[]
export const PRESET_AUTOMATIONS: AutomationWorkflow[] = rawAutomations as AutomationWorkflow[]
