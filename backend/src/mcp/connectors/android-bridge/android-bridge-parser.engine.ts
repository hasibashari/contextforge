import {
  AndroidActiveRestrictionsResponse,
  AndroidAppUsageItem,
  AndroidBedtimeConfigResponse,
  AndroidScreenTimeStatusResponse,
  AndroidUsageSummaryResponse,
} from './android-bridge.types';

/**
 * Converts duration in milliseconds to a human-readable string (e.g. "1h 30m" or "45m 12s")
 */
export function formatDurationMs(ms: number): string {
  if (typeof ms !== 'number' || isNaN(ms) || ms <= 0) {
    return '0m';
  }

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  if (minutes > 0) {
    return seconds > 0 && minutes < 5
      ? `${minutes}m ${seconds}s`
      : `${minutes}m`;
  }
  return `${seconds}s`;
}

/**
 * Validates whether a package name matches standard Android reverse-DNS naming convention
 */
export function validatePackageName(packageName: string): void {
  if (!packageName || typeof packageName !== 'string') {
    throw new Error('Application package name is required.');
  }

  const trimmed = packageName.trim();
  const packageRegex = /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/;

  if (!packageRegex.test(trimmed)) {
    throw new Error(
      `Invalid package name format "${packageName}". Please use a format like "com.instagram.android" or "com.whatsapp".`,
    );
  }
}

/**
 * Validates that a time string is in HH:MM 24-hour format
 */
export function validateTimeFormat(time: string, fieldName = 'Time'): void {
  if (!time || typeof time !== 'string') {
    throw new Error(`${fieldName} value is required.`);
  }
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!timeRegex.test(time.trim())) {
    throw new Error(
      `Invalid ${fieldName} format "${time}". Please use HH:MM 24-hour format (e.g. "22:00" or "06:30").`,
    );
  }
}

/**
 * Extracts friendly application label from package name if not provided
 */
export function getFriendlyAppName(packageName: string): string {
  const parts = packageName.split('.');
  const lastPart = parts[parts.length - 1];
  const secondLast = parts.length > 2 ? parts[parts.length - 2] : '';

  if (lastPart === 'android' && secondLast) {
    return capitalize(secondLast);
  }
  return capitalize(lastPart);
}

