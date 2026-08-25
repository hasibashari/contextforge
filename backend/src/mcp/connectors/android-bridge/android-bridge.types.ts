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

export interface AndroidUsageSummaryResponse {
  date: string;
  totalScreenTimeMs: number;
  formattedTotalScreenTime?: string;
  apps: AndroidAppUsageItem[];
  mostUsedApp: string;
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
