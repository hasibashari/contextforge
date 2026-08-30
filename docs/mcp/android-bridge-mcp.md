# Android MCP Bridge & Digital Wellbeing Connector

## 1. Overview

The **Android Bridge & Digital Wellbeing MCP Connector** extends ContextForge with live mobile device telemetry, screen time analysis, automated focus enforcement, app blocking, Do Not Disturb (DND) toggling, bedtime curfew management, and mindful coaching interventions.

It implements the standard ContextForge `IMcpServer` architecture, communicating with an embedded Ktor HTTP server (`McpBridgeService` foreground service) running on the Android device.

### Key Capabilities
- 📊 **Digital Wellbeing Telemetry**: Read app usage stats since 00:00, calculate total screen time, identify top used apps, and detect current foreground application in real time.
- 🎯 **Automated Focus & App Blocker**: Set daily usage limits per app package and instantly block/unblock distracting applications with home redirection and alert overlay.
- 🔕 **Do Not Disturb (DND) Focus Mode**: Suppress notification distractions on mobile devices during deep work or study sessions.
- 📬 **Push Notification Alerts**: Dispatch local notifications and task briefings directly to the Android notification drawer.
- 🌙 **Bedtime Curfew Management**: Schedule nightly lockouts, set global daily screen time limits, and trigger the Zen Bedtime Lock Screen on demand.
- 🧘 **Psychology-Based Nudges**: Send mindful coaching interventions as ambient heads-up banners or immersive companion bottom sheets with wrap-up extension support.
- 🔌 **Seamless ADB & LAN Connectivity**: Connect via USB debugging (`adb forward tcp:8080 tcp:8080`) or local Wi-Fi network IP.

---

## 2. Architecture & Directory Layout

Following the ContextForge connector pattern (`backend/src/mcp/connectors/android-bridge/`):

```
backend/src/mcp/connectors/android-bridge/
├── android-bridge.types.ts            # TypeScript interfaces & DTOs
├── android-bridge-tools.definition.ts # Declarative tool schemas (17 tools)
├── android-bridge-parser.engine.ts    # Duration formatting, validators & markdown formatters
├── android-bridge-api.client.ts       # HTTP Client talking to Android Ktor Server
├── android-bridge.gateway.ts          # WebSocket bridge gateway (real-time RPC)
└── android-bridge-mcp.connector.ts    # IMcpServer connector implementation
```

---

## 3. Tool Reference & Schemas

### Category 1 — Diagnostics & Device Status

---

### 1. `android_get_device_status`
Check whether the Android MCP Bridge server is active and reachable.

- **Type**: Read-only (`readOnly: true`)
- **Sample Output**:
  ```json
  {
    "endpoint": "http://127.0.0.1:8080",
    "status": "connected",
    "latencyMs": 12,
    "device": "Google Pixel 8",
    "androidVersion": "14",
    "batteryLevel": 87
  }
  ```

---

### Category 2 — Screen Time Monitoring & Telemetry

---

### 2. `android_get_usage`
Retrieve raw application usage durations recorded since 00:00 today.

- **Type**: Read-only (`readOnly: true`)
- **Sample Output**:
  ```json
  {
    "totalApps": 2,
    "apps": [
      {
        "packageName": "com.google.android.youtube",
        "totalTimeInForegroundMs": 5400000,
        "lastTimeUsed": 1724558400000,
        "formattedDuration": "1h 30m"
      }
    ]
  }
  ```

---

### 3. `android_get_usage_summary`
Fetch structured daily Digital Wellbeing summary formatted for AI analysis.

- **Type**: Read-only (`readOnly: true`)
- **Sample Output**:
  ```json
  {
    "date": "2026-08-30",
    "totalScreenTimeMs": 7200000,
    "formattedTotalScreenTime": "2h",
    "mostUsedApp": "com.google.android.youtube",
    "mostUsedAppName": "Youtube",
    "appsCount": 2,
    "apps": [ ... ]
  }
  ```

---

### 4. `android_get_foreground_app`
Detect the currently active foreground application on the device screen.

- **Type**: Read-only (`readOnly: true`)
- **Sample Output**:
  ```json
  {
    "currentForegroundApp": "com.whatsapp",
    "friendlyName": "Whatsapp"
  }
  ```

---

### 12. `android_get_screen_time_status`
All-in-one screen time status snapshot. Use this before deciding on an intervention.

