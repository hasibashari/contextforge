# 04 - Fix Common Errors

## 🎯 Tujuan

Mengatasi error umum saat setup Flutter + Android SDK di WSL.

Bagian ini penting karena error build Android sering muncul di tahap awal.

---

# 🧨 1️⃣ Error: NDK source.properties Missing

## ❌ Error Contoh:

[CXX1101] NDK did not have a source.properties file

## 🧠 Penyebab:

- Download NDK terputus
- Folder NDK corrupt

## ✅ Solusi:

```bash
rm -rf ~/Android/Sdk/ndk
sdkmanager "ndk;28.2.13676358"
````

Cek:

```bash
ls ~/Android/Sdk/ndk/28.2.13676358
```

Harus ada:

```plaintext
source.properties
```

---

# 🧨 2️⃣ Error: JAVA_COMPILER Missing

## ❌ Error Contoh:

does not provide required capabilities: [JAVA_COMPILER]

## 🧠 Penyebab:

- Hanya JRE terinstall
    
- `javac` tidak ada
    

## ✅ Solusi:

```bash
sudo apt install openjdk-21-jdk -y
```

Set JAVA_HOME:

```bash
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
export PATH=$JAVA_HOME/bin:$PATH
```

---

# 🧨 3️⃣ Error: Gradle Workspace Metadata Corrupt

## ❌ Error Contoh:

Could not read workspace metadata from ~/.gradle/...

## 🧠 Penyebab:

- Gradle cache rusak
    
- Build dihentikan paksa
    
- Ganti versi Java
    

## ✅ Solusi Bersih:

```bash
rm -rf ~/.gradle
flutter clean
```

Build ulang:

```bash
flutter run
```

⚠️ Build pertama akan lebih lama.

---

# 🧨 4️⃣ Error: INSTALL_FAILED_USER_RESTRICTED

## ❌ Error Contoh:

INSTALL_FAILED_USER_RESTRICTED

## 🧠 Penyebab:

HP menolak install aplikasi debug.

## ✅ Solusi:

Di HP:

- Developer Options → aktifkan debugging
    
- Izinkan install via debugging
    
- Pastikan tekan "Allow" saat popup muncul
    

---

# 🧨 5️⃣ ADB Device Tidak Terdeteksi

## ❌ Error:

adb devices kosong

## 🧠 Penyebab (WSL):

WSL tidak melihat USB langsung.

## ✅ Solusi:

Gunakan Wireless Debugging (lihat materi berikutnya).

---

# 🧹 6️⃣ Reset Total Jika Kacau

Kalau build terasa aneh dan tidak jelas errornya:

```bash
rm -rf ~/.gradle
flutter clean
flutter pub get
```

---

# 📌 Checklist

-  NDK valid
    
-  JDK lengkap
    
-  Gradle bersih
    
-  HP mengizinkan install
    

---

→ [[05 - Wireless Debugging Setup.md]]