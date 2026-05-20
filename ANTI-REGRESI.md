# Catatan Anti-Regresi — Belajar Mandiri

Dokumen ini wajib dibaca sebelum memulai sesi baru atau melakukan perubahan apapun.
Tujuannya: mencegah bug yang sudah pernah terjadi terulang kembali.

---

## 🗺️ ARSITEKTUR SISTEM (Status Terkini)

### Struktur Halaman
| File | Fungsi | Siapa yang bisa akses |
|---|---|---|
| `index.html` | Landing page + form login/daftar | Publik (semua orang) |
| `home.html` | Halaman utama pilih kelas | User login + status `approved` |
| `admin/index.html` | Panel manajemen user | User login + role `admin` |
| `kelas-4/index.html` | Daftar mapel Kelas 4 | User login + `approved` |
| `admin/setup-admin.html` | Buat akun admin pertama (sekali pakai) | Lokal saja, di `.gitignore` |

### Alur Navigasi
```
Buka index.html (landing)
    │
    ├─ Sudah login → banner "Halo, X!" + tombol lanjut
    │     ├─ role: admin   → admin/
    │     └─ role: user    → home.html
    │
    ├─ Belum login → form Masuk / Daftar
    │     ├─ Masuk berhasil → cek role → admin/ atau home.html
    │     └─ Daftar → tunggu approval admin
    │
    └─ Buka home.html / admin/ langsung tanpa login → redirect ke index.html
```

### Struktur Data Firestore
```
users/
  {uid}/
    nama          : string  — nama anak
    namaOrtu      : string  — nama orang tua
    email         : string
    role          : 'user' | 'admin'
    status        : 'pending' | 'approved' | 'rejected'
    bergabung     : timestamp

    progress/
      {kuisId}/
        skor              : number
        total             : number
        skorTerbaik       : number
        attempts          : number
        terakhirDikerjakan: timestamp
```

---

## 🔥 FIREBASE — ATURAN WAJIB

### ❗ Firestore Rules TIDAK otomatis berlaku dari repo
File `firestore.rules` di repo hanya referensi. Setiap kali ada perubahan rules,
**wajib di-publish manual ke Firebase Console**:
1. Buka https://console.firebase.google.com → project `belajar-mandiri-5aa3f`
2. Firestore Database → tab **Rules**
3. Hapus semua → paste isi `firestore.rules` terbaru → klik **Publish**

**Gejala rules belum di-publish:** Admin panel kosong / error banner merah
"missing or insufficient permissions"

### ❗ Jangan ubah struktur field Firestore ini
Field berikut digunakan oleh logika kritis — mengubah nama/nilai akan merusak sistem:
| Field | Lokasi | Nilai yang valid | Digunakan oleh |
|---|---|---|---|
| `role` | `users/{uid}` | `'user'` atau `'admin'` | Semua redirect login, admin guard |
| `status` | `users/{uid}` | `'pending'`, `'approved'`, `'rejected'` | Login guard, home.html guard, approval flow |
| `uid` | `users/{uid}` | sama dengan Firebase Auth UID | `getProfilUser`, semua query |

### ❗ Jangan ubah logika `login()` di firebase.js
Fungsi `login()` sengaja melakukan tiga hal setelah `signInWithEmailAndPassword`:
1. Ambil profil dari Firestore (`getProfilUser`)
2. Cek `status` — jika `pending` atau `rejected` → `signOut()` + lempar error
3. Cek `role` — jika `admin` → diperbolehkan tanpa cek status

Jangan sederhanakan ke `signInWithEmailAndPassword` langsung — user pending akan bisa masuk.

### ❗ `daftar()` sengaja auto-logout setelah buat akun
Setelah `createUserWithEmailAndPassword`, fungsi `daftar()` langsung memanggil `signOut()`.
Ini disengaja — user baru harus menunggu approval admin sebelum bisa login.
Jangan hapus `signOut()` di dalam `daftar()`.

---

## 🖥️ HALAMAN — ATURAN WAJIB

### index.html
- ❌ Jangan tambahkan `onAuthChange` yang melakukan **auto-redirect** langsung
  → Menyebabkan admin diarahkan ke panel setiap kali landing page dibuka
- ✅ `onAuthChange` di `index.html` hanya boleh **menampilkan banner** jika sudah login,
  bukan redirect otomatis
- ❌ Jangan pakai `onclick="import(...)"` inline di dalam innerHTML yang di-generate JS
  → Tidak bisa mengakses variabel yang sudah diimport di scope module
  → Pakai `addEventListener` setelah elemen di-inject ke DOM

### home.html
- ❌ Jangan hapus auth guard di awal `<script type="module">`
  → Halaman bisa diakses langsung tanpa login via URL
- ✅ Auth guard harus cek dua hal: (1) sudah login, (2) status `approved`
- ❌ Jangan tambahkan tombol Masuk di navbar `home.html`
  → User yang sampai di sini sudah pasti login; tombol Masuk tidak relevan

