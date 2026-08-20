import React from 'react'
import {
  HardDrive,
  Mail,
  FileText,
  BookOpen,
  Calendar,
  Globe,
  GitPullRequest,
  Database,
  Cpu,
  TestTube2,
  ShieldAlert,
  Layers,
  Sparkles,
  UploadCloud,
  Terminal,
} from 'lucide-react'
import type { Integration, KnowledgeSource, Skill } from '@/shared/types/workspace'

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

export const IntegrationIconBox: React.FC<{
  integration?: Pick<Integration, 'id' | 'name'> | null
  size?: 'sm' | 'md' | 'lg'
}> = ({ integration, size = 'sm' }) => {
  const id = (integration?.id || '').toLowerCase()
  const name = (integration?.name || '').toLowerCase()
  const iconPx = size === 'sm' ? 17 : 19

  if (id.includes('drive') || name.includes('drive')) {
    return <IconBox size={size} variant="success" icon={<HardDrive size={iconPx} />} />
  }
  if (id.includes('gmail') || name.includes('gmail') || name.includes('mail')) {
    return <IconBox size={size} variant="error" icon={<Mail size={iconPx} />} />
  }
  if (id.includes('notion') || name.includes('notion')) {
    return <IconBox size={size} variant="neutral" icon={<FileText size={iconPx} />} />
  }
  if (id.includes('obsidian') || name.includes('obsidian')) {
    return <IconBox size={size} variant="purple" icon={<BookOpen size={iconPx} />} />
  }
  if (id.includes('calendar') || name.includes('calendar')) {
    return <IconBox size={size} variant="success" icon={<Calendar size={iconPx} />} />
  }
  if (
    id.includes('search') ||
    name.includes('search') ||
    name.includes('web') ||
    name.includes('tavily')
  ) {
    return <IconBox size={size} variant="blue" icon={<Globe size={iconPx} />} />
  }
  if (id.includes('github') || name.includes('git')) {
    return <IconBox size={size} variant="dark" icon={<GitPullRequest size={iconPx} />} />
  }
  if (
    id.includes('postgres') ||
    name.includes('database') ||
    name.includes('sql')
  ) {
    return <IconBox size={size} variant="cyan" icon={<Database size={iconPx} />} />
  }
  return <IconBox size={size} variant="primary" icon={<Cpu size={iconPx} />} />
}

export const SkillIconBox: React.FC<{
  category?: Skill['category'] | string
  size?: 'sm' | 'md' | 'lg'
}> = ({ category, size = 'sm' }) => {
  const iconPx = size === 'sm' ? 17 : 19

  switch (category) {
    case 'qa_testing':
      return <IconBox size={size} variant="primary" icon={<TestTube2 size={iconPx} />} />
    case 'security':
      return <IconBox size={size} variant="error" icon={<ShieldAlert size={iconPx} />} />
    case 'knowledge':
      return <IconBox size={size} variant="blue" icon={<BookOpen size={iconPx} />} />
    case 'database':
      return <IconBox size={size} variant="success" icon={<Database size={iconPx} />} />
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
  const iconPx = size === 'sm' ? 17 : 19

  switch (type) {
    case 'document_upload':
    case 'document':
      return <IconBox size={size} variant="primary" icon={<UploadCloud size={iconPx} />} />
    case 'obsidian_vault':
      return <IconBox size={size} variant="purple" icon={<BookOpen size={iconPx} />} />
    case 'local_folder':
      return <IconBox size={size} variant="success" icon={<HardDrive size={iconPx} />} />
    case 'github_repo':
      return <IconBox size={size} variant="dark" icon={<Terminal size={iconPx} />} />
    case 'database_schema':
      return <IconBox size={size} variant="success" icon={<Database size={iconPx} />} />
    case 'openapi_spec':
    case 'web_search':
      return <IconBox size={size} variant="cyan" icon={<Globe size={iconPx} />} />
    default:
      return <IconBox size={size} variant="primary" icon={<FileText size={iconPx} />} />
  }
}