- **Type**: Read-only (`readOnly: true`)
- **Sample Output**:
  ```json
  {
    "totalScreenTimeMs": 10800000,
    "formattedTotalScreenTime": "3h",
    "dailyLimitMs": 14400000,
    "formattedDailyLimit": "4h",
    "isLimitExceeded": false,
    "bedtimeCurfewActive": false,
    "bedtimeSchedule": {
      "enabled": true,
      "startTime": "22:00",
      "endTime": "06:00"
    },
    "activeRestrictionsCount": 2
  }
  ```

---

### Category 3 — App Limits & Restrictions

---

### 5. `android_set_app_limit`
Set a maximum daily usage time limit in minutes for a specific application.

- **Type**: Mutation (`readOnly: false`)
- **Parameters**:
  - `packageName` *(string, required)*: Android package name (e.g. `com.instagram.android`).
  - `maxDailyMinutes` *(number, required)*: Maximum allowed daily usage in minutes.

---

### 6. `android_block_app`
Instantly block or unblock an application. Blocked apps trigger home redirection and alert overlay.

- **Type**: Mutation (`readOnly: false`)
- **Parameters**:
  - `packageName` *(string, required)*: Android package name.
  - `block` *(boolean, required)*: `true` to block, `false` to unblock.

---

### 10. `android_unblock_app`
Unblock a previously blocked application via the dedicated `/unblock_app` endpoint.

- **Type**: Mutation (`readOnly: false`)
- **Parameters**:
  - `packageName` *(string, required)*: Android package name to unblock.
- **Note**: Uses the dedicated Android `/unblock_app` RPC handler which executes identical unblock logic to `block_app` with `block: false`.

---

### 7. `android_get_active_restrictions`
Retrieve all configured daily limits and currently blocked applications.

- **Type**: Read-only (`readOnly: true`)
- **Sample Output**:
  ```json
  {
    "limits": [
      {
        "packageName": "com.instagram.android",
        "maxDailyMinutes": 45,
        "isBlocked": false
      }
    ],
    "blockedApps": ["com.tiktok.android"]
  }
  ```

---

### 11. `android_reset_all_restrictions`
Master reset: removes all app time limits, unblocks all blocked apps, and disables the bedtime curfew.

- **Type**: Mutation (`readOnly: false`)
- **Parameters**: None
- **Sample Output**:
  ```json
  { "status": "success", "message": "All restrictions cleared." }
  ```

---

### Category 4 — Bedtime Curfew & Screen Time Limits

---

### 13. `android_set_bedtime_schedule`
Configure the nightly Bedtime Curfew schedule.

- **Type**: Mutation (`readOnly: false`)
- **Parameters**:
  - `startTime` *(string, required)*: Start time in HH:MM 24-hour format (e.g. `"22:00"`).
  - `endTime` *(string, required)*: End time in HH:MM 24-hour format (e.g. `"06:00"`).
  - `enabled` *(boolean, required)*: Whether the schedule is active.

---

### 14. `android_set_total_screen_time_limit`
Set a global maximum daily screen time limit across all applications.

- **Type**: Mutation (`readOnly: false`)
- **Parameters**:
  - `maxDailyMinutes` *(number, required)*: Maximum total screen time per day in minutes (e.g. `240` for 4 hours).

---

### 15. `android_get_bedtime_config`
Read the current bedtime curfew schedule and total daily screen time limit stored on the device.

- **Type**: Read-only (`readOnly: true`)
- **Sample Output**:
  ```json
  {
    "bedtimeSchedule": {
      "enabled": true,
      "startTime": "22:00",
      "endTime": "06:00"
    },
    "totalDailyLimitMinutes": 240,
    "formattedDailyLimit": "4h"
  }
  ```

---

### 16. `android_trigger_bedtime_lock`
Immediately trigger the Zen Bedtime Lock Screen on the Android device.

- **Type**: Mutation (`readOnly: false`)
- **Parameters**:
  - `message` *(string, optional)*: Custom zen/relaxation message to display (e.g. `"Time to rest. See you at 6 AM 🌙"`).

---

### Category 5 — System Controls & Psychology-Based Nudges

---

### 8. `android_set_dnd`
Toggle Do Not Disturb (DND) mode on the Android device.

- **Type**: Mutation (`readOnly: false`)
- **Parameters**:
  - `enable` *(boolean, required)*: `true` to enable DND, `false` to disable.

---

### 9. `android_send_notification`
Push a local system notification to the Android device status bar.

