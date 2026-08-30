/**
 * Type definitions & DTOs for Android MCP Bridge & Digital Wellbeing
 */

export interface AndroidDevicePingResponse {
  status: string;
  device?: string;
  message?: string;
}

export interface AndroidAppUsageItem {
  packageName: string;
  totalTimeInForegroundMs: number;
  lastTimeUsed: number;
  formattedDuration?: string;
}

export interface AndroidDailyUsageBreakdown {
  date: string;
  totalScreenTimeMs: number;
  formattedTotalScreenTime?: string;
  apps: AndroidAppUsageItem[];
  mostUsedApp?: string;
}

export interface AndroidUsageSummaryResponse {
  date: string;
  totalScreenTimeMs: number;
  formattedTotalScreenTime?: string;
  apps: AndroidAppUsageItem[];
  mostUsedApp: string;
  daysCount?: number;
  averageDailyScreenTimeMs?: number;
  formattedAverageDailyScreenTime?: string;
  dailyBreakdown?: AndroidDailyUsageBreakdown[];
}

export interface AndroidForegroundAppResponse {
  currentForegroundApp: string;
  friendlyName?: string;
}

export interface AndroidSetAppLimitRequest {
  packageName: string;
  maxDailyMinutes: number;
}

export interface AndroidSetAppLimitResponse {
  status: 'success' | 'error';
  message: string;
}

export interface AndroidBlockAppRequest {
  packageName: string;
  block: boolean;
}

export interface AndroidBlockAppResponse {
  status: 'success' | 'error';
  message: string;
}

export interface AndroidAppRestrictionItem {
  packageName: string;
  maxDailyMinutes: number;
  isBlocked: boolean;
}

export interface AndroidActiveRestrictionsResponse {
  limits: AndroidAppRestrictionItem[];
  blockedApps: string[];
}

export interface AndroidSetDndRequest {
  enable: boolean;
}

export interface AndroidSetDndResponse {
  status: 'success' | 'error';
  message?: string;
}

export interface AndroidSendNotificationRequest {
  title: string;
  message: string;
}

export interface AndroidSendNotificationResponse {
  status: 'success' | 'error';
  message?: string;
}

export interface AndroidBridgeConfig {
  endpoint: string;
  authToken?: string;
  apiKey?: string;
  deviceName?: string;
}

// ─── NEW TYPES (8 additional tools) ─────────────────────────────────────────

export interface AndroidUnblockAppRequest {
  packageName: string;
}

export interface AndroidUnblockAppResponse {
  status: 'success' | 'error';
  message?: string;
}

export interface AndroidResetAllRestrictionsResponse {
  status: 'success' | 'error';
  message?: string;
}

export interface AndroidScreenTimeStatusResponse {
  totalScreenTimeMs: number;
  formattedTotalScreenTime: string;
  dailyLimitMs: number | null;
  formattedDailyLimit: string | null;
  isLimitExceeded: boolean;
  bedtimeCurfewActive: boolean;
  bedtimeSchedule: {
    enabled: boolean;
    startTime: string | null;
    endTime: string | null;
  } | null;
  activeRestrictionsCount: number;
}

export interface AndroidSetBedtimeScheduleRequest {
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  enabled: boolean;
}

export interface AndroidSetBedtimeScheduleResponse {
  status: 'success' | 'error';
  message?: string;
}

export interface AndroidSetTotalScreenTimeLimitRequest {
  maxDailyMinutes: number;
}

export interface AndroidSetTotalScreenTimeLimitResponse {
  status: 'success' | 'error';
  message?: string;
}

export interface AndroidBedtimeConfigResponse {
  bedtimeSchedule: {
    enabled: boolean;
    startTime: string | null;
    endTime: string | null;
  };
  totalDailyLimitMinutes: number | null;
  formattedDailyLimit: string | null;
}

export interface AndroidTriggerBedtimeLockRequest {
  message?: string;
}

export interface AndroidTriggerBedtimeLockResponse {
  status: 'success' | 'error';
  message?: string;
}

export type AndroidAgentMessageStyle = 'heads_up' | 'companion_modal';

export interface AndroidSendAgentMessageRequest {
  style: AndroidAgentMessageStyle;
  title: string;
  message: string;
  allowExtension?: boolean;
  extensionMinutes?: number;
}

export interface AndroidSendAgentMessageResponse {
  status: 'success' | 'error';
  message?: string;
  userAction?: 'dismissed' | 'extended' | 'acknowledged';
}