### admin/index.html
- ❌ Jangan hapus loading overlay (`#loading-overlay`)
  → Tanpa overlay, form login akan flash sebentar sebelum dashboard muncul
- ✅ Overlay harus disembunyikan (`display: 'none'`) SETELAH `loginScreen`/`app`
  sudah di-set — bukan di baris pertama `onAuthChange`
- ✅ Semua `display` harus eksplisit: `'block'` atau `'none'`, bukan `''`
  → `element.style.display = ''` hanya menghapus inline style, tidak menjamin elemen tampil
- ❌ Jangan tambahkan form login di `admin/index.html`
  → Semua login dari `index.html`; jika belum login → redirect ke `index.html`
- ❌ Jangan auto-logout di catch block `onAuthChange` saat `getProfilUser` gagal
  → Jika rules belum publish, `getProfilUser` akan gagal dan admin ter-logout terus

---

## ⚙️ JAVASCRIPT — ATURAN WAJIB

### ES Module
- Semua file HTML menggunakan `<script type="module">` — wajib dibuka via server (Live Server)
  bukan via `file://` langsung
- Import harus dari path relatif yang benar:
  - `index.html` / `home.html` → `'./assets/js/firebase.js'`
  - `admin/index.html` → `'../assets/js/firebase.js'`

### firebase.js — Fungsi yang Diekspor
| Fungsi | Kegunaan | Halaman |
|---|---|---|
| `login(email, pass)` | Login user biasa + cek approval | index.html |
| `loginAdmin(email, pass)` | Login admin + cek role (tidak dipakai lagi, tapi jangan hapus) | — |
| `logout()` | Sign out | Semua halaman |
| `daftar(email, pass, namaAnak, namaOrtu)` | Buat akun baru (status: pending) | index.html |
| `onAuthChange(callback)` | Pantau status auth | Semua halaman |
| `getProfilUser(uid)` | Ambil profil dari Firestore | Semua halaman |
| `getAllUsers()` | Query semua user (role: user) | admin/index.html saja |
| `approveUser(uid)` | Set status: approved | admin/index.html saja |
| `rejectUser(uid)` | Set status: rejected | admin/index.html saja |
| `simpanHasilKuis(user, kuisId, skor, total)` | Simpan progres kuis | Halaman kuis |

---

## 🔑 GIT & DEPLOY — ATURAN WAJIB

### Push ke GitHub
Gunakan selalu:
```powershell
cd "C:\Users\USER\Documents\belajar-mandiri-git"
git add .
git commit -m "tipe: deskripsi singkat"
git push
```
Format commit: `feat:` (fitur baru), `fix:` (perbaikan bug), `docs:` (dokumentasi),
`chore:` (setup/config), `style:` (CSS saja)

### SSH
- ❌ Jangan jalankan `git config --global` di dalam folder repo
- ❌ Jangan clone dengan HTTPS — harus SSH alias `github-siswacerdas`
- Clone yang benar: `git@github-siswacerdas:siswacerdas/belajar-mandiri.git`

### Authorized Domains Firebase
- ❌ Jangan hapus `siswacerdas.github.io` dari Authorized Domains Firebase Auth
  → Login dari GitHub Pages akan gagal dengan error `auth/unauthorized-domain`
- Jika domain berubah, tambahkan domain baru di Firebase Console → Authentication →
  Settings → Authorized Domains

---

## 🚧 SETUP ADMIN BARU (jika diperlukan)

Jika akun admin perlu dibuat ulang:
1. Salin `admin/setup-admin.html` ke folder repo (file ini ada di `.gitignore`)
2. Buka via Live Server (bukan klik langsung)
3. Isi nama, email, kata sandi → klik Buat
4. **Hapus file setelah selesai** — jangan push ke GitHub
5. Pastikan dokumen Firestore `users/{uid}` terbuat dengan `role: 'admin'`

---

## 📋 CHECKLIST SEBELUM SESI BARU

Sebelum mulai coding di sesi baru, pastikan:
- [ ] Sudah baca ANTI-REGRESI.md ini
- [ ] Sudah baca CHANGELOG.md untuk tahu state terakhir
- [ ] Firestore Rules sudah di-publish (cek di Firebase Console)
- [ ] Semua perubahan sesi sebelumnya sudah di-push ke GitHub


---

## 🛡️ AUTH GUARD UNTUK HALAMAN KONTEN

### Cara kerja
File `assets/js/auth-guard.js` adalah guard universal yang:
1. Menyembunyikan seluruh halaman (`visibility: hidden`) sebelum auth selesai dicek
2. Memeriksa login + status `approved` via Firebase
3. Redirect ke `index.html` jika gagal, atau tampilkan halaman jika berhasil

### Cara pasang di halaman baru
Tambahkan **tepat setelah tag `<body>`** — sebelum konten apapun:
```html
<body>
  <script src="/belajar-mandiri/assets/js/auth-guard.js"></script>
  <!-- konten halaman di bawah ini -->
```

