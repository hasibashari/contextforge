# 05 - Wireless Debugging Setup

## 🎯 Tujuan

Menghubungkan HP Android ke WSL menggunakan ADB via WiFi (tanpa kabel USB).

Metode ini cocok untuk:
- WSL environment
- Developer yang tidak mau pakai usbipd
- Setup clean tanpa Android Studio

---

# 🧠 Syarat

- Android 11+
- Laptop & HP dalam 1 WiFi
- Developer Options aktif

---

# 1️⃣ Aktifkan di HP

Masuk ke:

Settings → Developer Options →  
Aktifkan:

- ✅ Wireless Debugging

Masuk ke:

Wireless Debugging →  
Pilih: **Pair device with pairing code**

Akan muncul:

IP & Port: 192.168.1.X:PORT_A  
Pairing Code: 6 digit angka

Contoh:

IP: 192.168.1.2:41405  
Code: 701108  

---

# 2️⃣ Pair dari WSL

Jalankan:

```bash
adb pair 192.168.1.2:41405
````

Masukkan pairing code.

Jika sukses:

```
Successfully paired
```

⚠️ Port pairing ≠ port debugging

---

# 3️⃣ Connect ke Port Debugging

Di layar Wireless Debugging HP akan ada:

IP address & Port  
Biasanya seperti:

192.168.1.2:5555

Gunakan itu untuk connect:

```bash
adb connect 192.168.1.2:5555
```

Jika sukses:

```
connected to 192.168.1.2:5555
```

---

# 4️⃣ Verifikasi

```bash
adb devices
```

Output harus seperti:

```
192.168.1.2:5555 device
```

Lalu cek Flutter:

```bash
flutter devices
```

Device Android harus muncul.

---

# 🔁 Jika Device Tidak Muncul

Coba:

```bash
adb disconnect
adb connect 192.168.1.2:5555
```

Pastikan:

- WiFi sama
    
- Firewall tidak blokir
    
- HP tidak sleep
    

---

# 🧹 Jika Ganti WiFi

Kamu perlu:

- Pair ulang
    
- Connect ulang
    

---

# 🚀 Test Run

```bash
flutter run
```

Jika muncul error:

INSTALL_FAILED_USER_RESTRICTED

Pastikan kamu tekan "Allow" di HP.

---

# 📌 Checklist

-  Wireless Debugging aktif
    
-  adb pair berhasil
    
-  adb connect berhasil
    
-  adb devices muncul
    
-  flutter run sukses
    

---

→ [[06 - Struktur Project Profesional.md]]
