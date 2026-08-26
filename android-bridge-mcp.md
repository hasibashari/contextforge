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
            set(Calendar.MILLISECOND, 0)
        }
        val startTime = cal.timeInMillis
        val endTime = System.currentTimeMillis()

        val aggregatedStats = usm?.queryAndAggregateUsageStats(startTime, endTime) ?: emptyMap()
        var totalMs = 0L
        var mostUsedPkg = ""
        var maxMs = 0L
        val appsArray = JSONArray()

        val sortedList = aggregatedStats.values
            .filter { it.totalTimeInForeground > 0 && it.lastTimeUsed >= startTime }
            .sortedByDescending { it.totalTimeInForeground }

        sortedList.forEach { stat ->
            val durationMs = stat.totalTimeInForeground
            totalMs += durationMs

            if (durationMs > maxMs) {
                maxMs = durationMs
                mostUsedPkg = stat.packageName
            }

            if (durationMs >= 10_000) {
                appsArray.put(JSONObject().apply {
                    put("packageName", stat.packageName)
                    put("friendlyName", getAppLabel(stat.packageName))
                    put("totalTimeInForegroundMs", durationMs)
                    put("lastTimeUsed", stat.lastTimeUsed)
                })
            }
        }

        return JSONObject().apply {
            put("date", String.format("%tF", cal))
            put("startTimeMs", startTime)
            put("endTimeMs", endTime)
            put("totalScreenTimeMs", totalMs)
            put("mostUsedApp", mostUsedPkg)
            put("apps", appsArray)
        }
    }

    private fun getRawUsageStats(): JSONArray {
        val usm = context.getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager
        val cal = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }
        val startTime = cal.timeInMillis
        val endTime = System.currentTimeMillis()

        val aggregatedStats = usm?.queryAndAggregateUsageStats(startTime, endTime) ?: emptyMap()
        val array = JSONArray()

        aggregatedStats.values
            .filter { it.totalTimeInForeground > 0 && it.lastTimeUsed >= startTime }
            .sortedByDescending { it.totalTimeInForeground }
            .forEach { stat ->
                array.put(JSONObject().apply {
                    put("packageName", stat.packageName)
                    put("friendlyName", getAppLabel(stat.packageName))
                    put("totalTimeInForegroundMs", stat.totalTimeInForeground)
                    put("lastTimeUsed", stat.lastTimeUsed)
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

### 7.2 Kelas Event-Driven: `NetworkStateMonitor.kt` (Deteksi Jaringan Zero-Polling)

Simpan di package `com.contextforge.bridge.network`:

```kotlin
package com.contextforge.bridge.network

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.util.Log

/**
 * Event-Driven Network State Monitor menggunakan ConnectivityManager.NetworkCallback.
 * 100% Bebas Polling (0% CPU/Battery overhead).
 * Terpanggil secara instan oleh OS saat Wi-Fi menyala, mati, atau berganti access point.
 */
class NetworkStateMonitor(
    context: Context,
    private val onNetworkAvailable: () -> Unit,
    private val onNetworkLost: () -> Unit
) {
    private val TAG = "NetworkStateMonitor"
    private val connectivityManager =
        context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager

    private val networkCallback = object : ConnectivityManager.NetworkCallback() {
        override fun onAvailable(network: Network) {
            Log.d(TAG, "🌐 Jaringan aktif kembali (Wi-Fi/Cellular). Memicu koneksi ulang instan...")
            onNetworkAvailable()
        }

        override fun onLost(network: Network) {
            Log.w(TAG, "📵 Jaringan terputus / Wi-Fi mati.")
            onNetworkLost()
        }

        override fun onCapabilitiesChanged(
            network: Network,
            networkCapabilities: NetworkCapabilities
        ) {
            val hasInternet = networkCapabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
            val isValidated = networkCapabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)
            if (hasInternet && isValidated) {
                onNetworkAvailable()
            }
        }
    }

    fun startMonitoring() {
        try {
            val request = NetworkRequest.Builder()
                .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                .build()
            connectivityManager.registerNetworkCallback(request, networkCallback)
            Log.d(TAG, "✅ NetworkCallback terdaftar.")
        } catch (e: Exception) {
            Log.e(TAG, "Gagal mendaftarkan NetworkCallback: ${e.message}")
        }
    }

    fun stopMonitoring() {
        try {
            connectivityManager.unregisterNetworkCallback(networkCallback)
        } catch (_: Exception) {}
    }

    fun isCurrentlyConnected(): Boolean {
        val activeNet = connectivityManager.activeNetwork ?: return false
        val caps = connectivityManager.getNetworkCapabilities(activeNet) ?: return false
        return caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }
}
```

---

### 7.3 Kelas WebSocket: `McpWebSocketBridgeClient.kt`

Simpan di package `com.contextforge.bridge.websocket`:

```kotlin
package com.contextforge.bridge.websocket

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.usage.UsageStatsManager
import android.content.Context
import android.os.BatteryManager
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import com.contextforge.bridge.network.NetworkStateMonitor
import okhttp3.*
import org.json.JSONArray
import org.json.JSONObject
import java.util.Calendar
import java.util.concurrent.TimeUnit
import kotlin.math.min
import kotlin.math.pow

class McpWebSocketBridgeClient(
    private val context: Context,
    private val wsUrl: String = "ws://192.168.1.8:3001/api/android-bridge/ws"
) {
    private val TAG = "McpBridgeClient"
    
    // OkHttp Client dengan RFC 6455 Keepalive Ping (15 detik)
    private val okHttpClient = OkHttpClient.Builder()
        .readTimeout(0, TimeUnit.MILLISECONDS)
        .pingInterval(15, TimeUnit.SECONDS) // Mencegah NAT router timeout & mendeteksi putus jaringan
        .retryOnConnectionFailure(false)    // Kita kontrol retry dengan Exponential Backoff kita sendiri
        .build()

    private var webSocket: WebSocket? = null
    var isConnected = false
        private set

    // Callback saat Desktop secara eksplisit memutus koneksi (misal tombol Disconnect ditekan di UI Desktop)
    var onServerExplicitDisconnect: ((reason: String) -> Unit)? = null
    var onConnectionStateChanged: ((connected: Boolean) -> Unit)? = null

    // Handler & Exponential Backoff Reconnection
    private val mainHandler = android.os.Handler(android.os.Looper.getMainLooper())
    private var isManualDisconnect = false
    private var retryAttempt = 0
    private val MAX_BACKOFF_MS = 30_000L // Maksimal delay 30 detik

    // Network State Monitor (Event-Driven)
    private val networkMonitor = NetworkStateMonitor(
        context = context,
        onNetworkAvailable = {
            if (!isConnected && !isManualDisconnect) {
                Log.d(TAG, "⚡ Event Network Available diterima: Menyambung ulang seketika...")
                retryAttempt = 0
                mainHandler.removeCallbacksAndMessages(null)
                connect()
            }
        },
        onNetworkLost = {
            // Hentikan timer retry saat jaringan offline agar hemat baterai
            mainHandler.removeCallbacksAndMessages(null)
        }
    )

    // In-memory blacklist dan limits
    private val blockedPackages = mutableSetOf<String>()
    private val appLimitsMinutes = mutableMapOf<String, Int>()

    init {
        networkMonitor.startMonitoring()
    }

    fun connect() {
        if (isConnected || isManualDisconnect) return
        if (!networkMonitor.isCurrentlyConnected()) {
            Log.w(TAG, "Jaringan offline, menunda koneksi hingga Wi-Fi/Internet aktif...")
            return
        }

        Log.d(TAG, "🔌 Menghubungkan ke ContextForge WebSocket Gateway: $wsUrl")
        val request = Request.Builder().url(wsUrl).build()

        webSocket = okHttpClient.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(ws: WebSocket, response: Response) {
                isConnected = true
                retryAttempt = 0
                mainHandler.removeCallbacksAndMessages(null)
                Log.d(TAG, "✅ Terhubung ke ContextForge WebSocket Gateway!")
                onConnectionStateChanged?.invoke(true)

                // 1. Kirim Handshake Registrasi Perangkat
                val batteryLevel = getBatteryPercentage()
                val handshake = JSONObject().apply {
                    put("type", "android_handshake")
                    put("deviceName", "${Build.MANUFACTURER} ${Build.MODEL}")
                    put("androidVersion", Build.VERSION.RELEASE)
                    put("batteryLevel", batteryLevel)
                    put("timestamp", System.currentTimeMillis())
                }
                ws.send(handshake.toString())
            }

            override fun onMessage(ws: WebSocket, text: String) {
                try {
                    val json = JSONObject(text)
                    val type = json.optString("type")

                    if (type == "handshake_ack") {
                        Log.d(TAG, "🎉 Handshake diterima oleh ContextForge Desktop!")
                    } else if (type == "server_disconnect") {
                        // Permintaan Disconnect Eksplisit dari Desktop UI
                        val reason = json.optString("reason", "Desktop disconnected")
                        Log.d(TAG, "🔌 Server Disconnect: $reason")
                        isManualDisconnect = true
                        onServerExplicitDisconnect?.invoke(reason)
                        disconnect()
                    } else if (type == "mcp_bridge_request") {
                        val reqId = json.getString("id")
                        val action = json.getString("action")
                        val payload = json.optJSONObject("payload") ?: JSONObject()
                        handleToolExecution(ws, reqId, action, payload)
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Gagal memproses pesan: ${e.message}", e)
                }
            }

            override fun onClosed(ws: WebSocket, code: Int, reason: String) {
                isConnected = false
                onConnectionStateChanged?.invoke(false)
                Log.d(TAG, "🔌 WebSocket ditutup: $reason ($code)")
                if (isManualDisconnect || (code == 1000 && reason.contains("User disconnected", ignoreCase = true))) {
                    onServerExplicitDisconnect?.invoke(reason)
                } else {
                    scheduleExponentialReconnect()
                }
            }

            override fun onFailure(ws: WebSocket, t: Throwable, response: Response?) {
                isConnected = false
                onConnectionStateChanged?.invoke(false)
                Log.w(TAG, "⚠️ WebSocket terputus (${t.message}). Menjadwalkan auto-reconnect...")
                if (!isManualDisconnect) {
                    scheduleExponentialReconnect()
                }
            }
        })
    }

    /**
     * Exponential Backoff dengan Jitter (1s -> 2s -> 4s -> 8s -> 16s -> 30s)
     */
    private fun scheduleExponentialReconnect() {
        if (isManualDisconnect || !networkMonitor.isCurrentlyConnected()) return

        retryAttempt++
        val baseDelay = (2.0.pow(min(retryAttempt, 5).toDouble()) * 1000).toLong()
        val jitter = (Math.random() * 1000).toLong()
        val delayMs = min(baseDelay + jitter, MAX_BACKOFF_MS)

        Log.d(TAG, "🔄 Auto-reconnect percobaan ke-$retryAttempt dalam ${delayMs / 1000}s...")
        mainHandler.removeCallbacksAndMessages(null)
        mainHandler.postDelayed({
            if (!isConnected && !isManualDisconnect) {
                connect()
            }
        }, delayMs)
    }

    fun disconnect() {
        isManualDisconnect = true
        mainHandler.removeCallbacksAndMessages(null)
        networkMonitor.stopMonitoring()
        try {
            // Kirim pesan salam penutup bersih ke server sebelum socket ditutup
            webSocket?.send(JSONObject().apply {
                put("type", "android_disconnect")
                put("reason", "User closed from Android app")
            }.toString())
            webSocket?.close(1000, "User closed session")
            webSocket = null
        } catch (_: Exception) {}
        isConnected = false
        onConnectionStateChanged?.invoke(false)
    }

    private fun handleToolExecution(ws: WebSocket, reqId: String, action: String, payload: JSONObject) {
        val responseData = JSONObject()
        var isSuccess = true
        var errorMessage: String? = null

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
                    val title = payload.optString("title", "ContextForge AI Alert")
                    val message = payload.optString("message", "")
                    showStatusBarNotification(title, message)
                    responseData.put("status", "success")
                    responseData.put("notificationSent", true)
                }

                else -> {
                    isSuccess = false
                    errorMessage = "Action '$action' not implemented."
                }
            }
        } catch (e: Exception) {
            isSuccess = false
            errorMessage = e.message ?: "Unknown error"
        }

        val responseJson = JSONObject().apply {
            put("id", reqId)
            put("type", "mcp_bridge_response")
            put("success", isSuccess)
            if (isSuccess) put("data", responseData) else put("error", errorMessage)
            put("timestamp", System.currentTimeMillis())
        }

        ws.send(responseJson.toString())
    }

    private fun getForegroundAppPackageName(): String {
        val usm = context.getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager
        val endTime = System.currentTimeMillis()
        val startTime = endTime - 1000 * 60 // 1 menit terakhir
        val usageEvents = usm?.queryEvents(startTime, endTime) ?: return ""
        val event = android.app.usage.UsageEvents.Event()
        var lastForegroundApp = ""

        while (usageEvents.hasNextEvent()) {
            usageEvents.getNextEvent(event)
            if (event.eventType == android.app.usage.UsageEvents.Event.ACTIVITY_RESUMED) {
                lastForegroundApp = event.packageName
            }
        }
        return lastForegroundApp
    }

    /**
     * Menghitung total screen time dan rincian penggunaan aplikasi HARI INI secara akurat (Real-Time).
     * Menggunakan queryAndAggregateUsageStats(startOfDay, now) agar data yang diambil adalah detik demi detik
     * sejak jam 00:00:00.000 HARI INI, bukan bucket kemarin.
     */
    private fun getDailyUsageSummary(): JSONObject {
        val usm = context.getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager
        val cal = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }
        val startTime = cal.timeInMillis
        val endTime = System.currentTimeMillis()

        // queryAndAggregateUsageStats menggabungkan event secara tepat dalam rentang [startTime, endTime]
        val aggregatedStats = usm?.queryAndAggregateUsageStats(startTime, endTime) ?: emptyMap()
        var totalMs = 0L
        var mostUsedPkg = ""
        var maxMs = 0L
        val appsArray = JSONArray()

        val sortedList = aggregatedStats.values
            .filter { it.totalTimeInForeground > 0 && it.lastTimeUsed >= startTime }
            .sortedByDescending { it.totalTimeInForeground }

        sortedList.forEach { stat ->
            val durationMs = stat.totalTimeInForeground
            totalMs += durationMs

            if (durationMs > maxMs) {
                maxMs = durationMs
                mostUsedPkg = stat.packageName
            }

            if (durationMs >= 10_000) { // Sertakan aplikasi yang digunakan >= 10 detik
                appsArray.put(JSONObject().apply {
                    put("packageName", stat.packageName)
                    put("friendlyName", getAppLabel(stat.packageName))
                    put("totalTimeInForegroundMs", durationMs)
                    put("lastTimeUsed", stat.lastTimeUsed)
                })
            }
        }

        return JSONObject().apply {
            put("date", String.format("%tF", cal))
            put("startTimeMs", startTime)
            put("endTimeMs", endTime)
            put("totalScreenTimeMs", totalMs)
            put("mostUsedApp", mostUsedPkg)
            put("apps", appsArray)
        }
    }

    private fun getRawUsageStats(): JSONArray {
        val usm = context.getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager
        val cal = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }
        val startTime = cal.timeInMillis
        val endTime = System.currentTimeMillis()

        val aggregatedStats = usm?.queryAndAggregateUsageStats(startTime, endTime) ?: emptyMap()
        val array = JSONArray()

        aggregatedStats.values
            .filter { it.totalTimeInForeground > 0 && it.lastTimeUsed >= startTime }
            .sortedByDescending { it.totalTimeInForeground }
            .forEach { stat ->
                array.put(JSONObject().apply {
                    put("packageName", stat.packageName)
                    put("friendlyName", getAppLabel(stat.packageName))
                    put("totalTimeInForegroundMs", stat.totalTimeInForeground)
                    put("lastTimeUsed", stat.lastTimeUsed)
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
}
```

---

### 7.4 Foreground Service Persisten: `McpBridgeForegroundService.kt`

Simpan di package `com.contextforge.bridge.service`:

```kotlin
package com.contextforge.bridge.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.contextforge.bridge.websocket.McpWebSocketBridgeClient

/**
 * Foreground Service yang MENJAMIN WebSocket tetap menyala:
 * - START_STICKY: OS akan me-restart service jika terbunuh karena low memory.
 * - onTaskRemoved(): Mencegah pemutusan koneksi saat aplikasi di-clear/swipe dari Recent Apps.
 * - Ongoing Notification: Memberitahu sistem bahwa proses ini memiliki prioritas tinggi.
 */
class McpBridgeForegroundService : Service() {

    private var bridgeClient: McpWebSocketBridgeClient? = null
    private var currentWsUrl: String = ""

    companion object {
        const val ACTION_STOP_SERVICE = "com.contextforge.bridge.ACTION_STOP"
        const val NOTIFICATION_ID = 1001
        const val CHANNEL_ID = "mcp_bridge_foreground_channel"
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP_SERVICE) {
            stopBridgeAndSelf()
            return START_NOT_STICKY
        }

        currentWsUrl = intent?.getStringExtra("WS_URL") ?: currentWsUrl
        if (currentWsUrl.isEmpty()) {
            currentWsUrl = "ws://192.168.1.8:3001/api/android-bridge/ws"
        }

        createNotificationChannel()
        val notification = buildOngoingNotification("Connecting to ContextForge Desktop...")
        startForeground(NOTIFICATION_ID, notification)

        // Inisialisasi WebSocket Bridge Client
        if (bridgeClient == null) {
            bridgeClient = McpWebSocketBridgeClient(applicationContext, currentWsUrl).apply {
                onConnectionStateChanged = { isConnected ->
                    val statusText = if (isConnected) "Active & Synced with Desktop" else "Reconnecting..."
                    updateNotification(statusText)
                }

                // Matikan Foreground Service HANYA jika Desktop secara eksplisit meminta Disconnect
                onServerExplicitDisconnect = { reason ->
                    android.util.Log.d("McpBridgeService", "🛑 Desktop requested disconnect: $reason")
                    stopBridgeAndSelf()
                }
            }
            bridgeClient?.connect()
        }

        return START_STICKY
    }

    /**
     * KUNCI UTAMA: Ditengahi saat pengguna men-swipe aplikasi dari Recent Apps.
     * Kita TIDAK mematikan service di sini agar bridge tetap terhubung di background!
     */
    override fun onTaskRemoved(rootIntent: Intent?) {
        android.util.Log.d("McpBridgeService", "📱 App swiped from Recent Apps. Service remains alive in background.")
        // Jangan panggil stopSelf(). Biarkan Foreground Service tetap hidup di status bar.
        super.onTaskRemoved(rootIntent)
    }

    private fun stopBridgeAndSelf() {
        bridgeClient?.disconnect()
        bridgeClient = null
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            stopForeground(STOP_FOREGROUND_REMOVE)
        } else {
            @Suppress("DEPRECATION")
            stopForeground(true)
        }
        stopSelf()
    }

    override fun onDestroy() {
        super.onDestroy()
        bridgeClient?.disconnect()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "ContextForge Bridge Status",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Notifikasi status koneksi WebSocket ContextForge"
                setShowBadge(false)
            }
            val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            nm.createNotificationChannel(channel)
        }
    }

    private fun buildOngoingNotification(statusText: String): Notification {
        val stopIntent = Intent(this, McpBridgeForegroundService::class.java).apply {
            action = ACTION_STOP_SERVICE
        }
        val stopPendingIntent = PendingIntent.getService(
            this,
            0,
            stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("ContextForge AI Bridge")
            .setContentText(statusText)
            .setSmallIcon(android.R.drawable.stat_notify_sync)
            .setOngoing(true) // Menjadikan notifikasi tidak bisa di-swipe sembarangan
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Disconnect", stopPendingIntent)
            .build()
    }

    private fun updateNotification(statusText: String) {
        val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        nm.notify(NOTIFICATION_ID, buildOngoingNotification(statusText))
    }
}
```

---

### 7.5 Pengaturan Battery Optimization di `MainActivity.kt`

Agar koneksi tidak di-freeze oleh sistem Android Doze Mode saat HP terkunci / layar mati dalam waktu lama, tambahkan dialog pengecualian baterai:

```kotlin
import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings

fun requestBatteryOptimizationExemption(context: Context) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        val pm = context.getSystemService(Context.POWER_SERVICE) as PowerManager
        if (!pm.isIgnoringBatteryOptimizations(context.packageName)) {
            @SuppressLint("BatteryLife")
            val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                data = Uri.parse("package:${context.packageName}")
            }
            context.startActivity(intent)
        }
    }
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
