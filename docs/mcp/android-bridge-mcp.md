# Android MCP Bridge & Digital Wellbeing Connector

## 1. Overview

The **Android Bridge & Digital Wellbeing MCP Connector** extends ContextForge with live mobile device telemetry, screen time analysis, automated focus enforcement, app blocking, Do Not Disturb (DND) toggling, bedtime curfew management, and mindful coaching interventions.

It implements the standard ContextForge `IMcpServer` architecture. Transport is **exclusively WebSocket** — the Android companion app opens a persistent WebSocket connection to the ContextForge backend at `/api/android-bridge/ws`. All tool calls are dispatched as typed JSON RPC messages with correlation IDs. There is no HTTP polling or ADB requirement at runtime.

### Key Capabilities
- 📊 **Digital Wellbeing Telemetry**: Read app usage stats, calculate total screen time, identify top used apps, and detect the current foreground application in real time.
- 🎯 **Automated Focus & App Blocker**: Set daily usage limits per app package and instantly block/unblock distracting applications with home redirection and alert overlay.
- 🔕 **Do Not Disturb (DND) Focus Mode**: Suppress notification distractions during deep work or study sessions.
- 📬 **Push Notification Alerts**: Dispatch local notifications and task briefings directly to the Android notification drawer.
- 🌙 **Bedtime Curfew Management**: Schedule nightly lockouts, set global daily screen time limits, and trigger the Zen Bedtime Lock Screen on demand.
- 🧘 **Psychology-Based Nudges**: Send mindful coaching interventions as ambient heads-up banners or immersive companion bottom sheets with wrap-up extension support.
- 🔌 **WebSocket Bridge**: The Android companion app connects once over Wi-Fi or USB-forwarded TCP — no polling, no ADB dependency at runtime.

---

## 2. Architecture & Directory Layout

```
backend/src/mcp/connectors/android-bridge/
├── android-bridge.types.ts             # TypeScript interfaces & response DTOs
├── android-bridge-tools.definition.ts  # Declarative tool schemas (17 tools)
├── android-bridge-parser.engine.ts     # Duration formatting, validators & markdown formatters
├── android-bridge.gateway.ts           # WebSocket gateway — manages device connections & RPC dispatch
└── android-bridge-mcp.connector.ts     # IMcpServer implementation — routes tool calls via gateway
```

### How it works

```
Android App  ──(WebSocket)──▶  AndroidBridgeGatewayService  ──▶  AndroidBridgeMcpConnector
                                        │                                   │
                               pendingRequests Map                  dispatchBridgeRequest()
                               (correlation IDs)                    (returns Promise<T>)
```

1. The Android companion app connects to `ws://<host>/api/android-bridge/ws`.
2. On connect, the gateway sends an initial `get_device_status` handshake request.
3. The Android app replies with a `mcp_bridge_response` carrying device metadata (name, OS version, battery).
4. When a tool is called, `AndroidBridgeMcpConnector` calls `gateway.dispatchBridgeRequest(action, payload)`.
5. The gateway sends a `mcp_bridge_request` message with a unique `id`, then awaits the matching `mcp_bridge_response` from the device (12 s timeout).
6. If no device is connected, tool calls that require the device immediately return a `success: false` result — except `android_get_device_status`, which always returns local state without contacting the device.

---

## 3. WebSocket Message Protocol

All messages are UTF-8 JSON. The backend always initiates requests; the Android app responds.

### Request (Backend → Android)

```json
{
  "id": "req-1724558400000-ab3f7",
  "type": "mcp_bridge_request",
  "action": "get_foreground_app",
  "payload": {},
  "timestamp": 1724558400000
}
```

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique correlation ID for response matching |
| `type` | `"mcp_bridge_request"` | Fixed discriminator |
| `action` | string | One of the action names listed in Section 5 |
| `payload` | object | Tool-specific parameters |
| `timestamp` | number | Unix ms |

### Response (Android → Backend)

```json
{
  "id": "req-1724558400000-ab3f7",
  "type": "mcp_bridge_response",
  "success": true,
  "data": { "currentForegroundApp": "com.whatsapp", "friendlyName": "WhatsApp" },
  "timestamp": 1724558401234
}
```

| Field | Type | Description |
|---|---|---|
| `id` | string | Must match the request `id` exactly |
| `type` | `"mcp_bridge_response"` | Fixed discriminator |
| `success` | boolean | `true` = data present; `false` = error present |
| `data` | object | Tool result payload |
| `error` | string? | Error message when `success: false` |

