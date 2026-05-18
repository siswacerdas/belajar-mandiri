# Changelog — Belajar Mandiri

## [Sesi 04] — 2026-05-18
### Sistem Auth Lengkap — Approval Flow + Panel Admin

#### Perubahan `assets/js/firebase.js`
- Import `createUserWithEmailAndPassword`, `getDocs`, `query`, `where`, `updateDoc`
- `login()` — tambah cek approval: jika `status: pending` atau `rejected` → auto logout + error spesifik
- `loginAdmin()` — login khusus admin, wajib `role: 'admin'`
- `daftar()` — buat akun + simpan ke Firestore `users/{uid}` dengan `status: pending`, lalu auto logout
- `getPendingUsers()` → query users dengan status pending
- `getAllUsers()` → query semua user dengan role 'user'
- `approveUser(uid)` / `rejectUser(uid)` → update status di Firestore

#### Perubahan `index.html`
- Tombol "Masuk Kelas 4" diubah jadi `<button>` — dikunci (🔒) saat belum login, dibuka setelah login approved
- Modal diperluas dengan tab **Masuk** / **Daftar**
- Form Daftar: nama anak, nama orang tua, email, kata sandi
- Setelah daftar berhasil: tampil pesan sukses, form disembunyikan
- Teks "tidak perlu daftar, tidak perlu login" dihapus dari seluruh halaman
- Info mapel Kelas 4 diupdate: IPAS ✅, Bhs. Indonesia ✅, PPKn ✅ (masing-masing 4 bab)
- Section "Cara Belajar" diupdate: langkah pertama adalah Daftar & Masuk

#### File Baru `admin/index.html`
- Login terpisah untuk admin (via `loginAdmin()`)
- Dashboard statistik: pending / approved / rejected / total
- Tabel user dengan tab filter (Menunggu / Disetujui / Ditolak / Semua)
- Tombol Setujui / Tolak per user dengan konfirmasi
- Toast notifikasi untuk feedback aksi
- Redirect otomatis jika bukan admin

#### File Baru `firestore.rules`
- User hanya bisa baca data dirinya sendiri
- `create` hanya diizinkan dengan `status: pending` dan `role: user`
- `update` dan `delete` hanya oleh admin
- Admin bisa `list` (query) seluruh koleksi users
- Progress kuis hanya bisa diakses user yang sudah `approved`

## [Sesi 03] — 2026-05-18
### UI Login — Navbar Auth + Modal Form

#### Yang Dilakukan
- Tambah tombol **Masuk** di navbar `index.html` (class `btn-nav-masuk`, id `btn-masuk`)
- Tambah HTML **modal login** (overlay + form email/password) di `index.html`
- Tambah CSS untuk: `btn-nav-masuk`, `nav-user`, `btn-keluar`, `modal-overlay`, `modal-box`, `form-group`, `btn-login-submit`, `login-error`
- Tambah `<script type="module">` di akhir `index.html` yang:
  - Import `login`, `logout`, `onAuthChange`, `getProfilUser` dari `assets/js/firebase.js`
  - Buka/tutup modal dengan klik tombol, klik overlay, atau tekan `Escape`
  - Proses login async + tampilkan pesan error yang ramah
  - Pantau status auth dengan `onAuthChange`: tampilkan nama user atau tombol Masuk
  - Enter di field password memicu proses login

#### Hasil
- User yang sudah login: nama tampil di navbar + tombol Keluar
- User belum login: tombol Masuk tampil di navbar
- Modal login bisa dibuka/ditutup dengan mulus
- Pesan error dalam Bahasa Indonesia untuk semua kasus umum Firebase Auth

## [Sesi 02] — 2026-05-18
### Setup Firebase

#### Yang Dilakukan
- Buat project Firebase: `belajar-mandiri-5aa3f`
- Aktifkan Authentication metode Email/Password
- Buat Firestore Database di region `asia-southeast1`
- Buat file `assets/js/firebase.js` (auth + firestore functions)
- Amankan Firestore Rules (user hanya bisa akses data dirinya sendiri)
- Daftarkan domain `siswacerdas.github.io` di Authorized Domains

#### Hasil
- Firebase siap digunakan untuk login dan menyimpan progres siswa
- Firestore terlindungi — tidak bisa diakses tanpa login

## [Sesi 01] — 2026-05-18
### Setup Git Multi-Akun & Konfigurasi Repository

#### Yang Dilakukan
- Setup SSH key (`id_siswacerdas`) untuk akun GitHub `siswacerdas`
- Konfigurasi `~/.ssh/config` dengan alias `github-siswacerdas`
- Clone repo via SSH: `git@github-siswacerdas:siswacerdas/belajar-mandiri.git`
- Set identitas lokal repo: `siswacerdas / arif.azwar79@gmail.com`
- Set identitas lokal repo `sdmuh01kukusan`: `sdit-dpk / keyla.sugihara2011@gmail.com`
- Buat VS Code Workspace agar kedua repo tampil bersamaan

#### Hasil
- Dua akun GitHub berjalan paralel tanpa konflik
- Repo `belajar-mandiri` → otomatis pakai akun `siswacerdas` via SSH
- Repo `sdmuh01kukusan` → otomatis pakai akun `sdit-dpk` via HTTPS
- Double-click `projek-saya.code-workspace` untuk buka kedua repo sekaligus