# 📱 Android MCP Bridge & Digital Wellbeing Specification (v2.0 WebSocket)

Dokumentasi spesifikasi teknis, arsitektur WebSocket Reverse Bridge, hak akses, protokol pairing QR Code, katalog 9 MCP Tools, dan kode implementasi **Kotlin** lengkap untuk diintegrasikan di aplikasi **Android Studio** dengan **ContextForge Desktop**.

---

## 1. 📋 Ringkasan Sistem

**Android MCP Bridge** menghubungkan perangkat smartphone Android ke **AI Agent** ContextForge melalui arsitektur **WebSocket Reverse Bridge** (seperti _WhatsApp Web_).

Dengan arsitektur ini:

- Smartphone bertindak sebagai **klien WebSocket keluar (outbound)** ke Desktop Gateway (`ws://<DESKTOP_IP>:3001/api/android-bridge/ws`).
- **Tidak memerlukan server Ktor di HP**, sehingga **100% bebas dari masalah firewall, pemblokiran port, dan perubahan IP Wi-Fi**.
- AI Agent dapat memanggil 9 tool MCP secara _realtime_ dua arah (_bidirectional RPC_) untuk membaca _Digital Wellbeing_, mengatur _App Limits_, memblokir aplikasi pengganggu, mengubah mode _DND_, dan mengirim notifikasi status bar.

---

