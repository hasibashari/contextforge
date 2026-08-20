# 02 - Setup Java 21 (JDK)

## 🎯 Tujuan

Menyiapkan **Java 21 JDK (bukan JRE)** agar bisa digunakan oleh Gradle untuk build Android.

> ⚠️ Android build butuh `javac` (compiler), bukan hanya `java` (runtime).

---

# 1️⃣ Cek Java yang Terinstall

```bash
java --version
javac -version
````

Kalau muncul:

```
javac: command not found
```

Berarti yang terinstall hanya JRE → harus install JDK.

---

# 2️⃣ Install OpenJDK 21 (Full JDK)

```bash
sudo apt update
sudo apt install openjdk-21-jdk -y
```

⚠️ Pastikan yang diinstall adalah:

```
openjdk-21-jdk
```

Bukan:

```
openjdk-21-jre
openjdk-21-jdk-headless
```

---

# 3️⃣ Set JAVA_HOME

Cek lokasi JDK:

```bash
ls /usr/lib/jvm/
```

Biasanya akan ada:

```
java-21-openjdk-amd64
```

Tambahkan ke `~/.bashrc`:

```bash
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
export PATH=$JAVA_HOME/bin:$PATH
```

Apply:

```bash
source ~/.bashrc
```

---

# 4️⃣ Verifikasi

```bash
echo $JAVA_HOME
java -version
javac -version
```

Semua harus menunjukkan versi 21.

---

# 🧠 Kenapa Ini Penting?

Gradle membutuhkan:

- `JAVA_HOME`
    
- `javac` tersedia
    
- Versi minimal Java 17+
    

Kalau tidak lengkap, akan muncul error seperti:

```
does not provide required capabilities: [JAVA_COMPILER]
```

---

# 📌 Checklist

-  `javac -version` menunjukkan 21.x
    
-  JAVA_HOME sudah benar
    
-  Tidak ada error saat cek versi
    

---

→ [[03 - Install Android SDK CLI.md]]