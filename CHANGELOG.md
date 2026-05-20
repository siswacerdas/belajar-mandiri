# Changelog — Belajar Mandiri

Semua perubahan signifikan dicatat di sini secara kronologis.
Format: `[Sesi XX] — YYYY-MM-DD` → deskripsi perubahan.

---

## [Sesi 06] — 2026-05-20
### Sistem Log Kuis Firebase + Papan Peringkat

#### Fitur Baru
- **`hasilKuis` (Firestore collection baru)** — setiap kali siswa menyelesaikan kuis,
  hasilnya disimpan ke koleksi top-level `hasilKuis` untuk keperluan ranking
- **`ranking.html`** — halaman papan peringkat baru (protected, hanya user approved):
  - Filter per kuis atau mode global (rata-rata semua kuis)
  - Podium 🥇🥈🥉 untuk tiga besar
  - Tabel ranking lengkap: nama, nilai, waktu pengerjaan
  - Statistik: peserta aktif, rata-rata nilai, jumlah tuntas, nilai tertinggi
  - Badge "Kamu" untuk menandai posisi user yang sedang login

#### File Baru
- **`assets/js/kuis-logger.js`** — jembatan antara mesin kuis (plain JS) dan Firebase
  (ES Module). Dimuat di semua kuis.html via `<script src>` biasa.
  Menyimpan hasil kuis ke Firebase secara non-blocking.

#### File Dimodifikasi
- **`assets/js/firebase.js`** — fungsi baru:
  - `simpanLogKuis(uid, nama, kuisId, mapel, bab, kelas, nilai, waktuDetik)`
  - `getRankingKuis(kuisId, limitN)` — ranking per kuis
  - `getSemuaHasilKuis(limitN)` — semua hasil terbaru
  - `getProgressUser(uid)` — progress lengkap satu user
  - `getCurrentUser()` — akses sinkron ke `auth.currentUser`
- **`firestore.rules`** — tambah rules untuk koleksi `hasilKuis`:
  - User approved: boleh buat log miliknya sendiri + baca semua
  - Admin: baca & hapus
- **9 file `kuis.html`** (semua bab) — tambahkan:
  - `<script kuis-logger.js>` setelah auth-guard
  - `MAPEL` dan `BAB` ke `CONFIG`
  - `window.kuisLogger?.simpan(...)` di `submitExam()` sebelum `_submitToServer`

#### Firestore Index yang Perlu Dibuat
Untuk `getRankingKuis()` (query dengan `orderBy` dua field), buat composite index:
- Collection: `hasilKuis`
- Fields: `kuisId` (Ascending) → `nilai` (Descending) → `waktuDetik` (Ascending)
- Lihat ANTI-REGRESI.md untuk langkah lengkapnya

---

## [Sesi 05b] — 2026-05-20
### Hotfix: Admin Panel Blank + Alur Login Disatukan

#### Bug yang Diperbaiki
- **Admin panel blank** — `app.style.display = ''` tidak menjamin elemen tampil;
  diganti ke `display: 'block'` eksplisit di setiap branch `onAuthChange`
- **Overlay disembunyikan terlalu awal** — overlay kini disembunyikan SETELAH
  `loginScreen`/`app` sudah di-set, bukan di baris pertama callback
- **Tombol Keluar tidak berfungsi** — `onclick="import(...)"` inline tidak bisa
  mengakses scope ES Module; diganti ke `addEventListener`
- **Form login admin muncul setelah logout** — tombol Keluar di admin sekarang
  redirect ke `index.html`, bukan menampilkan form login lokal

#### Perubahan Alur Login (Final)
- Semua login (admin maupun user) dilakukan dari `index.html`
- `admin/index.html` tidak punya form login sendiri
- Buka `admin/` tanpa login → otomatis redirect ke `index.html`
- Buka `admin/` tapi bukan admin → logout + redirect ke `index.html`
- Keluar dari admin → redirect ke `index.html`

---

## [Sesi 05] — 2026-05-20
### Restrukturisasi Halaman + Redesign Admin Panel

#### Perubahan Arsitektur Halaman
| File | Sebelum | Sesudah |
|---|---|---|
| `index.html` | Halaman utama + modal login | Landing page + form login/daftar embedded |
| `home.html` | Tidak ada | Halaman utama konten (protected) |
| `admin/index.html` | Form login admin terpisah | Panel admin (no form login, semua dari index.html) |

#### `index.html` — Landing Page + Login
- Layout dua kolom: kiri = branding + fitur + langkah daftar, kanan = auth card sticky
- Auth card punya tab **Masuk** / **Daftar** tanpa modal
- Jika sudah login: auth card berubah jadi banner "Halo, X!" + tombol lanjut
- URL param `?status=pending` / `?status=rejected` menampilkan status bar
- Klik Masuk → cek role → admin ke `admin/`, user ke `home.html`