## 2. 🏗️ Arsitektur Integrasi

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                          DESKTOP: CONTEXTFORGE                          │
│             (NestJS Backend + React Vite + Gemini 3.5 Flash)            │
│                                                                         │
│    [WebSocket Gateway: ws://<DESKTOP_IP>:3001/api/android-bridge/ws]    │
└─────────────────────────────────────────────────────────────────────────┘
                                   ▲
                                   │  (Koneksi WebSocket 2-Arah)
         [1] Scan QR Code ─────────┤  - Mengambil URL WebSocket & PIN Sesi
         [2] Handshake Outbound ───┤  - HP mengirim info perangkat & baterai
         [3] Bidirectional RPC ────┘  - AI Agent memanggil Tools secara Realtime
                                   │
┌─────────────────────────────────────────────────────────────────────────┐
│                       ANDROID DEVICE (SMARTPHONE)                       │
│                                                                         │
│  +───────────────────────────────────────────────────────────────────+  │
│  |       McpBridgeForegroundService + McpWebSocketBridgeClient       |  │
│  |                      (OkHttp WebSocket Client)                    |  │
│  +───────────────────────────────────────────────────────────────────+  │
│                                  │                                      │
│       +--------------------------+---------------------------+          │
│       │                          │                           │          │
│       ▼                          ▼                           ▼          │
│  +----------------+      +------------------+      +----------------+   │
│  | UsageStats     |      | AppBlockManager  |      | SystemControl  |   │
│  | Manager        |      | (Accessibility & |      | (DND Policy &  |   │
│  | (Wellbeing)    |      |  Overlay Alert)  |      |  Notifikasi)   |   │
│  +----------------+      +------------------+      +----------------+   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. 📷 Protokol Pairing QR Code & WebSocket Handshake

### 3.1 Format Payload QR Code (Dari Layar Laptop)

Ketika modal Android Bridge dibuka di ContextForge Desktop, QR Code menampilkan data JSON berikut:

```json
{
  "protocol": "contextforge-mcp-bridge",
  "version": "2.0",
  "sessionId": "pair_787f52221ad2",
  "pinCode": "155384",
  "formattedPin": "155-384",
  "wsUrl": "ws://192.168.1.8:3001/api/android-bridge/ws",
  "desktopHost": "192.168.1.8",
  "desktopPort": 3001,
  "expiresAt": 1787676682817
}
```

### 3.2 Alur Komunikasi (Sequence Flow)

```text
Aplikasi Android                                      Desktop Backend
  (Kamera HP)                                       (ContextForge PC)
       │                                                    │
       │─── 1. Pindai QR Code ─────────────────────────────►│ (Baca wsUrl & sessionId)
       │                                                    │
       │─── 2. Connect WebSocket ke wsUrl ─────────────────►│ (ws://192.168.1.8:3001/api/android-bridge/ws)
       │                                                    │
       │─── 3. Kirim "android_handshake" (JSON) ───────────►│ (Kirim nama HP, OS, baterai)
       │◄── 4. Terima "handshake_ack" (JSON) ───────────────│ (Pairing Resmi Aktif di DB)
       │                                                    │
       │====================================================│
       │      SESI AKTIF: AI AGENT DAPAT MEMANGGIL TOOLS    │
       │====================================================│
       │                                                    │
       │◄── 5. "mcp_bridge_request" (action: "...") ────────│ (AI butuh data HP)
       │─── 6. "mcp_bridge_response" (data: { ... }) ──────►│ (HP kirim balik hasil)
       │                                                    │
```

---

## 4. 🔒 Hak Akses Android (Permissions & AndroidManifest.xml)

Tambahkan hak akses berikut pada file `AndroidManifest.xml` aplikasi Android Anda:

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

    <!-- Jaringan Internet & WebSocket -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />

    <!-- Foreground Service agar WebSocket tidak terputus saat layar mati -->
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_CONNECTED_DEVICE" />

    <!-- Kamera untuk Scan QR Code -->
    <uses-permission android:name="android.permission.CAMERA" />

    <!-- Digital Wellbeing & Screen Time Telemetry (Izin Khusus) -->
    <uses-permission
        android:name="android.permission.PACKAGE_USAGE_STATS"
        tools:ignore="ProtectedPermissions" />

    <!-- Overlay Pemblokir Aplikasi (Draw Over Other Apps) -->
    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />

    <!-- Kontrol Mode Jangan Ganggu (DND) & Notifikasi Status Bar -->
    <uses-permission android:name="android.permission.ACCESS_NOTIFICATION_POLICY" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="ContextForge Bridge"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.ContextForgeBridge"
        android:usesCleartextTraffic="true">

        <!-- Service Background WebSocket -->
        <service
            android:name=".service.McpBridgeForegroundService"
            android:foregroundServiceType="connectedDevice"
            android:exported="false" />

    </application>
</manifest>
```

---

## 5. ⚡ Spesifikasi Protokol WebSocket RPC (JSON Contract)

### 5.1 Pesan Handshake (Android $\rightarrow$ Backend)

Dikirim segera setelah WebSocket terbuka (`onOpen`):

```json
{
  "type": "android_handshake",
  "deviceName": "Samsung Galaxy S24 Ultra",
  "androidVersion": "14",
  "batteryLevel": 92
}
```

### 5.2 Balasan Handshake ACK (Backend $\rightarrow$ Android)

```json
{
  "type": "handshake_ack",
  "success": true,
  "message": "Connected to ContextForge MCP Bridge"
}
```

### 5.3 Format Permintaan Tool dari AI (Backend $\rightarrow$ Android)

```json
{
  "id": "req-1787676382-abc",
  "type": "mcp_bridge_request",
  "action": "get_foreground_app",
  "payload": {},
  "timestamp": 1787676382000
}
```

### 5.4 Format Balasan Hasil Tool (Android $\rightarrow$ Backend)

```json
{
  "id": "req-1787676382-abc",
  "type": "mcp_bridge_response",
  "success": true,
  "data": {
    "currentForegroundApp": "com.whatsapp",
    "friendlyName": "WhatsApp"
  },
  "timestamp": 1787676382045
}
```

---

## 6. 🛠️ Katalog 9 MCP Tools & Skema Payload

Berikut adalah 9 `action` yang dapat dikirimkan oleh backend ke aplikasi Android:

| Action Name               | Parameter Payload                                                 | Output Data Format                                                     | Deskripsi                                              |
| :------------------------ | :---------------------------------------------------------------- | :--------------------------------------------------------------------- | :----------------------------------------------------- |
| `get_device_status`       | `{}`                                                              | `{"status": "ok", "device": "..."}`                                    | Cek ketersediaan perangkat & izin.                     |
| `get_foreground_app`      | `{}`                                                              | `{"currentForegroundApp": "com.whatsapp", "friendlyName": "WhatsApp"}` | Deteksi aplikasi yang sedang dibuka pengguna di layar. |
| `get_usage_summary`       | `{}`                                                              | `{"date": "2026-08-25", "totalScreenTimeMs": 7200000, "apps": [...]}`  | Ringkasan screen time harian & daftar top apps.        |
| `get_usage`               | `{"days": 1}`                                                     | `[{"packageName": "...", "totalTimeInForegroundMs": ...}]`             | Data mentah durasi tiap aplikasi.                      |
| `set_app_limit`           | `{"packageName": "com.instagram.android", "maxDailyMinutes": 45}` | `{"status": "success", "message": "..."}`                              | Pasang kuota batas waktu harian.                       |
| `block_app`               | `{"packageName": "com.tiktok.android", "block": true}`            | `{"status": "success", "message": "..."}`                              | Blokir atau buka blokir aplikasi seketika.             |
| `get_active_restrictions` | `{}`                                                              | `{"limits": [...], "blockedApps": [...]}`                              | Ambil daftar limit dan aplikasi yang sedang diblokir.  |
| `set_dnd`                 | `{"enable": true}`                                                | `{"status": "success", "dndActive": true}`                             | Mengaktifkan/menonaktifkan mode Do Not Disturb.        |
| `send_notification`       | `{"title": "...", "message": "..."}`                              | `{"status": "success", "notificationSent": true}`                      | Munculkan notifikasi status bar di smartphone.         |

---

## 7. 💻 Kode Implementasi Lengkap di Kotlin (Android Studio)

### 7.1 Tambahkan Dependencies di `app/build.gradle.kts`

```kotlin
dependencies {
    // OkHttp untuk Koneksi WebSocket
    implementation("com.squareup.okhttp3:okhttp:4.12.0")

    // QR Code Scanner (ZXing / CameraX)
    implementation("com.journeyapps:zxing-android-embedded:4.3.0")

    // Coroutines & Lifecycle
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.0")
    implementation("androidx.lifecycle:lifecycle-service:2.7.0")
}
```

---

### 7.2 Kelas Utama: `McpWebSocketBridgeClient.kt`

Simpan di package `com.contextforge.bridge.websocket`:

```kotlin
package com.contextforge.bridge.websocket

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.os.BatteryManager
import android.os.Build
import android.provider.Settings
import android.util.Log
import androidx.core.app.NotificationCompat
import okhttp3.*
import org.json.JSONArray
import org.json.JSONObject
import java.util.Calendar
import java.util.concurrent.TimeUnit

class McpWebSocketBridgeClient(
    private val context: Context,
    private val wsUrl: String = "ws://192.168.1.8:3001/api/android-bridge/ws"
) {
    private val TAG = "McpBridge"
    private val okHttpClient = OkHttpClient.Builder()
        .readTimeout(0, TimeUnit.MILLISECONDS)
        .pingInterval(15, TimeUnit.SECONDS)
        .retryOnConnectionFailure(true)
        .build()

    private var webSocket: WebSocket? = null
    var isConnected = false
        private set

    // Callback saat Desktop secara eksplisit memutus koneksi
    var onServerExplicitDisconnect: ((reason: String) -> Unit)? = null

    // Handler untuk auto-reconnect di background
    private val mainHandler = android.os.Handler(android.os.Looper.getMainLooper())
    private var isManualDisconnect = false

    // In-memory blacklist dan limits
    private val blockedPackages = mutableSetOf<String>()
    private val appLimitsMinutes = mutableMapOf<String, Int>()

    fun connect() {
        isManualDisconnect = false
        val request = Request.Builder().url(wsUrl).build()
        webSocket = okHttpClient.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(ws: WebSocket, response: Response) {
                isConnected = true
                Log.d(TAG, "✅ Terhubung ke ContextForge WebSocket Gateway: $wsUrl")

                // 1. Kirim Handshake Registrasi
                val batteryLevel = getBatteryPercentage()
                val handshake = JSONObject().apply {
                    put("type", "android_handshake")
                    put("deviceName", "${Build.MANUFACTURER} ${Build.MODEL}")
                    put("androidVersion", Build.VERSION.RELEASE)
                    put("batteryLevel", batteryLevel)
                }
                ws.send(handshake.toString())
            }

            override fun onMessage(ws: WebSocket, text: String) {
                Log.d(TAG, "📩 Pesan masuk: $text")
                try {
                    val json = JSONObject(text)
                    val type = json.optString("type")

                    if (type == "handshake_ack") {
                        Log.d(TAG, "🎉 Handshake diterima oleh ContextForge Desktop!")
                    } else if (type == "server_disconnect") {
                        // 🛑 Permintaan Disconnect Eksplisit dari Desktop UI
                        val reason = json.optString("reason", "Desktop disconnected")
                        Log.d(TAG, "🔌 Server Disconnect: $reason")
                        isManualDisconnect = true
                        onServerExplicitDisconnect?.invoke(reason)
                        disconnect()
                    } else if (type == "mcp_bridge_request") {
                        val reqId = json.getString("id")
                        val action = json.getString("action")
                        val payload = json.optJSONObject("payload") ?: JSONObject()

                        // Proses eksekusi tool di background thread
                        handleToolExecution(ws, reqId, action, payload)
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Gagal memproses pesan: ${e.message}", e)
                }
            }

            override fun onClosed(ws: WebSocket, code: Int, reason: String) {
                isConnected = false
                Log.d(TAG, "🔌 WebSocket terputus: $reason ($code)")
                if (isManualDisconnect || (code == 1000 && reason.contains("Server", ignoreCase = true))) {
                    onServerExplicitDisconnect?.invoke(reason)
                } else {
                    scheduleReconnect()
                }
            }

            override fun onFailure(ws: WebSocket, t: Throwable, response: Response?) {
                isConnected = false
                Log.w(TAG, "⚠️ WebSocket drop sementara (${t.message}). Auto-reconnecting in background...")
                if (!isManualDisconnect) {
                    scheduleReconnect()
                }
            }
        })
    }

    private fun scheduleReconnect() {
        mainHandler.removeCallbacksAndMessages(null)
        mainHandler.postDelayed({
            if (!isConnected && !isManualDisconnect) {
                Log.d(TAG, "🔄 Mencoba menghubungkan kembali (Auto-reconnect)...")
                connect()
            }
        }, 3000)
    }

    fun disconnect() {
        isManualDisconnect = true
        mainHandler.removeCallbacksAndMessages(null)
        try {
            webSocket?.close(1000, "Client Disconnected")
            webSocket = null
        } catch (e: Exception) {
            // Ignore
        }
        isConnected = false
    }

    private fun handleToolExecution(ws: WebSocket, reqId: String, action: String, payload: JSONObject) {
        val responseData = JSONObject()
        var isSuccess = true

        try {
            when (action) {
                "get_device_status" -> {
                    responseData.put("status", "ok")
                    responseData.put("device", "${Build.MANUFACTURER} ${Build.MODEL}")
                    responseData.put("androidVersion", Build.VERSION.RELEASE)
                    responseData.put("batteryLevel", getBatteryPercentage())
                }

                "get_foreground_app" -> {
                    val currentApp = getForegroundAppPackageName()
                    responseData.put("currentForegroundApp", currentApp)
                    responseData.put("friendlyName", getAppLabel(currentApp))
                }

                "get_usage_summary" -> {
                    val summary = getDailyUsageSummary()
                    responseData.put("date", summary.optString("date"))
                    responseData.put("totalScreenTimeMs", summary.optLong("totalScreenTimeMs"))
                    responseData.put("mostUsedApp", summary.optString("mostUsedApp"))
                    responseData.put("apps", summary.optJSONArray("apps"))
                }

                "get_usage" -> {
                    val usageList = getRawUsageStats()
                    responseData.put("apps", usageList)
                }

                "set_app_limit" -> {
                    val pkg = payload.getString("packageName")
                    val limit = payload.getInt("maxDailyMinutes")
                    appLimitsMinutes[pkg] = limit
                    responseData.put("status", "success")
                    responseData.put("message", "Limit of $limit minutes set for $pkg")
                }

                "block_app" -> {
                    val pkg = payload.getString("packageName")
                    val block = payload.getBoolean("block")
                    if (block) blockedPackages.add(pkg) else blockedPackages.remove(pkg)
                    responseData.put("status", "success")
                    responseData.put("message", "App $pkg block state set to $block")
                }

                "get_active_restrictions" -> {
                    val limitsArray = JSONArray()
                    appLimitsMinutes.forEach { (pkg, limit) ->
                        limitsArray.put(JSONObject().apply {
                            put("packageName", pkg)
                            put("maxDailyMinutes", limit)
                            put("isBlocked", blockedPackages.contains(pkg))
                        })
                    }
                    val blockedArray = JSONArray(blockedPackages.toList())
                    responseData.put("limits", limitsArray)
                    responseData.put("blockedApps", blockedArray)
                }

                "set_dnd" -> {
                    val enable = payload.getBoolean("enable")
                    setDoNotDisturb(enable)
                    responseData.put("status", "success")
                    responseData.put("dndActive", enable)
                }

                "send_notification" -> {
                    val title = payload.getString("title")
                    val message = payload.getString("message")
                    showStatusBarNotification(title, message)
                    responseData.put("status", "success")
                    responseData.put("notificationSent", true)
                }

                else -> {
                    isSuccess = false
                    responseData.put("error", "Unknown MCP tool action: $action")
                }
            }
        } catch (e: Exception) {
            isSuccess = false
            responseData.put("error", e.message ?: "Execution failed")
        }

        // Kirim response RPC balik ke Desktop
        val rpcResponse = JSONObject().apply {
            put("id", reqId)
            put("type", "mcp_bridge_response")
            put("success", isSuccess)
            put("data", responseData)
            put("timestamp", System.currentTimeMillis())
        }

        ws.send(rpcResponse.toString())
        Log.d(TAG, "📤 Mengirim balasan tool untuk $action (ID: $reqId)")
    }

    // --- Helper Methods ---

    private fun getForegroundAppPackageName(): String {
        val usm = context.getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager
            ?: return "unknown"
        val time = System.currentTimeMillis()
        val events = usm.queryEvents(time - 1000 * 60, time)
        var lastForegroundApp = "com.android.launcher"

        val event = UsageEvents.Event()
        while (events.hasNextEvent()) {
            events.getNextEvent(event)
            if (event.eventType == UsageEvents.Event.ACTIVITY_RESUMED) {
                lastForegroundApp = event.packageName
            }
        }
        return lastForegroundApp
    }

    private fun getDailyUsageSummary(): JSONObject {
        val usm = context.getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager
        val cal = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
        }
        val startTime = cal.timeInMillis
        val endTime = System.currentTimeMillis()

        val stats = usm?.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, startTime, endTime) ?: emptyList()
        var totalMs = 0L
        var mostUsedPkg = ""
        var maxMs = 0L
        val appsArray = JSONArray()

        stats.filter { it.totalTimeInForeground > 60000 }.sortedByDescending { it.totalTimeInForeground }.forEach { stat ->
            totalMs += stat.totalTimeInForeground
            if (stat.totalTimeInForeground > maxMs) {
                maxMs = stat.totalTimeInForeground
                mostUsedPkg = stat.packageName
            }
            appsArray.put(JSONObject().apply {
                put("packageName", stat.packageName)
                put("totalTimeInForegroundMs", stat.totalTimeInForeground)
                put("lastTimeUsed", stat.lastTimeUsed)
            })
        }

        return JSONObject().apply {
            put("date", String.format("%tF", cal))
            put("totalScreenTimeMs", totalMs)
            put("mostUsedApp", mostUsedPkg)
            put("apps", appsArray)
        }
    }

    private fun getRawUsageStats(): JSONArray {
        val usm = context.getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager
        val startTime = System.currentTimeMillis() - 24 * 60 * 60 * 1000
        val stats = usm?.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, startTime, System.currentTimeMillis()) ?: emptyList()
        val array = JSONArray()
        stats.filter { it.totalTimeInForeground > 0 }.forEach {
            array.put(JSONObject().apply {
                put("packageName", it.packageName)
                put("totalTimeInForegroundMs", it.totalTimeInForeground)
                put("lastTimeUsed", it.lastTimeUsed)
            })
        }
        return array
    }

    private fun setDoNotDisturb(enable: Boolean) {
        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && nm != null && nm.isNotificationPolicyAccessGranted) {
            val filter = if (enable) NotificationManager.INTERRUPTION_FILTER_PRIORITY else NotificationManager.INTERRUPTION_FILTER_ALL
            nm.setInterruptionFilter(filter)
        }
    }

    private fun showStatusBarNotification(title: String, message: String) {
        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager ?: return
        val channelId = "contextforge_mcp_channel"

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(channelId, "ContextForge AI Alerts", NotificationManager.IMPORTANCE_HIGH)
            nm.createNotificationChannel(channel)
        }

        val notif = NotificationCompat.Builder(context, channelId)
            .setContentTitle(title)
            .setContentText(message)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .build()

        nm.notify(System.currentTimeMillis().toInt(), notif)
    }

    private fun getBatteryPercentage(): Int {
        val bm = context.getSystemService(Context.BATTERY_SERVICE) as? BatteryManager
        return bm?.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY) ?: 100
    }

    private fun getAppLabel(packageName: String): String {
        return try {
            val pm = context.packageManager
            val info = pm.getApplicationInfo(packageName, 0)
            pm.getApplicationLabel(info).toString()
        } catch (_: Exception) {
            packageName
        }
    }

    fun disconnect() {
        webSocket?.close(1000, "User closed session")
        webSocket = null
        isConnected = false
    }
}
```

---

### 7.3 Background Foreground Service: `McpBridgeForegroundService.kt`

Simpan di package `com.contextforge.bridge.service`:

```kotlin
package com.contextforge.bridge.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.contextforge.bridge.websocket.McpWebSocketBridgeClient

