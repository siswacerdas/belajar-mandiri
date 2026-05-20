# 📚 Belajar Mandiri

Platform belajar interaktif gratis untuk siswa SD Kelas 4–6, berbasis static site
(HTML/CSS/JS) yang dihosting di GitHub Pages dengan backend Firebase.

🌐 **Live:** https://siswacerdas.github.io/belajar-mandiri/

---

## Tentang Proyek

**Belajar Mandiri** dirancang untuk membantu siswa SD belajar secara mandiri di rumah.
Platform ini menyediakan materi ringkas dan kuis interaktif yang bisa dikerjakan
kapan saja dari HP maupun laptop — dengan progres tersimpan otomatis ke akun masing-masing.

**Dibuat untuk:** Siswa SDIT Al-Madinah Depok, Kurikulum Merdeka

---

## Fitur Saat Ini

- 📖 Materi ringkas per bab dalam Bahasa Indonesia yang mudah dipahami
- 🎯 Kuis interaktif dengan koreksi langsung
- 📊 Progres dan skor tersimpan otomatis ke akun
- 🔐 Sistem login dengan approval admin
- 👤 Panel admin untuk mengelola pendaftaran user
- ✅ Gratis, tanpa iklan

---

## Materi Tersedia

| Kelas | Mata Pelajaran | Bab | Status |
|---|---|---|---|
| 4 SD | IPAS | 4 bab | ✅ Tersedia |
| 4 SD | Bahasa Indonesia | 4 bab | ✅ Tersedia |
| 4 SD | PPKn | 4 bab | ✅ Tersedia |
| 5 SD | Semua mapel | — | 🚧 Menyusul |
| 6 SD | Semua mapel | — | 🚧 Menyusul |

---

## Cara Menggunakan

### Untuk Orang Tua / Siswa
1. Buka https://siswacerdas.github.io/belajar-mandiri/
2. Klik tab **Daftar** → isi nama anak, nama ortu, email, kata sandi
3. Tunggu persetujuan admin (biasanya 1×24 jam)
4. Setelah disetujui, login dan mulai belajar

### Untuk Admin
1. Buka https://siswacerdas.github.io/belajar-mandiri/ → login dengan akun admin
2. Otomatis diarahkan ke panel admin
3. Tinjau pendaftaran baru di menu **Menunggu Approval**
4. Klik **Setujui** atau **Tolak**

---

## Struktur Folder

```
belajar-mandiri/
│
├── index.html              # Landing page + form login/daftar (publik)
├── home.html               # Halaman utama kelas (login required)
├── CHANGELOG.md            # Log perubahan per sesi
├── ANTI-REGRESI.md         # Panduan mencegah regresi
├── firestore.rules         # Firestore security rules (referensi)
│
├── admin/
│   ├── index.html          # Panel admin (admin login required)
│   └── setup-admin.html    # Buat akun admin (sekali pakai, di .gitignore)
│
├── assets/
│   ├── css/
│   │   ├── style.css       # CSS utama + variabel
│   │   ├── layout.css      # Grid & layout
│   │   ├── kuis.css        # Komponen kuis
│   │   └── latihan.css     # Komponen latihan
│   └── js/
│       ├── firebase.js     # Auth + Firestore functions
│       ├── kuis.js         # KuisEngine — mesin kuis reusable
│       └── latihan.js      # Logika latihan interaktif
│
└── kelas-4/
    ├── index.html          # Daftar mapel Kelas 4
    ├── ipas/               # 4 bab IPAS
    ├── bahasa-indonesia/   # 4 bab Bahasa Indonesia
    └── pp/                 # 4 bab PPKn
```

---

## Stack Teknologi

| Komponen | Teknologi |
|---|---|
| Hosting | GitHub Pages |
| Frontend | HTML / CSS / JavaScript (vanilla, no framework) |
| Auth | Firebase Authentication (Email/Password) |
| Database | Firebase Firestore (asia-southeast1) |
| Fonts | Google Fonts (Lora + Nunito) |

---

## Setup Firebase

| Konfigurasi | Nilai |
|---|---|
| Project ID | `belajar-mandiri-5aa3f` |
| Auth Domain | `belajar-mandiri-5aa3f.firebaseapp.com` |
| Firestore Region | `asia-southeast1` (Singapore) |
| Authorized Domain | `siswacerdas.github.io` |

> ⚠️ `firestore.rules` di repo ini hanya file referensi. Setiap perubahan rules harus
> di-publish manual ke Firebase Console → Firestore → Rules.

---

## Roadmap

### Segera (Sesi Berikutnya)
- [ ] Dashboard progres siswa (skor terbaik, kuis yang belum dikerjakan)
- [ ] Integrasi KuisEngine + simpan hasil ke Firestore

### Jangka Menengah
- [ ] Halaman orang tua — pantau progres anak
- [ ] Ekspansi konten Kelas 5
- [ ] Matematika, IPA, Bhs. Inggris Kelas 4

### Jangka Panjang
- [ ] Gamifikasi — poin, lencana, streak harian
- [ ] Notifikasi approval via email
- [ ] Mode offline (PWA)

---

## Cara Push ke GitHub

```powershell
cd "C:\Users\USER\Documents\belajar-mandiri-git"
git add .
git commit -m "feat/fix/docs: deskripsi singkat"
git push
```

Repo menggunakan SSH alias `github-siswacerdas`. Jangan clone atau push via HTTPS.

---

## Lisensi

Konten materi pelajaran dilisensikan di bawah
**[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)** —
bebas digunakan dengan mencantumkan sumber.

Kode sumber bebas digunakan untuk keperluan pendidikan non-komersial.

---

<div align="center">
  Dibuat dengan ❤️ untuk siswa-siswi SDIT Al-Madinah Depok
</div>