### Handshake (Android → Backend, on connect)

The Android app must send one of the following message types immediately after opening the WebSocket:

```json
{
  "type": "android_handshake",
  "deviceName": "Pixel 8 Pro",
  "androidVersion": "14",
  "batteryLevel": 87
}
```

Accepted `type` values: `android_handshake`, `handshake`, `client_hello`, `register_device`, `device_status`.

The backend replies with:

```json
{ "type": "handshake_ack", "success": true, "message": "Connected to ContextForge MCP Bridge", "timestamp": 1724558400000 }
```

### Heartbeat

```json
// Android → Backend (application-level)
{ "type": "ping" }

// Backend → Android
{ "type": "pong", "timestamp": 1724558400000 }
```

The backend also sends WebSocket-level `ping` frames every **30 seconds**. Clients that do not respond to pong within **60 seconds** are terminated.

---

## 4. Tool Reference & Schemas

### Category 1 — Diagnostics & Device Status

---

### 1. `android_get_device_status`
Check whether an Android device is actively connected via WebSocket. **Always returns immediately** — does not contact the device.

- **Type**: Read-only (`readOnly: true`)
- **Action sent to device**: None (local state only)
- **Sample Output (connected)**:
  ```json
  {
    "endpoint": "WebSocket (/api/android-bridge/ws)",
    "status": "connected",
    "latencyMs": 2,
    "device": "Pixel 8 Pro",
    "androidVersion": "14",
    "batteryLevel": 87,
    "transport": "websocket"
  }
  ```
- **Sample Output (disconnected)**:
  ```json
  {
    "endpoint": "WebSocket (/api/android-bridge/ws)",
    "status": "disconnected",
    "latencyMs": 0,
    "device": "Android Mobile Device",
    "message": "Android device is not connected. Scan QR code or connect via WebSocket.",
    "transport": "websocket"
  }
  ```

---

### Category 2 — Screen Time Monitoring & Telemetry

> **Note**: All tools in this category dispatch a WebSocket request to the device and require an active connection. If the device is disconnected, they return `success: false` immediately without waiting for a timeout.

---

### 2. `android_get_usage`
Retrieve raw application usage durations recorded since 00:00 today.

- **Type**: Read-only (`readOnly: true`)
- **Action**: `get_usage`
- **Parameters** (optional):
  - `days` *(number)*: Number of past days to include (default: 1).
  - `date` *(string)*: Reference date in `YYYY-MM-DD` format.
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
- **Action**: `get_usage_summary`
- **Parameters** (optional):
  - `days` *(number)*: Number of past days.
  - `date` *(string)*: Reference date `YYYY-MM-DD`.
- **Sample Output**:
  ```json
  {
    "date": "2026-08-30",
    "totalScreenTimeMs": 7200000,
    "formattedTotalScreenTime": "2h",
    "mostUsedApp": "com.google.android.youtube",
    "mostUsedAppName": "Youtube",
    "appsCount": 2,
    "apps": [ "..." ]
  }
  ```

---

### 4. `android_get_foreground_app`
Detect the currently active foreground application on the device screen.

- **Type**: Read-only (`readOnly: true`)
- **Action**: `get_foreground_app`
- **Sample Output**:
  ```json
  {
    "currentForegroundApp": "com.whatsapp",
    "friendlyName": "WhatsApp"
  }
  ```

---

### 12. `android_get_screen_time_status`
All-in-one screen time status snapshot. Use this before deciding on an intervention.

- **Type**: Read-only (`readOnly: true`)
- **Action**: `get_screen_time_status`
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
- **Action**: `set_app_limit`
- **Parameters**:
  - `packageName` *(string, required)*: Android package name (e.g. `com.instagram.android`).
  - `maxDailyMinutes` *(number, required)*: Maximum allowed daily usage in minutes (0–1440).

---

### 6. `android_block_app`
Instantly block or unblock an application. Blocked apps trigger home redirection and alert overlay.

- **Type**: Mutation (`readOnly: false`)
- **Action**: `block_app`
- **Parameters**:
  - `packageName` *(string, required)*: Android package name.
  - `block` *(boolean, required)*: `true` to block, `false` to unblock.

---

### 10. `android_unblock_app`
Unblock a previously blocked application. Calls the dedicated `unblock_app` action; falls back to `block_app` with `block: false` if unavailable.

