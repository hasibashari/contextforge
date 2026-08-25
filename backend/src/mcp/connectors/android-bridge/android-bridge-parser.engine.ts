import {
  AndroidActiveRestrictionsResponse,
  AndroidAppUsageItem,
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
    throw new Error('Nama package aplikasi wajib diisi.');
  }

  const trimmed = packageName.trim();
  const packageRegex = /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/;

  if (!packageRegex.test(trimmed)) {
    throw new Error(
      `Format package name "${packageName}" tidak valid. Harap gunakan format seperti "com.instagram.android" atau "com.whatsapp".`,
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
 * Formats structured Digital Wellbeing daily usage summary into a concise markdown report
 */
export function formatUsageSummaryReport(
  summary: AndroidUsageSummaryResponse,
): string {
  const dateStr = summary.date || new Date().toISOString().split('T')[0];
  const totalStr = formatDurationMs(summary.totalScreenTimeMs);
  const apps = Array.isArray(summary.apps) ? summary.apps : [];

  if (apps.length === 0) {
    return `📱 **Ringkasan Penggunaan Android (${dateStr})**\n- Total Screen Time: **${totalStr}**\n- Belum ada catatan aktivitas aplikasi hari ini.`;
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

  return `📱 **Ringkasan Penggunaan Android (${dateStr})**\n- Total Screen Time: **${totalStr}**\n- Aplikasi Paling Sering Digunakan: **${mostUsed}**\n\n**Daftar Aplikasi Terbanyak Digunakan:**\n${topApps}`;
}

/**
 * Formats raw app usage list into a readable breakdown
 */
export function formatRawUsageList(apps: AndroidAppUsageItem[]): string {
  if (!apps || apps.length === 0) {
    return '📱 Tidak ada data penggunaan aplikasi yang tercatat sejak 00:00 hari ini.';
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

  return `📱 Ditemukan data penggunaan ${apps.length} aplikasi:\n${lines.join('\n')}`;
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
              `- **${getFriendlyAppName(l.packageName)}** (\`${l.packageName}\`): Maksimal **${l.maxDailyMinutes} menit/hari** ${l.isBlocked ? '🛑 *(Sedang Diblokir)*' : '⏳ *(Aktif)*'}`,
          )
          .join('\n')
      : '- Tidak ada batas waktu aplikasi yang dikonfigurasi.';

  const blockedLines =
    blocked.length > 0
      ? blocked
          .map((b) => `- 🚫 **${getFriendlyAppName(b)}** (\`${b}\`)`)
          .join('\n')
      : '- Tidak ada aplikasi yang sedang diblokir secara instan.';

  return `🎯 **Status Pembatasan & Kontrol Fokus Android:**\n\n**Batas Waktu Harian (App Limits):**\n${limitLines}\n\n**Aplikasi Diblokir (Blocked Apps):**\n${blockedLines}`;
}