#### `home.html` — Halaman Utama (Baru)
- Auth guard di awal: cek login + approved, redirect ke `index.html` jika gagal
- Navbar hanya tampilkan nama user + tombol Keluar
- Tombol kelas langsung aktif (tidak dikunci — sudah di-guard di level halaman)
- Keluar → redirect ke `index.html`

#### `admin/index.html` — Panel Admin (Dibangun Ulang)
- Loading overlay saat auth check (mencegah flash login form)
- Sidebar: Dashboard, Menunggu Approval (+ badge), Semua User, Pengaturan
- Dashboard: 4 stat card + tabel pending terbaru + tombol refresh
- Panel "Menunggu Approval": tabel khusus pending + tombol Setujui/Tolak
- Panel "Semua User": filter tab (Semua/Menunggu/Disetujui/Ditolak) + aksi per user
- Toast notifikasi untuk setiap aksi berhasil/gagal
- Error banner permanen jika `getAllUsers()` gagal (misal rules belum publish)

---

## [Sesi 04] — 2026-05-18
### Sistem Auth Lengkap — Approval Flow + Panel Admin

#### `assets/js/firebase.js`
- `login(email, pass)` — tambah cek Firestore setelah login:
  - `status: pending` → auto logout + error `auth/pending-approval`
  - `status: rejected` → auto logout + error `auth/rejected`
  - Profil tidak ada → auto logout + error `auth/profil-tidak-ada`
- `loginAdmin(email, pass)` — login + wajib `role: 'admin'`, else logout
- `daftar(email, pass, namaAnak, namaOrtu)` — buat akun Firebase Auth +
  simpan ke `users/{uid}` dengan `status: 'pending'`, `role: 'user'`, lalu auto logout
- `getPendingUsers()` — query `where('status', '==', 'pending')`
- `getAllUsers()` — query `where('role', '==', 'user')`
- `approveUser(uid)` — `updateDoc` set `status: 'approved'`
- `rejectUser(uid)` — `updateDoc` set `status: 'rejected'`

#### `firestore.rules` (Baru)
- User hanya bisa `get` dokumen dirinya sendiri
- `create` hanya untuk UID sendiri + `status: pending` + `role: user`
- Admin bisa `get`, `list`, `update`, `delete` semua dokumen `users`
- Progress kuis hanya bisa diakses user dengan `status: approved`
- ⚠️ File ini harus di-publish manual ke Firebase Console — tidak otomatis berlaku

#### `admin/index.html` (Versi Pertama)
- Form login admin dengan `loginAdmin()`
- Dashboard statistik 4 kartu
- Tabel user dengan tab filter dan tombol Setujui/Tolak

---

## [Sesi 03] — 2026-05-18
### UI Login — Modal Auth di Navbar

#### `index.html`
- Tambah `#nav-auth` di navbar: tombol Masuk + panel nama user
- Modal login dengan tab Masuk / Daftar
- Form Daftar: nama anak, nama ortu, email, kata sandi
- `onAuthChange`: tampilkan nama user atau tombol Masuk
- Tombol "Masuk Kelas 4" dikunci (🔒) saat belum login
- CSS: `.btn-nav-masuk`, `.nav-user`, `.modal-overlay`, `.modal-tabs`, `.daftar-sukses`

---

## [Sesi 02] — 2026-05-18
### Setup Firebase Auth + Firestore

#### Firebase Project
- Project ID: `belajar-mandiri-5aa3f`
- Auth domain: `belajar-mandiri-5aa3f.firebaseapp.com`
- Firestore region: `asia-southeast1` (Singapore)
- Metode login: Email/Password
- Authorized domain: `siswacerdas.github.io`

#### `assets/js/firebase.js` (Versi Awal)
- `initializeApp`, `getAuth`, `getFirestore`
- `login(email, pass)` — `signInWithEmailAndPassword`
- `logout()` — `signOut`
- `onAuthChange(callback)` — `onAuthStateChanged`
- `getProfilUser(uid)` — `getDoc` dari `users/{uid}`
- `simpanHasilKuis(user, kuisId, skor, total)` — `setDoc` ke `users/{uid}/progress/{kuisId}`

---

## [Sesi 01] — 2026-05-18
### Setup Git Multi-Akun & Repository

- SSH key `id_siswacerdas` dibuat dan didaftarkan ke GitHub akun `siswacerdas`
- `~/.ssh/config` dikonfigurasi dengan alias `github-siswacerdas`
- Repo di-clone via SSH: `git@github-siswacerdas:siswacerdas/belajar-mandiri.git`
- `git config --local` diset: `siswacerdas / arif.azwar79@gmail.com`
- VS Code Workspace `projek-saya.code-workspace` dibuat untuk dua repo paralel

