import React from 'react'
import {
  HardDrive,
  FileText,
  BookOpen,
  Calendar,
  Globe,
  Database,
  Cpu,
  TestTube2,
  ShieldAlert,
  Sparkles,
  UploadCloud,
  Terminal,
  Layers,
  Brain,
  Compass,
} from 'lucide-react'
import {
  SiNotion,
  SiObsidian,
  SiGoogle,
  SiPostgresql,
  SiGithub,
  SiGoogledrive,
  SiGmail,
  SiAndroid,
} from 'react-icons/si'
import type { Integration, KnowledgeSource, Skill, Agent } from '@/shared/types/workspace'

export interface IconBoxProps {
  icon: React.ReactNode
  variant?:
    | 'primary'
    | 'purple'
    | 'success'
    | 'error'
    | 'blue'
    | 'cyan'
    | 'neutral'
    | 'dark'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const IconBox: React.FC<IconBoxProps> = ({
  icon,
  variant = 'primary',
  size = 'md',
  className = '',
}) => {
  const sizeClasses: Record<string, string> = {
    sm: 'w-8 h-8 rounded-lg',
    md: 'w-9 h-9 sm:w-10 sm:h-10 rounded-xl',
    lg: 'w-11 h-11 rounded-xl',
  }

  const variantClasses: Record<string, string> = {
    primary: 'bg-primary/10 border-primary/20 text-primary',
    purple: 'bg-[#7c3aed]/10 border-[#7c3aed]/20 text-[#7c3aed]',
    success:
      'bg-semantic-success/10 border-semantic-success/20 text-semantic-success',
    error: 'bg-semantic-error/10 border-semantic-error/20 text-semantic-error',
    blue: 'bg-[#3b82f6]/10 border-[#3b82f6]/20 text-[#3b82f6]',
    cyan: 'bg-[#06b6d4]/10 border-[#06b6d4]/20 text-[#06b6d4]',
    neutral: 'bg-canvas border-hairline text-ink',
    dark: 'bg-ink/10 border-hairline text-ink',
  }

  return (
    <div
      className={`${sizeClasses[size] || sizeClasses.md} ${
        variantClasses[variant] || variantClasses.primary
      } border flex items-center justify-center shadow-2xs shrink-0 ${className}`}
    >
      {icon}
    </div>
  )
}

// -------------------------------------------------------------
// Component Box Resolvers using react-icons/si & lucide-react
// -------------------------------------------------------------

export const IntegrationIconBox: React.FC<{
  integration?: Pick<Integration, 'id' | 'name'> | null
  size?: 'sm' | 'md' | 'lg'
}> = ({ integration, size = 'sm' }) => {
  const id = (integration?.id || '').toLowerCase()
  const name = (integration?.name || '').toLowerCase()
  const iconPx = size === 'sm' ? 17 : 20

  if (id.includes('android') || name.includes('android')) {
    return <IconBox size={size} variant="success" icon={<SiAndroid size={iconPx} />} />
  }
  if (id.includes('notion') || name.includes('notion')) {
    return <IconBox size={size} variant="neutral" icon={<SiNotion size={iconPx} />} />
  }
  if (id.includes('obsidian') || name.includes('obsidian')) {
    return <IconBox size={size} variant="purple" icon={<SiObsidian size={iconPx} />} />
  }
  if (id.includes('drive') || name.includes('drive')) {
    return <IconBox size={size} variant="success" icon={<SiGoogledrive size={iconPx} />} />
  }
  if (id.includes('gmail') || name.includes('gmail') || name.includes('mail')) {
    return <IconBox size={size} variant="error" icon={<SiGmail size={iconPx} />} />
  }
  if (id.includes('calendar') || name.includes('calendar')) {
    return <IconBox size={size} variant="success" icon={<Calendar size={iconPx} />} />
  }
  if (
    id.includes('search') ||
    id.includes('web') ||
    id.includes('google') ||
    name.includes('search') ||
    name.includes('web')
  ) {
    return <IconBox size={size} variant="blue" icon={<SiGoogle size={iconPx} />} />
  }
  if (id.includes('github') || name.includes('git')) {
    return <IconBox size={size} variant="dark" icon={<SiGithub size={iconPx} />} />
  }
  if (
    id.includes('postgres') ||
    name.includes('database') ||
    name.includes('sql')
  ) {
    return <IconBox size={size} variant="cyan" icon={<SiPostgresql size={iconPx} />} />
  }
  return <IconBox size={size} variant="primary" icon={<Cpu size={iconPx} />} />
}

export const SkillIconBox: React.FC<{
  category?: Skill['category'] | string
  skill?: Pick<Skill, 'id' | 'name' | 'category' | 'icon'> | null
  skillId?: string
  size?: 'sm' | 'md' | 'lg'
}> = ({ category, skill, skillId, size = 'sm' }) => {
  const id = (skill?.id || skillId || '').toLowerCase()
  const name = (skill?.name || '').toLowerCase()
  const iconPx = size === 'sm' ? 17 : 20

  if (id.includes('notion') || name.includes('notion')) {
    return <IconBox size={size} variant="neutral" icon={<SiNotion size={iconPx} />} />
  }
  if (id.includes('obsidian') || name.includes('obsidian')) {
    return <IconBox size={size} variant="purple" icon={<SiObsidian size={iconPx} />} />
  }
  if (
    id.includes('research') ||
    id.includes('web') ||
    name.includes('web') ||
    name.includes('research')
  ) {
    return <IconBox size={size} variant="blue" icon={<SiGoogle size={iconPx} />} />
  }
  if (
    id.includes('rfc') ||
    id.includes('architect') ||
    name.includes('rfc') ||
    name.includes('architect')
  ) {
    return <IconBox size={size} variant="purple" icon={<Layers size={iconPx} />} />
  }

  const effectiveCategory = category || skill?.category
  switch (effectiveCategory) {
    case 'qa_testing':
      return <IconBox size={size} variant="primary" icon={<TestTube2 size={iconPx} />} />
    case 'security':
      return <IconBox size={size} variant="error" icon={<ShieldAlert size={iconPx} />} />
    case 'knowledge':
      return <IconBox size={size} variant="blue" icon={<BookOpen size={iconPx} />} />
    case 'database':
    case 'productivity':
      return <IconBox size={size} variant="neutral" icon={<SiNotion size={iconPx} />} />
    case 'architecture':
      return <IconBox size={size} variant="purple" icon={<Layers size={iconPx} />} />
    default:
      return <IconBox size={size} variant="primary" icon={<Sparkles size={iconPx} />} />
  }
}

export const KnowledgeIconBox: React.FC<{
  type?: KnowledgeSource['type'] | string
  size?: 'sm' | 'md' | 'lg'
}> = ({ type, size = 'sm' }) => {
  const iconPx = size === 'sm' ? 17 : 20

  if (type === 'obsidian_vault' || (type && type.includes('obsidian'))) {
    return <IconBox size={size} variant="purple" icon={<SiObsidian size={iconPx} />} />
  }
  if (type === 'notion' || type === 'notion_database' || (type && type.includes('notion'))) {
    return <IconBox size={size} variant="neutral" icon={<SiNotion size={iconPx} />} />
  }
  if (type === 'web_search') {
    return <IconBox size={size} variant="blue" icon={<SiGoogle size={iconPx} />} />
  }

  switch (type) {
    case 'document_upload':
    case 'document':
      return <IconBox size={size} variant="primary" icon={<UploadCloud size={iconPx} />} />
    case 'local_folder':
      return <IconBox size={size} variant="success" icon={<HardDrive size={iconPx} />} />
    case 'github_repo':
      return <IconBox size={size} variant="dark" icon={<Terminal size={iconPx} />} />
    case 'database_schema':
      return <IconBox size={size} variant="success" icon={<Database size={iconPx} />} />
    case 'openapi_spec':
      return <IconBox size={size} variant="cyan" icon={<Globe size={iconPx} />} />
    default:
      return <IconBox size={size} variant="primary" icon={<FileText size={iconPx} />} />
  }
}

export const AgentIconBox: React.FC<{
  agent?: Pick<Agent, 'id' | 'name' | 'agentType' | 'avatarColor'> | null
  agentId?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}> = ({ agent, agentId, size = 'sm', className = '' }) => {
  const id = (agent?.id || agentId || '').toLowerCase()
  const name = (agent?.name || '').toLowerCase()
  const agentType = agent?.agentType
  const iconPx = size === 'sm' ? 17 : size === 'md' ? 19 : 22

  if (
    id.includes('research') ||
    name.includes('research') ||
    agentType === 'researcher'
  ) {
    return (
      <IconBox
        size={size}
        variant="blue"
        icon={<Compass size={iconPx} />}
        className={className}
      />
    )
  }

  return (
    <IconBox
      size={size}
      variant="primary"
      icon={<Brain size={iconPx} />}
      className={className}
    />
  )
}
