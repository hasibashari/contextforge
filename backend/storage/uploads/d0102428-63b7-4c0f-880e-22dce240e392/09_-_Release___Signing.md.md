# 09 - Release & Signing

## 🎯 Tujuan

Menyiapkan aplikasi Flutter untuk:

- Build APK release
- Signing dengan keystore
- Siap upload ke Play Store

---

# 🧠 Perbedaan Debug vs Release

| Debug | Release |
|--------|----------|
| Untuk development | Untuk production |
| Lebih lambat | Lebih cepat |
| Tidak signed | Harus signed |
| Bisa pakai hot reload | Tidak |

---

# 1️⃣ Build APK Release

Masuk ke folder project:

```bash
flutter build apk --release
````

Output ada di:

```
build/app/outputs/flutter-apk/app-release.apk
```

---

# 2️⃣ Buat Keystore (Sekali Seumur Project)

Masuk ke folder project root:

```bash
keytool -genkey -v \
  -keystore upload-keystore.jks \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -alias upload
```

Simpan password baik-baik ⚠️  
Jangan hilangkan file ini.

---

# 3️⃣ Buat File key.properties

Di folder:

```
android/
```

Buat file:

```
key.properties
```

Isi:

```properties
storePassword=PASSWORD_KAMU
keyPassword=PASSWORD_KAMU
keyAlias=upload
storeFile=../upload-keystore.jks
```

⚠️ Jangan upload file ini ke GitHub.

---

# 4️⃣ Edit build.gradle.kts (Android)

Buka:

```
android/app/build.gradle.kts
```

Tambahkan konfigurasi signing:

```kotlin
signingConfigs {
    create("release") {
        storeFile = file("../upload-keystore.jks")
        storePassword = "PASSWORD_KAMU"
        keyAlias = "upload"
        keyPassword = "PASSWORD_KAMU"
    }
}

buildTypes {
    getByName("release") {
        signingConfig = signingConfigs.getByName("release")
        isMinifyEnabled = false
    }
}
```

---

# 5️⃣ Build Release Signed

```bash
flutter build apk --release
```

---

# 6️⃣ Build App Bundle (Direkomendasikan Play Store)

Untuk upload ke Play Store:

```bash
flutter build appbundle
```

Output:

```
build/app/outputs/bundle/release/app-release.aab
```

Upload file `.aab` ke Play Console.

---

# 🛡 Tips Keamanan

- Backup keystore di tempat aman
    
- Simpan password di password manager
    
- Jangan commit keystore ke repo publik
    
- Gunakan Play App Signing
    

---

# 🧠 Best Practice Production

- Gunakan flavor (dev/prod)
    
- Gunakan environment config
    
- Gunakan obfuscation jika perlu:
    

```bash
flutter build apk --release --obfuscate --split-debug-info=build/debug-info
```

---

# 📌 Checklist Release

-  Keystore dibuat
    
-  key.properties ada
    
-  Signing config benar
    
-  APK release sukses build
    
-  AAB siap upload
    

---

# 🎉 Seri Setup Selesai

Kamu sekarang sudah punya:

- Setup WSL profesional
    
- Java 21 JDK
    
- Android SDK CLI
    
- Wireless Debugging
    
- Struktur project profesional
    
- Feature architecture
    
- State management strategy
    
- Release build knowledge
    

---