- **Type**: Mutation (`readOnly: false`)
- **Action**: `unblock_app` (fallback: `block_app` with `block: false`)
- **Parameters**:
  - `packageName` *(string, required)*: Android package name to unblock.

---

### 7. `android_get_active_restrictions`
Retrieve all configured daily limits and currently blocked applications.

- **Type**: Read-only (`readOnly: true`)
- **Action**: `get_active_restrictions`
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
- **Action**: `reset_all_restrictions`
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
- **Action**: `set_bedtime_schedule`
- **Parameters**:
  - `startTime` *(string, required)*: Start time in `HH:MM` 24-hour format (e.g. `"22:00"`).
  - `endTime` *(string, required)*: End time in `HH:MM` 24-hour format (e.g. `"06:00"`).
  - `enabled` *(boolean, required)*: Whether the schedule is active.

---

### 14. `android_set_total_screen_time_limit`
Set a global maximum daily screen time limit across all applications.

- **Type**: Mutation (`readOnly: false`)
- **Action**: `set_total_screen_time_limit`
- **Parameters**:
  - `maxDailyMinutes` *(number, required)*: Max total screen time per day in minutes (0 = unlimited).

---

### 15. `android_get_bedtime_config`
Read the current bedtime curfew schedule and total daily screen time limit stored on the device.

- **Type**: Read-only (`readOnly: true`)
- **Action**: `get_bedtime_config`
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
- **Action**: `trigger_bedtime_lock`
- **Parameters**:
  - `message` *(string, optional)*: Custom zen/relaxation message to display on screen (defaults to a built-in Indonesian relaxation message if omitted).

---

### Category 5 — System Controls & Psychology-Based Nudges

---

### 8. `android_set_dnd`
Toggle Do Not Disturb (DND) mode on the Android device.

- **Type**: Mutation (`readOnly: false`)
- **Action**: `set_dnd`
- **Parameters**:
  - `enable` *(boolean, required)*: `true` to enable DND, `false` to disable.

---

### 9. `android_send_notification`
Push a local system notification to the Android device status bar.

- **Type**: Mutation (`readOnly: false`)
- **Action**: `send_notification`
- **Parameters**:
  - `title` *(string, required)*: Notification title header.
  - `message` *(string, required)*: Notification body text.

---

### 17. `android_send_agent_message`
Send a psychology-informed mindful coaching intervention to the user.

- **Type**: Mutation (`readOnly: false`)
- **Action**: `send_agent_message`
- **Parameters**:
  - `style` *(enum, required)*: `"heads_up"` or `"companion_modal"`.
    - `heads_up` — Subtle ambient floating pop-up that doesn't interrupt the user's activity.
    - `companion_modal` — Immersive bottom-sheet dialog with breathing prompt and optional wrap-up extension.
  - `title` *(string, required)*: Message title shown in the intervention UI.
  - `message` *(string, required)*: The main coaching text or mindful prompt.
  - `allowExtension` *(boolean, optional)*: If `true`, the companion modal offers a wrap-up extension button (default: `true`).
  - `extensionMinutes` *(number, optional)*: Duration of the wrap-up extension window in minutes (default: `1`).
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

## 5. Tool Summary Table

| # | Tool Name | Type | Action (WebSocket) | Category |
|---|-----------|------|--------------------|----------|
| 1 | `android_get_device_status` | Read | *(local — no device call)* | Diagnostics |
| 2 | `android_get_usage` | Read | `get_usage` | Monitoring |
| 3 | `android_get_usage_summary` | Read | `get_usage_summary` | Monitoring |
| 4 | `android_get_foreground_app` | Read | `get_foreground_app` | Monitoring |
| 5 | `android_set_app_limit` | Mutation | `set_app_limit` | App Limits |
| 6 | `android_block_app` | Mutation | `block_app` | App Limits |
| 7 | `android_get_active_restrictions` | Read | `get_active_restrictions` | App Limits |
| 8 | `android_set_dnd` | Mutation | `set_dnd` | System Controls |
| 9 | `android_send_notification` | Mutation | `send_notification` | System Controls |
| 10 | `android_unblock_app` | Mutation | `unblock_app` | App Limits |
| 11 | `android_reset_all_restrictions` | Mutation | `reset_all_restrictions` | App Limits |
| 12 | `android_get_screen_time_status` | Read | `get_screen_time_status` | Monitoring |
| 13 | `android_set_bedtime_schedule` | Mutation | `set_bedtime_schedule` | Bedtime |
| 14 | `android_set_total_screen_time_limit` | Mutation | `set_total_screen_time_limit` | Bedtime |
| 15 | `android_get_bedtime_config` | Read | `get_bedtime_config` | Bedtime |
| 16 | `android_trigger_bedtime_lock` | Mutation | `trigger_bedtime_lock` | Bedtime |
| 17 | `android_send_agent_message` | Mutation | `send_agent_message` | Psychology Nudges |