class McpBridgeForegroundService : Service() {

    private var bridgeClient: McpWebSocketBridgeClient? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val wsUrl = intent?.getStringExtra("WS_URL") ?: "ws://192.168.1.8:3001/api/android-bridge/ws"

        // Buat Notification Channel untuk Foreground Service
        val channelId = "mcp_bridge_service_channel"
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "ContextForge Bridge Active",
                NotificationManager.IMPORTANCE_LOW
            )
            val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            nm.createNotificationChannel(channel)
        }

        val notification: Notification = NotificationCompat.Builder(this, channelId)
            .setContentTitle("ContextForge AI Bridge Active")
            .setContentText("Connected to desktop via WebSocket")
            .setSmallIcon(android.R.drawable.stat_notify_sync)
            .build()

        startForeground(1001, notification)

        // Inisialisasi dan hubungkan WebSocket
        bridgeClient?.disconnect()
        bridgeClient = McpWebSocketBridgeClient(applicationContext, wsUrl).apply {
            // 🛑 Matikan Foreground Service HANYA jika Desktop secara eksplisit meminta Disconnect
            onServerExplicitDisconnect = { reason ->
                android.util.Log.d("McpBridgeService", "🛑 Desktop requested disconnect: $reason")
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                    stopForeground(STOP_FOREGROUND_REMOVE)
                } else {
                    @Suppress("DEPRECATION")
                    stopForeground(true)
                }
                stopSelf()
            }
        }
        bridgeClient?.connect()

        return START_STICKY
    }

    override fun onDestroy() {
        super.onDestroy()
        bridgeClient?.disconnect()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
```

---

### 7.4 Cara Memulai Service dari Activity / QR Scanner:

```kotlin
// Setelah membaca hasil QR Code:
val qrJson = JSONObject(scannedResult)
val wsUrl = qrJson.optString("wsUrl", "ws://192.168.1.8:3001/api/android-bridge/ws")

val serviceIntent = Intent(this, McpBridgeForegroundService::class.java).apply {
    putExtra("WS_URL", wsUrl)
}

if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
    startForegroundService(serviceIntent)
} else {
    startService(serviceIntent)
}
```

---

## 8. 🔌 Mode Alternatif: USB Cable (ADB Port Forwarding)

Jika Anda sedang bekerja di lingkungan tanpa Wi-Fi atau jaringan kampus yang mengisolasi antar perangkat:

1. Hubungkan HP ke laptop/PC dengan kabel data USB.
2. Aktifkan **USB Debugging** di menu _Developer Options_ Android.
3. Buka terminal di laptop dan jalankan:
   ```bash
   adb forward tcp:8080 tcp:8080
   ```
4. Di modal ContextForge, pilih tab **`USB Cable (ADB)`** dan klik **Connect**.