function capitalize(s: string): string {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Formats structured Digital Wellbeing daily or multi-day usage summary into a concise markdown report for AI reasoning
 */
export function formatUsageSummaryReport(
  summary: AndroidUsageSummaryResponse,
): string {
  const dateStr = summary.date || new Date().toISOString().split('T')[0];
  const totalStr = formatDurationMs(summary.totalScreenTimeMs);
  const apps = Array.isArray(summary.apps) ? summary.apps : [];
  const isMultiDay =
    (summary.daysCount && summary.daysCount > 1) ||
    (summary.dailyBreakdown && summary.dailyBreakdown.length > 1);

  if (isMultiDay) {
    const daysCount = summary.daysCount || summary.dailyBreakdown?.length || 1;
    const avgDailyMs =
      summary.averageDailyScreenTimeMs ||
      Math.round((summary.totalScreenTimeMs || 0) / daysCount);
    const avgStr = formatDurationMs(avgDailyMs);

    let report = `📱 **Android Historical Telemetry & Trend Analysis (${daysCount} Days - Ending ${dateStr})**\n`;
    report += `- Total Cumulative Screen Time: **${totalStr}**\n`;
    report += `- Average Daily Screen Time: **${avgStr}/day**\n`;

    if (summary.mostUsedApp) {
      const mostUsedFriendly = getFriendlyAppName(summary.mostUsedApp);
      report += `- Dominant Application: **${mostUsedFriendly}** (\`${summary.mostUsedApp}\`)\n`;
    }

    // Daily breakdown section
    if (summary.dailyBreakdown && summary.dailyBreakdown.length > 0) {
      report += `\n**📅 Daily Screen Time Trend:**\n`;
      summary.dailyBreakdown.forEach((day) => {
        const dayDur = formatDurationMs(day.totalScreenTimeMs);
        const topApp = day.mostUsedApp
          ? getFriendlyAppName(day.mostUsedApp)
          : day.apps && day.apps[0]
            ? getFriendlyAppName(day.apps[0].packageName)
            : 'Minimal activity';
        report += `- **${day.date}**: ${dayDur} (Top: *${topApp}*)\n`;
      });
    }

    // Cumulative Top apps section
    if (apps.length > 0) {
      const sortedApps = [...apps].sort(
        (a, b) =>
          (b.totalTimeInForegroundMs || 0) - (a.totalTimeInForegroundMs || 0),
      );

      report += `\n**📊 Top Applications (Cumulative ${daysCount}-Day Duration & Daily Average):**\n`;
      const topAppsText = sortedApps
        .slice(0, 8)
        .map((app, idx) => {
          const friendlyName = getFriendlyAppName(app.packageName);
          const totalAppDur = formatDurationMs(app.totalTimeInForegroundMs);
          const avgAppDur = formatDurationMs(
            Math.round(app.totalTimeInForegroundMs / daysCount),
          );
          return `${idx + 1}. **${friendlyName}** (\`${app.packageName}\`): ${totalAppDur} (~${avgAppDur}/day)`;
        })
        .join('\n');
      report += topAppsText;
    }

    return report;
  }

  // Single Day Report
  if (apps.length === 0) {
    return `📱 **Android Usage Summary (${dateStr})**\n- Total Screen Time: **${totalStr}**\n- No recorded app activity today.`;
  }

  const sortedApps = [...apps].sort(
    (a, b) =>
      (b.totalTimeInForegroundMs || 0) - (a.totalTimeInForegroundMs || 0),
  );

  const topApps = sortedApps
    .slice(0, 10)
    .map((app, idx) => {
      const friendlyName = getFriendlyAppName(app.packageName);
      const dur = formatDurationMs(app.totalTimeInForegroundMs);
      return `${idx + 1}. **${friendlyName}** (\`${app.packageName}\`): ${dur}`;
    })
    .join('\n');

  const mostUsed = summary.mostUsedApp
    ? `${getFriendlyAppName(summary.mostUsedApp)} (\`${summary.mostUsedApp}\`)`
    : sortedApps[0]
      ? `${getFriendlyAppName(sortedApps[0].packageName)} (\`${sortedApps[0].packageName}\`)`
      : 'None';

  return `📱 **Android Usage Summary (${dateStr})**\n- Total Screen Time: **${totalStr}**\n- Most Used App: **${mostUsed}**\n\n**Top Applications by Screen Time:**\n${topApps}`;
}

/**
 * Formats raw app usage list into a readable breakdown
 */
export function formatRawUsageList(apps: AndroidAppUsageItem[]): string {
  if (!apps || apps.length === 0) {
    return '📱 No application usage recorded since 00:00 today.';
  }

  const sorted = [...apps].sort(
    (a, b) =>
      (b.totalTimeInForegroundMs || 0) - (a.totalTimeInForegroundMs || 0),
  );

  const lines = sorted.map((app) => {
    const friendlyName = getFriendlyAppName(app.packageName);
    const dur = formatDurationMs(app.totalTimeInForegroundMs);
    return `- **${friendlyName}** (\`${app.packageName}\`): ${dur}`;
  });

  return `📱 Recorded usage data for ${apps.length} application(s):\n${lines.join('\n')}`;
}

/**
 * Formats active restrictions and app blockers into a clear status report
 */
export function formatRestrictionsReport(
  restrictions: AndroidActiveRestrictionsResponse,
): string {
  const limits = restrictions.limits || [];
  const blocked = restrictions.blockedApps || [];

  const limitLines =
    limits.length > 0
      ? limits
          .map(
            (l) =>
              `- **${getFriendlyAppName(l.packageName)}** (\`${l.packageName}\`): Max **${l.maxDailyMinutes} mins/day** ${l.isBlocked ? '🛑 *(Blocked)*' : '⏳ *(Active)*'}`,
          )
          .join('\n')
      : '- No daily app limits configured.';

  const blockedLines =
    blocked.length > 0
      ? blocked
          .map((b) => `- 🚫 **${getFriendlyAppName(b)}** (\`${b}\`)`)
          .join('\n')
      : '- No applications currently blocked.';

  return `🎯 **Android Focus Restrictions & App Controls:**\n\n**Daily App Limits:**\n${limitLines}\n\n**Blocked Applications:**\n${blockedLines}`;
}

/**
 * Formats the comprehensive screen time status into a decision-ready Agent summary
 */
export function formatScreenTimeStatus(
  status: AndroidScreenTimeStatusResponse,
): string {
  const totalStr = formatDurationMs(status.totalScreenTimeMs);
  const limitStr = status.dailyLimitMs
    ? formatDurationMs(status.dailyLimitMs)
    : 'No limit set';

  const limitStatus = status.dailyLimitMs
    ? status.isLimitExceeded
      ? `🔴 **EXCEEDED** (used ${totalStr} of ${limitStr})`
      : `🟢 Within limit (used ${totalStr} of ${limitStr})`
    : `⬜ ${totalStr} used — no daily limit configured`;

  const bedtimeStatus = status.bedtimeCurfewActive
    ? '🌙 **Bedtime curfew is currently ACTIVE**'
    : status.bedtimeSchedule?.enabled
      ? `⏰ Bedtime scheduled: ${status.bedtimeSchedule.startTime} → ${status.bedtimeSchedule.endTime} (currently inactive)`
      : '⬜ No bedtime schedule configured';

  const restrictionsStr =
    status.activeRestrictionsCount > 0
      ? `🔒 ${status.activeRestrictionsCount} active restriction(s)`
      : '✅ No active restrictions';

  return `📊 **Android Screen Time Status**\n\n**Daily Usage:** ${limitStatus}\n**Bedtime:** ${bedtimeStatus}\n**Restrictions:** ${restrictionsStr}`;
}

/**
 * Formats the bedtime configuration into a readable summary
 */
export function formatBedtimeConfig(
  config: AndroidBedtimeConfigResponse,
): string {
  const schedule = config.bedtimeSchedule;
  const limitStr = config.totalDailyLimitMinutes
    ? `${config.totalDailyLimitMinutes} minutes/day (${formatDurationMs((config.totalDailyLimitMinutes || 0) * 60000)})`
    : 'Not configured';

  const scheduleStr =
    schedule.enabled && schedule.startTime && schedule.endTime
      ? `🌙 Enabled — ${schedule.startTime} to ${schedule.endTime}`
      : schedule.enabled
        ? '🌙 Enabled (times not set)'
        : '⬜ Disabled';

  return `🛌 **Bedtime Configuration**\n\n**Curfew Schedule:** ${scheduleStr}\n**Total Daily Limit:** ${limitStr}`;
}