- **Type**: Mutation (`readOnly: false`)
- **Parameters**:
  - `title` *(string, required)*: Notification title header.
  - `message` *(string, required)*: Notification body text.

---

### 17. `android_send_agent_message`
Send a psychology-informed mindful coaching intervention to the user.

- **Type**: Mutation (`readOnly: false`)
- **Parameters**:
  - `style` *(enum, required)*: `"heads_up"` or `"companion_modal"`.
    - `heads_up` — Subtle ambient floating pop-up that doesn't interrupt the user's activity.
    - `companion_modal` — Immersive bottom-sheet dialog with breathing prompt and optional wrap-up extension.
  - `title` *(string, required)*: Message title shown in the intervention UI.
  - `message` *(string, required)*: The main coaching text or mindful prompt.
  - `allowExtension` *(boolean, optional)*: If `true`, the companion modal offers a wrap-up extension button.
  - `extensionMinutes` *(number, optional)*: Duration of the wrap-up extension window (Android defaults to 1 minute if not specified; backend/Agent holds policy control).
- **Sample Output**:
  ```json
  {
    "style": "companion_modal",
    "title": "Time to pause 🌿",
    "message": "You've been on Instagram for 45 minutes. Take a breath.",
    "allowExtension": true,
    "extensionMinutes": 1,
    "status": "success",
    "userAction": "extended"
  }
  ```

---

## 4. Tool Summary Table

| # | Tool Name | Type | Category |
|---|-----------|------|----------|
| 1 | `android_get_device_status` | Read | Diagnostics |
| 2 | `android_get_usage` | Read | Monitoring |
| 3 | `android_get_usage_summary` | Read | Monitoring |
| 4 | `android_get_foreground_app` | Read | Monitoring |
| 5 | `android_set_app_limit` | Mutation | App Limits |
| 6 | `android_block_app` | Mutation | App Limits |
| 7 | `android_get_active_restrictions` | Read | App Limits |
| 8 | `android_set_dnd` | Mutation | System Controls |
| 9 | `android_send_notification` | Mutation | System Controls |
| 10 | `android_unblock_app` | Mutation | App Limits |
| 11 | `android_reset_all_restrictions` | Mutation | App Limits |
| 12 | `android_get_screen_time_status` | Read | Monitoring |
| 13 | `android_set_bedtime_schedule` | Mutation | Bedtime |
| 14 | `android_set_total_screen_time_limit` | Mutation | Bedtime |
| 15 | `android_get_bedtime_config` | Read | Bedtime |
| 16 | `android_trigger_bedtime_lock` | Mutation | Bedtime |
| 17 | `android_send_agent_message` | Mutation | Psychology Nudges |

---

## 5. Connection & Setup Guide

### Method A: USB Debugging with ADB (Recommended)

1. Enable **Developer Options** and **USB Debugging** on your Android device.
2. Connect device via USB cable to host machine.
3. Run port forwarding:
   ```bash
   adb forward tcp:8080 tcp:8080
   ```
4. Configure ContextForge endpoint to `http://127.0.0.1:8080`.

### Method B: Local Wi-Fi Network

1. Connect Android device and host machine to the same Wi-Fi network.
2. Find the Android device IP address (e.g. `192.168.1.105`).
3. Configure ContextForge endpoint to `http://192.168.1.105:8080`.

### Method C: WebSocket Bridge (Real-time)

The connector also supports a persistent WebSocket connection at `/api/android-bridge/ws` for low-latency real-time RPC. The Android app connects once, and all tool calls are dispatched as typed JSON messages with response correlation IDs. HTTP fallback is automatically used when no WebSocket is active.

---

## 6. Android Permissions Required

| Izin Android | Tujuan & Penggunaan |
| :--- | :--- |
| `android.permission.PACKAGE_USAGE_STATS` | Membaca data screen time dan foreground app |
| `android.permission.SYSTEM_ALERT_WINDOW` | Overlay peringatan pembatasan aplikasi dan Zen Bedtime Screen |
| `android.permission.ACCESS_NOTIFICATION_POLICY` | Mengatur mode Do Not Disturb (DND) |
| `android.permission.POST_NOTIFICATIONS` | Mengirim notifikasi lokal dan agent messages |
| `android.permission.FOREGROUND_SERVICE` | Menjaga Ktor HTTP server tetap berjalan di background |
| `android.permission.INTERNET` | Komunikasi jaringan HTTP server dan WebSocket bridge |
