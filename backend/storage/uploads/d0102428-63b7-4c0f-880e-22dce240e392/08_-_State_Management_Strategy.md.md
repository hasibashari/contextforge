# 08 - State Management Strategy

## 🎯 Tujuan

Menentukan strategi state management yang:

- Scalable
- Clean
- Cocok untuk feature architecture
- Mudah dipelihara jangka panjang

---

# 🧠 Apa Itu State Management?

State = data yang berubah di aplikasi.

Contoh di aplikasi Muslim:

- Jadwal sholat hari ini
- Surah yang sedang dibuka
- Status login user
- Tema gelap / terang
- Notifikasi aktif atau tidak

State management = cara kita mengelola perubahan itu.

---

# 🏆 Pilihan Profesional di 2026

Secara umum yang paling dipakai:

1. Riverpod (modern & fleksibel)
2. Bloc / Cubit (enterprise style)
3. Provider (lebih sederhana)

---

# 🥇 Rekomendasi untuk Kamu: Riverpod

Kenapa?

- Tidak tergantung BuildContext
- Mudah di-test
- Cocok dengan Clean Architecture
- Scalable
- Tidak boilerplate berat

---

# 📁 Struktur Dengan Riverpod

Contoh feature:

```

features/prayer_time/  
├── presentation/  
│ ├── pages/  
│ └── providers/  
│ └── prayer_time_provider.dart

````

---

# 🧩 Contoh Riverpod Sederhana

## Provider

```dart
final prayerTimeProvider =
    FutureProvider((ref) async {
  final repo = ref.watch(prayerRepositoryProvider);
  return repo.getTodayPrayer();
});
````

---

## Pemakaian di UI

```dart
class PrayerPage extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final prayerAsync = ref.watch(prayerTimeProvider);

    return prayerAsync.when(
      data: (data) => Text(data.fajr),
      loading: () => CircularProgressIndicator(),
      error: (e, _) => Text("Error"),
    );
  }
}
```

---

# 🥈 Kapan Pakai Bloc?

Gunakan Bloc jika:

- Tim besar
    
- Pattern sudah ditentukan perusahaan
    
- Ingin strict event-state separation
    

---

# 🥉 Kapan Cukup Provider?

Gunakan Provider biasa jika:

- App kecil
    
- Tidak banyak business logic
    
- Prototype cepat
    

---

# 🧠 State Management untuk Aplikasi Muslim

Rekomendasi realistis:

- Gunakan Riverpod
    
- Pisahkan provider per feature
    
- Jangan buat global provider campur semua
    

Contoh global provider hanya untuk:

- Auth state
    
- Theme mode
    
- App config
    

---

# 🚫 Kesalahan Umum

❌ Semua state taruh di satu file besar  
❌ Business logic di dalam widget  
❌ Tidak memisahkan provider per feature  
❌ Global state berlebihan

---

# 🎯 Rekomendasi Final Stack Kamu

Karena kamu ingin profesional dan scalable:

- Flutter
    
- Feature-based structure
    
- Riverpod
    
- Clean architecture ringan
    
- Android SDK CLI
    
- Java 21
    

Ini setup modern dan production-ready.

---

→ [[09 - Release & Signing.md]]