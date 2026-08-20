# 01 - Install Flutter (WSL)

## 🎯 Tujuan

Menginstall Flutter di WSL (Ubuntu) secara clean tanpa Android Studio.

---
# 1️⃣ Download Flutter (Stable Channel)

Masuk ke home:

```bash
cd ~
````

Clone repository stable:

```bash
git clone https://github.com/flutter/flutter.git -b stable
```

---

# 2️⃣ Tambahkan ke PATH

Buka file `.bashrc`:

```bash
nano ~/.bashrc
```

Tambahkan di paling bawah:

```bash
export PATH="$HOME/flutter/bin:$PATH"
```

Simpan lalu jalankan:

```bash
source ~/.bashrc
```

---

# 3️⃣ Verifikasi Install

```bash
flutter --version
```

Harus muncul versi Flutter.

Lalu cek:

```bash
flutter doctor
```

Biasanya akan muncul error Android SDK dan Java.  
Itu normal, akan kita perbaiki di materi berikutnya.

---

# 🧠 Catatan Penting

Lokasi Flutter kamu:

```
~/flutter
```

Struktur internal penting:

```
flutter/
 ├── bin/
 ├── packages/
 └── ...
```

Semua dependency Flutter nanti akan tersimpan di:

```
~/.pub-cache
```

---

# 🧹 Jika Ingin Update Flutter

```bash
flutter upgrade
```

---

# 📌 Checklist

-  Flutter berhasil di-clone
    
-  PATH sudah ditambahkan
    
-  `flutter --version` berhasil
    
-  `flutter doctor` jalan
    

---

Selanjutnya:

→ [[02 - Setup Java 21 (JDK).md]]
