# 03 - Install Android SDK CLI

## 🎯 Tujuan

Menginstall Android SDK tanpa Android Studio menggunakan Command Line Tools.

Setup ini ringan, clean, dan profesional untuk environment WSL.

---

# 1️⃣ Buat Folder SDK

```bash
mkdir -p $HOME/Android/Sdk/cmdline-tools
cd $HOME/Android/Sdk/cmdline-tools
````

---

# 2️⃣ Download Command Line Tools

```bash
curl -O https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip
unzip commandlinetools-linux-11076708_latest.zip
mv cmdline-tools latest
```

Struktur harus menjadi:

```
~/Android/Sdk/cmdline-tools/latest/bin
```

Cek:

```bash
ls ~/Android/Sdk/cmdline-tools/latest/bin
```

Harus ada:

```
sdkmanager
```

---

# 3️⃣ Set Environment Variable Android

Buka `.bashrc`:

```bash
nano ~/.bashrc
```

Tambahkan:

```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH
```

Apply:

```bash
source ~/.bashrc
```

Cek:

```bash
sdkmanager --version
```

Kalau muncul versi → berhasil.

---

# 4️⃣ Terima License

```bash
sdkmanager --licenses
```

Tekan `y` sampai selesai.

---

# 5️⃣ Install Komponen yang Dibutuhkan Flutter

Install:

```bash
sdkmanager "platform-tools"
sdkmanager "platforms;android-36"
sdkmanager "build-tools;36.0.0"
sdkmanager "ndk;28.2.13676358"
```

---

# 6️⃣ Hubungkan SDK ke Flutter

```bash
flutter config --android-sdk $HOME/Android/Sdk
```

Cek:

```bash
flutter doctor
```

Bagian ini harus muncul:

```
[✓] Android toolchain
```

---

# 📦 Struktur SDK Akhir

```
Android/Sdk/
 ├── cmdline-tools/
 ├── platform-tools/
 ├── platforms/
 ├── build-tools/
 └── ndk/
```

---

# 🧠 Catatan Penting

- `platform-tools` → berisi adb
    
- `platforms;android-36` → compile target
    
- `build-tools` → proses build
    
- `ndk` → dibutuhkan beberapa plugin Flutter
    

---

# 📌 Checklist

-  sdkmanager bisa dijalankan
    
-  platform-tools terinstall
    
-  android-36 ada di folder platforms
    
-  flutter doctor Android toolchain ✔️
    

---

→ [[04 - Fix Common Errors.md]]