Gunakan **absolute path** `/belajar-mandiri/assets/js/auth-guard.js` — bukan path relatif
(`../../../assets/js/auth-guard.js`). Absolute path bekerja di semua kedalaman folder.

### ❌ Jangan lakukan ini
- Jangan pakai path relatif untuk auth-guard.js — akan rusak di kedalaman folder berbeda
- Jangan taruh `<script>` auth-guard di dalam `<head>` — harus di dalam `<body>`
- Jangan ubah nama file `auth-guard.js` tanpa update semua `<script src="">` di 60+ file
- Jangan hapus `document.documentElement.style.visibility = 'hidden'` di auth-guard.js
  → Tanpa ini konten akan flash sebentar sebelum redirect terjadi

### Halaman yang sudah punya guard (tidak perlu tambah lagi)
- `home.html` — guard inline di dalam file (bukan pakai auth-guard.js)
- `admin/index.html` — guard inline + loading overlay
- Semua file di `kelas-4/` (64 file) — sudah pakai auth-guard.js

### Halaman yang TIDAK perlu guard
- `index.html` — halaman publik (landing + login)
- `admin/setup-admin.html` — hanya dijalankan lokal, tidak di-push

---

## 🏆 SISTEM LOG KUIS & RANKING (Sesi 06)

### Arsitektur Baru

#### Koleksi Firestore Baru: `hasilKuis`
```
hasilKuis/
  {autoId}/
    uid        : string   — Firebase Auth UID
    nama       : string   — nama anak (dari profil Firestore)
    kuisId     : string   — mis. "kuis_bi_bab8"
    mapel      : string   — mis. "B. Indonesia"
    bab        : string   — mis. "Bab 8 — Aku Anak Sehat"
    kelas      : string   — mis. "Kelas 4"
    nilai      : number   — 0–100
    waktuDetik : number   — durasi pengerjaan dalam detik
    timestamp  : timestamp
```
Koleksi ini terpisah dari `users/{uid}/progress` karena diperlukan
untuk query lintas-user (ranking).

#### Alur Data
```
Siswa selesai kuis
  → submitExam() di kuis.html
  → window.kuisLogger?.simpan(...)          ← panggilan plain JS
  → kuis-logger.js (jembatan)
  → simpanLogKuis() di firebase.js          ← ES Module
  → hasilKuis/{autoId}                       ← dokumen baru
  → users/{uid}/progress/{kuisId}            ← update skor terbaik
```

### ❗ Index Firestore WAJIB Dibuat Manual
Fungsi `getRankingKuis()` menggunakan `orderBy` dua field (nilai + waktuDetik).
Firestore memerlukan composite index untuk query ini.

**Cara membuat index:**
1. Buka https://console.firebase.google.com → project `belajar-mandiri-5aa3f`
2. Firestore Database → tab **Indexes**
3. Klik **Add Index**
4. Collection ID: `hasilKuis`
5. Fields:
   - `kuisId` — Ascending
   - `nilai` — Descending
   - `waktuDetik` — Ascending
6. Query scope: **Collection** → klik **Save**
7. Tunggu status "Building..." berubah jadi "Enabled" (biasanya 1–2 menit)

**Gejala index belum ada:**
Error di console: `The query requires an index.` disertai link langsung ke Firebase Console.
Klik link tersebut untuk membuat index otomatis.

### ❗ Rules hasilKuis WAJIB di-publish
Sama seperti rules lain, `firestore.rules` tidak otomatis berlaku.
Setelah sesi ini, publish ulang `firestore.rules` ke Firebase Console.

### ❗ Jangan ubah nama field di hasilKuis
| Field | Digunakan oleh |
|---|---|
| `uid` | Firestore rules (validasi pemilik), ranking |
| `nilai` | Composite index, sorting |
| `kuisId` | Filter ranking per kuis |
| `waktuDetik` | Tiebreaker ranking |
| `timestamp` | Query global terbaru |

### ❗ kuis-logger.js harus dimuat setelah auth-guard.js
Urutan script di kuis.html WAJIB:
```html
<script src="/belajar-mandiri/assets/js/auth-guard.js"></script>
<script src="/belajar-mandiri/assets/js/kuis-logger.js"></script>
```
Jangan dibalik — kuis-logger perlu Firebase yang sama dengan auth-guard.

### ❗ window.kuisLogger.simpan() bersifat fire-and-forget
Fungsi ini tidak menunggu respons — jika gagal, error hanya tercatat di console,
tidak mengganggu tampilan hasil kuis. Ini disengaja agar UX tidak terganggu.

### Halaman Baru: ranking.html
- Protected dengan auth-guard.js (user harus login + approved)
- Menggunakan `type="module"` dengan dynamic import firebase.js
- Tambahkan link ke ranking.html dari home.html jika diinginkan

