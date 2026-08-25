# Android MCP Bridge & Digital Wellbeing Connector

## 1. Overview

The **Android Bridge & Digital Wellbeing MCP Connector** extends ContextForge with live mobile device telemetry, screen time analysis, automated focus enforcement, app blocking, Do Not Disturb (DND) toggling, and local notification delivery.

It implements the standard ContextForge `IMcpServer` architecture, communicating with an embedded Ktor HTTP server (`McpBridgeService` foreground service) running on the Android device.

### Key Capabilities
- 📊 **Digital Wellbeing Telemetry**: Read app usage stats since 00:00, calculate total screen time, identify top used apps, and detect current foreground application in real time.
- 🎯 **Automated Focus & App Blocker**: Set daily usage limits per app package and instantly block/unblock distracting applications with home redirection and alert overlay.
- 🔕 **Do Not Disturb (DND) Focus Mode**: Suppress notification distractions on mobile devices during deep work or study sessions.
- 📬 **Push Notification Alerts**: Dispatch local notifications and task briefings directly to the Android notification drawer.
- 🔌 **Seamless ADB & LAN Connectivity**: Connect via USB debugging (`adb forward tcp:8080 tcp:8080`) or local Wi-Fi network IP.

---

## 2. Architecture & Directory Layout

Following the ContextForge connector pattern (`backend/src/mcp/connectors/android-bridge/`):

```
backend/src/mcp/connectors/android-bridge/
├── android-bridge.types.ts            # TypeScript interfaces & DTOs
├── android-bridge-tools.definition.ts # Declarative tool schemas
├── android-bridge-parser.engine.ts    # Duration formatting, package validation & markdown summary
├── android-bridge-api.client.ts       # HTTP Client talking to Android Ktor Server
└── android-bridge-mcp.connector.ts    # IMcpServer connector implementation
```

---

## 3. Tool Reference & Schemas

### 1. `android_get_device_status`
Check whether the Android MCP Bridge server is active and reachable.

- **Type**: Read-only (`readOnly: true`)
- **Sample Output**:
  ```json
  {
    "endpoint": "http://127.0.0.1:8080",
    "status": "connected",
    "latencyMs": 12,
    "device": "Android Native MCP Device"
  }
  ```

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
      },
      {
        "packageName": "com.instagram.android",
        "totalTimeInForegroundMs": 1800000,
        "lastTimeUsed": 1724557200000,
        "formattedDuration": "30m"
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
    "date": "2026-08-25",
    "totalScreenTimeMs": 7200000,
    "formattedTotalScreenTime": "2h",
    "mostUsedApp": "com.google.android.youtube",
    "mostUsedAppName": "Youtube",
    "appsCount": 2,
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

### 5. `android_set_app_limit`
Set a maximum daily usage time limit in minutes for a specific application.

- **Type**: Mutation (`readOnly: false`)
- **Parameters**:
  - `packageName` *(string, required)*: Android package name (e.g. `com.instagram.android`).
  - `maxDailyMinutes` *(number, required)*: Maximum allowed daily usage in minutes (e.g. `45`).

---

### 6. `android_block_app`
Instantly block or unblock an application.

- **Type**: Mutation (`readOnly: false`)
- **Parameters**:
  - `packageName` *(string, required)*: Android package name (e.g. `com.tiktok.android`).
  - `block` *(boolean, required)*: `true` to block, `false` to unblock.

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
    "blockedApps": [
      "com.tiktok.android"
    ]
  }
  ```

---

### 8. `android_set_dnd`
Toggle Do Not Disturb (DND) mode on the Android device.

- **Type**: Mutation (`readOnly: false`)
- **Parameters**:
  - `enable` *(boolean, required)*: `true` to enable DND, `false` to disable.

---

### 9. `android_send_notification`
Push a local system notification to the Android device.

- **Type**: Mutation (`readOnly: false`)
- **Parameters**:
  - `title` *(string, required)*: Notification title header.
  - `message` *(string, required)*: Notification body text.

---

## 4. Connection & Setup Guide

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

---

## 5. Android Permissions Required

| Izin Android | Tujuan & Penggunaan |
| :--- | :--- |
| `android.permission.PACKAGE_USAGE_STATS` | Membaca data screen time dan foreground app |
| `android.permission.SYSTEM_ALERT_WINDOW` | Overlay peringatan pembatasan aplikasi |
| `android.permission.ACCESS_NOTIFICATION_POLICY` | Mengatur mode Do Not Disturb (DND) |
| `android.permission.POST_NOTIFICATIONS` | Mengirim notifikasi lokal |
| `android.permission.FOREGROUND_SERVICE` | Menjaga Ktor HTTP server tetap berjalan di background |
| `android.permission.INTERNET` | Komunikasi jaringan HTTP server |
