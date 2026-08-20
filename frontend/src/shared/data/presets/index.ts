import type { Agent, Skill, Integration } from '@/shared/types/workspace'
import rawAgents from './agents.json'
import rawSkills from './skills.json'
import rawIntegrations from './integrations.json'

export const PRESET_AGENTS: Agent[] = rawAgents as Agent[]
export const PRESET_SKILLS: Skill[] = rawSkills as Skill[]
export const PRESET_INTEGRATIONS: Integration[] = rawIntegrations as Integration[]