---

## 6. Connection & Setup Guide

Transport adalah **WebSocket murni**. Tidak diperlukan ADB saat runtime — cukup koneksi jaringan ke backend ContextForge.

### Langkah 1 — Jalankan backend ContextForge

```bash
cd backend && npm run dev
```

WebSocket listener aktif di: `ws://<host>:3001/api/android-bridge/ws`

---

### Langkah 2A — Koneksi via Wi-Fi (LAN)

1. Pastikan Android dan mesin host terhubung ke jaringan Wi-Fi yang sama.
2. Cari IP mesin host (contoh: `192.168.1.10`).
3. Di aplikasi Android companion, masukkan WebSocket URL:
   ```
   ws://192.168.1.10:3001/api/android-bridge/ws
   ```
4. Tekan **Connect** — status di ContextForge Web UI akan berubah menjadi **Connected** dalam 1–2 detik.

---

### Langkah 2B — Koneksi via USB (ADB Reverse)

Metode ini berguna jika Android dan PC terhubung via USB.

1. Aktifkan **Developer Options** dan **USB Debugging** di Android.
2. Hubungkan kabel USB.
3. Forward port dari device ke localhost mesin:
   ```bash
   adb reverse tcp:3001 tcp:3001
   ```
   > `adb reverse` (bukan `adb forward`) — karena traffic keluar dari Android menuju backend di PC.
4. Di aplikasi Android companion, masukkan URL:
   ```
   ws://127.0.0.1:3001/api/android-bridge/ws
   ```

---

### Langkah 3 — Verifikasi koneksi

Tanya ke ContextForge AI:
> *"Cek status perangkat Android saya"*

AI akan memanggil `android_get_device_status` yang langsung mengembalikan status koneksi beserta nama device, versi Android, dan level baterai — tanpa mengirim pesan ke device.

---

## 7. Connection Lifecycle & Error Handling

### Alur koneksi masuk

```
Android → ws://.../api/android-bridge/ws (connect)
  Backend: auto-enable bridge, tambah ke activeClients
  Backend → Android: { type: "mcp_bridge_request", action: "get_device_status", ... }
  Android → Backend: { type: "mcp_bridge_response", data: { deviceName, androidVersion, batteryLevel } }
  Backend: update activeDeviceInfo, notifyConnected()
  Web UI: status → Connected ✅
```

### Timeout & retry behavior

| Skenario | Behavior |
|---|---|
| Device tidak terhubung | Tool call langsung return `success: false` (tidak menunggu timeout) |
| Device terhubung tapi tidak merespons | `dispatchBridgeRequest` timeout setelah **12 detik** |
| Error timeout/disconnect dari device | **Tidak di-retry** — langsung fail (device tidak akan tiba-tiba merespons dalam 300ms) |
| Error jaringan transient lainnya | Di-retry hingga 3× dengan exponential backoff (300ms → 600ms → ...) |

### Disconnect & reconnect

- Jika Android menutup koneksi, gateway menghapus client dan mengirim event `notifyDisconnected()`.
- Android bisa reconnect kapan saja — gateway menerima koneksi baru secara otomatis.
- Ketika user menekan "Disconnect" di Web UI, backend mengirim pesan `server_disconnect` dengan `requireRePairing: true` sebelum menutup socket.

### Heartbeat (server-side)

Backend mengirim WebSocket `ping` frame setiap **30 detik**. Jika device tidak membalas `pong` selama lebih dari **60 detik**, socket dianggap mati (`dead peer`) dan diterminasi.

---

## 8. Android Permissions Required

