import type { Integration } from '@/shared/types/workspace'

export interface AndroidBridgeConnectModalProps {
  integration: Integration
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export interface AndroidBridgeDashboardModalProps {
  integration: Integration
  isOpen: boolean
  onClose: () => void
}

export interface PairingSessionData {
  sessionId: string
  pinCode: string
  formattedPin: string
  createdAt: number
  expiresAt: number
  status: 'waiting' | 'confirmed' | 'expired'
  desktopHost: string
  desktopPort: number
  confirmUrl: string
  wsUrl?: string
  qrPayloadJson: string
}

export interface AppUsageItem {
  packageName: string
  totalTimeInForegroundMs: number
  lastTimeUsed?: number
  formattedDuration?: string
  friendlyName?: string
}

export interface UsageSummaryData {
  date: string
  totalScreenTimeMs: number
  formattedTotalScreenTime: string
  mostUsedApp?: string
  mostUsedAppName?: string
  appsCount: number
  apps: AppUsageItem[]
}

export interface ActiveRestrictionsData {
  limits: Array<{
    packageName: string
    maxDailyMinutes: number
    isBlocked?: boolean
  }>
  blockedApps: string[]
}

export interface PopularAppItem {
  name: string
  pkg: string
}

export const POPULAR_APPS: PopularAppItem[] = [
  { name: 'Instagram', pkg: 'com.instagram.android' },
  { name: 'YouTube', pkg: 'com.google.android.youtube' },
  { name: 'TikTok', pkg: 'com.zhiliaoapp.musically' },
  { name: 'WhatsApp', pkg: 'com.whatsapp' },
  { name: 'Twitter / X', pkg: 'com.twitter.android' },
  { name: 'Reddit', pkg: 'com.reddit.frontpage' },
  { name: 'Netflix', pkg: 'com.netflix.mediaclient' },
]
