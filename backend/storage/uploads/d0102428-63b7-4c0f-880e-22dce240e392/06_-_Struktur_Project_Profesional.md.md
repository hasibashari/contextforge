# 06 - Struktur Project Profesional

## 🎯 Tujuan

Membuat struktur project Flutter yang:

- Scalable
- Modular
- Mudah dirawat
- Siap production
- Cocok untuk aplikasi besar (misalnya aplikasi Muslim)

---

# 🧠 Prinsip Dasar

Flutter tidak wajib memakai `src/`.

Di Flutter:

```

lib/

```

sudah dianggap sebagai source root.

Jadi kita tidak perlu:

```

lib/src/

```

kecuali membuat package reusable.

---

# 📁 Struktur Direkomendasikan (Feature-Based)

```

lib/  
├── core/  
├── features/  
├── shared/  
└── main.dart

```

---

# 📂 1️⃣ core/

Berisi hal global aplikasi.

Contoh:

```

core/  
├── constants/  
├── theme/  
├── network/  
├── services/  
└── utils/

```

Isi biasanya:

- API client
- App theme
- Helper functions
- Notification service
- Local storage service

Core tidak boleh berisi UI feature tertentu.

---

# 📂 2️⃣ features/

Setiap fitur berdiri sendiri.

Contoh aplikasi Muslim:

```

features/  
├── auth/  
├── prayer_time/  
├── quran/  
├── dua/  
├── qibla/  
└── settings/

```

Setiap feature tidak boleh bercampur dengan feature lain.

---

# 📂 Contoh Struktur 1 Feature

```

features/prayer_time/  
├── data/  
├── domain/  
└── presentation/

```

Jika ingin Clean Architecture ringan.

Atau versi sederhana:

```

features/prayer_time/  
├── prayer_time_page.dart  
├── prayer_time_provider.dart  
└── prayer_time_service.dart

```

---

# 📂 3️⃣ shared/

Reusable UI component.

```

shared/  
├── widgets/  
├── components/  
└── extensions/

```

Contoh:

- AppButton
- LoadingWidget
- EmptyState
- CustomTextField

---

# 🏗 Contoh Struktur Final Nyata

```

lib/  
├── core/  
│ ├── network/  
│ ├── theme/  
│ └── services/  
│  
├── features/  
│ ├── auth/  
│ ├── prayer_time/  
│ ├── quran/  
│ └── settings/  
│  
├── shared/  
│ └── widgets/  
│  
└── main.dart

```

---

# 🚫 Kesalahan Umum

❌ Semua file ditaruh di folder `screens/`  
❌ Logic dan UI campur dalam satu file besar  
❌ Tidak pisahkan feature  

---

# 🎯 Kenapa Feature-Based Lebih Profesional?

Karena:

- Mudah scale ke 20+ fitur
- Mudah dibagi tim
- Lebih rapi
- Lebih maintainable

---

→ [[07 - Feature Architecture.md]]