| Permission | Tujuan |
| :--- | :--- |
| `android.permission.PACKAGE_USAGE_STATS` | Membaca data screen time dan foreground app |
| `android.permission.SYSTEM_ALERT_WINDOW` | Overlay peringatan pembatasan aplikasi dan Zen Bedtime Screen |
| `android.permission.ACCESS_NOTIFICATION_POLICY` | Mengatur mode Do Not Disturb (DND) |
| `android.permission.POST_NOTIFICATIONS` | Mengirim notifikasi lokal dan agent messages |
| `android.permission.FOREGROUND_SERVICE` | Menjaga WebSocket client tetap berjalan di background |
| `android.permission.INTERNET` | Komunikasi WebSocket ke backend ContextForge |

> **Tidak diperlukan**: `READ_EXTERNAL_STORAGE`, `CAMERA`, `LOCATION`, atau permission sensitif lainnya.

---

## 9. Implementing the Android Companion App

Berikut kontrak minimal yang harus diimplementasikan oleh Android companion app agar kompatibel dengan backend.

### WebSocket client skeleton (Kotlin / OkHttp)

```kotlin
val client = OkHttpClient.Builder()
    .pingInterval(25, TimeUnit.SECONDS) // Kirim ping sebelum 30s server timeout
    .build()

val request = Request.Builder()
    .url("ws://192.168.1.10:3001/api/android-bridge/ws")
    .build()

val ws = client.newWebSocket(request, object : WebSocketListener() {

    override fun onOpen(ws: WebSocket, response: Response) {
        // Wajib: kirim handshake segera setelah koneksi terbuka
        ws.send(JSONObject().apply {
            put("type", "android_handshake")
            put("deviceName", Build.MODEL)
            put("androidVersion", Build.VERSION.RELEASE)
            put("batteryLevel", getBatteryLevel())
        }.toString())
    }

    override fun onMessage(ws: WebSocket, text: String) {
        val msg = JSONObject(text)
        when (msg.optString("type")) {
            "mcp_bridge_request" -> handleBridgeRequest(ws, msg)
            "handshake_ack"      -> Log.d("Bridge", "Handshake OK")
            "server_disconnect"  -> ws.close(1000, "Server disconnected")
            "pong"               -> { /* heartbeat ack */ }
        }
    }

    override fun onFailure(ws: WebSocket, t: Throwable, response: Response?) {
        Log.e("Bridge", "WebSocket error: ${t.message}")
        // Implementasikan reconnect dengan exponential backoff
    }
})
```

### Request handler

```kotlin
fun handleBridgeRequest(ws: WebSocket, msg: JSONObject) {
    val id      = msg.getString("id")
    val action  = msg.getString("action")
    val payload = msg.optJSONObject("payload") ?: JSONObject()

    val (success, data) = try {
        true to when (action) {
            "get_device_status"           -> getDeviceStatus()
            "get_foreground_app"          -> getForegroundApp()
            "get_usage"                   -> getUsage(payload)
            "get_usage_summary"           -> getUsageSummary(payload)
            "get_screen_time_status"      -> getScreenTimeStatus()
            "set_app_limit"               -> setAppLimit(payload)
            "block_app"                   -> blockApp(payload)
            "unblock_app"                 -> unblockApp(payload)
            "get_active_restrictions"     -> getActiveRestrictions()
            "reset_all_restrictions"      -> resetAllRestrictions()
            "set_dnd"                     -> setDnd(payload)
            "send_notification"           -> sendNotification(payload)
            "send_agent_message"          -> sendAgentMessage(payload)
            "set_bedtime_schedule"        -> setBedtimeSchedule(payload)
            "set_total_screen_time_limit" -> setTotalScreenTimeLimit(payload)
            "get_bedtime_config"          -> getBedtimeConfig()
            "trigger_bedtime_lock"        -> triggerBedtimeLock(payload)
            else -> mapOf("error" to "Unknown action: $action")
        }
    } catch (e: Exception) {
        false to mapOf("error" to e.message)
    }

    // Wajib: balas dengan correlation ID yang sama
    ws.send(JSONObject().apply {
        put("id", id)
        put("type", "mcp_bridge_response")
        put("success", success)
        put("data", JSONObject(data as Map<*, *>))
        put("timestamp", System.currentTimeMillis())
    }.toString())
}
```

### `send_agent_message` — response contract

Field `userAction` wajib diisi sebelum mengirim response:

| Nilai `userAction` | Kondisi |
|---|---|
| `"dismissed"` | User menutup modal/banner tanpa aksi |
| `"extended"` | User menekan tombol wrap-up extension |
| `"acknowledged"` | User mengonfirmasi (modal menutup normal) |
