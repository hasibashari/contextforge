# 07 - Feature Architecture

## 🎯 Tujuan

Memahami struktur per-feature dengan pendekatan:

Feature-Based + Clean Architecture (versi ringan)

Struktur ini cocok untuk aplikasi menengah hingga besar.

---

# 🧠 Konsep Inti

Setiap feature berdiri sendiri dan memiliki 3 layer:

1. Presentation
2. Domain
3. Data

Tidak ada ketergantungan terbalik.

Alur dependensi:

Presentation → Domain → Data

Domain tidak boleh tahu tentang Flutter UI atau API.

---

# 📁 Struktur Per Feature

Contoh: prayer_time

```

features/prayer_time/  
├── data/  
├── domain/  
└── presentation/

```

---

# 1️⃣ Presentation Layer

Berisi:

- Pages (Screen)
- Widgets
- State management (Provider / Riverpod / Bloc)

Contoh:

```

presentation/  
├── pages/  
│ └── prayer_time_page.dart  
├── widgets/  
│ └── prayer_card.dart  
└── providers/  
└── prayer_time_provider.dart

```

Tugasnya:
- Menampilkan UI
- Handle state
- Memanggil usecase

---

# 2️⃣ Domain Layer

Ini inti business logic.

Tidak boleh import:
- flutter
- http
- sqflite

Contoh:

```

domain/  
├── entities/  
│ └── prayer_time.dart  
├── repositories/  
│ └── prayer_time_repository.dart  
└── usecases/  
└── get_prayer_time.dart

```

## Entity

Mewakili model murni.

## Repository (abstract)

Hanya interface.

## Usecase

Berisi logika bisnis.

Contoh:

```

GetPrayerTime {  
final PrayerTimeRepository repo;  
}

```

---

# 3️⃣ Data Layer

Implementasi nyata dari repository.

Contoh:

```

data/  
├── models/  
│ └── prayer_time_model.dart  
├── datasources/  
│ ├── prayer_remote_source.dart  
│ └── prayer_local_source.dart  
└── repositories/  
└── prayer_time_repository_impl.dart

```

Data layer boleh pakai:
- http
- dio
- hive
- sqflite

---

# 🔄 Alur Eksekusi

User buka halaman
→ Provider panggil Usecase
→ Usecase panggil Repository (abstract)
→ Repository impl panggil API
→ Data kembali ke UI

---

# 📦 Versi Clean Architecture Ringan

Kalau belum ingin terlalu kompleks:

```

features/prayer_time/  
├── prayer_time_page.dart  
├── prayer_time_provider.dart  
├── prayer_time_repository.dart  
└── prayer_time_model.dart

```

Ini cocok untuk tahap awal.

---

# 🎯 Kapan Pakai Clean Full?

Gunakan full 3 layer jika:

- Aplikasi banyak logic bisnis
- Tim lebih dari 1 orang
- Target production jangka panjang
- Ingin testability tinggi

---

# 📌 Rule Penting

- Feature tidak boleh tahu detail feature lain.
- Domain tidak boleh import flutter/material.dart.
- Data layer tidak boleh langsung diakses UI.

---

→ [[08 - State Management Strategy.md]]
