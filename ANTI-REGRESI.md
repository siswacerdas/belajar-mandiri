# Catatan Anti-Regresi — Belajar Mandiri

## Sesi 01 — Setup Git Multi-Akun

### Jangan Lakukan Ini
- ❌ Jangan jalankan `git config --global` di dalam folder repo manapun
  → Akan menimpa identitas global dan merusak repo lain
- ❌ Jangan hapus file `~/.ssh/config`
  → SSH tidak akan tahu pakai key mana untuk `github-siswacerdas`
- ❌ Jangan clone repo `belajar-mandiri` dengan URL HTTPS
  → Harus selalu pakai `git@github-siswacerdas:siswacerdas/belajar-mandiri.git`

### Kalau Laptop Diganti / Reinstall
1. Buat ulang folder `~/.ssh`
2. Buat SSH key baru: `ssh-keygen -t ed25519 -C "arif.azwar79@gmail.com" -f "$env:USERPROFILE\.ssh\id_siswacerdas"`
3. Daftarkan public key baru ke GitHub akun `siswacerdas`
4. Buat ulang file `~/.ssh/config` dengan isi yang sama seperti sesi ini
5. Clone ulang repo via SSH alias
6. Set ulang `git config --local` di masing-masing repo
7. Buka VS Code → Add Folder to Workspace untuk kedua repo

## Sesi 02 — Setup Firebase

### Jangan Lakukan Ini
- ❌ Jangan share file `firebase.js` yang berisi `apiKey` ke publik via repo publik
  → Segera pindahkan ke environment variable sebelum repo dijadikan public
- ❌ Jangan ubah Firestore Rules kembali ke test mode setelah production
  → Data semua user bisa dibaca siapapun
- ❌ Jangan hapus domain `siswacerdas.github.io` dari Authorized Domains
  → Login dari GitHub Pages akan gagal

### Informasi Penting
- Project ID: `belajar-mandiri-5aa3f`
- Region Firestore: `asia-southeast1`
- Metode login: Email/Password
- Auth domain: `belajar-mandiri-5aa3f.firebaseapp.com`
## Sesi 03 — UI Login

### Jangan Lakukan Ini
- ❌ Jangan rename atau hapus `id="btn-masuk"`, `id="nav-user"`, `id="modal-login"`
  → Script module di `index.html` bergantung pada ID ini
- ❌ Jangan ubah nama class `btn-nav-masuk` tanpa update CSS-nya
  → `btn-masuk` sudah dipakai sebagai class tombol generik di halaman — kelasnya berbeda
- ❌ Jangan hapus `<script type="module">` di akhir `index.html`
  → Auth listener akan berhenti, tombol Masuk/Keluar tidak akan berfungsi

### Informasi Penting
- `firebase.js` di-import sebagai ES Module — `index.html` harus dibuka via server (live server), bukan `file://`
- Modal login bisa ditutup dengan: klik tombol ×, klik overlay gelap, atau tekan `Escape`
- Pesan error login ditampilkan di dalam `.login-error` dalam Bahasa Indonesia

## Sesi 04 — Auth Approval + Admin Panel

### Jangan Lakukan Ini
- ❌ Jangan hapus field `status` dan `role` dari dokumen Firestore users
  → Seluruh logika login, approval, dan admin bergantung pada kedua field ini
- ❌ Jangan ubah `login()` kembali ke `signInWithEmailAndPassword` langsung
  → Wajib melewati cek status approval
- ❌ Jangan hapus `firestore.rules` atau ubah ke mode test
  → Rules melindungi data user dari akses tidak sah
- ❌ Jangan panggil `getAllUsers()` dari halaman utama
  → Hanya untuk admin; query ini akan gagal jika dipanggil oleh non-admin
- ❌ Jangan hardcode UID admin di kode JS
  → Role admin ditentukan oleh field `role: 'admin'` di Firestore

### Informasi Penting
- Admin pertama harus dibuat manual di Firebase Console:
  1. Buat akun di Authentication
  2. Tambah dokumen di Firestore: `users/{uid}` dengan `{ nama, email, role: 'admin', status: 'approved' }`
- `daftar()` langsung sign out setelah create akun — ini disengaja (tunggu approval)
- Tombol "Masuk Kelas 4" pakai `data-href` attribute untuk switch antara locked/unlocked
- `firestore.rules` harus di-deploy manual via Firebase Console atau `firebase deploy --only firestore:rules`

## Sesi 05 — Restrukturisasi Halaman + Admin Panel

### ❗ AKAR MASALAH BERULANG: Firestore Rules Belum Di-publish

**Ini adalah penyebab utama admin panel kosong/blank di setiap sesi.**

`getAllUsers()` melakukan collection query (`getDocs(query(...))`) yang membutuhkan
`allow list` di Firestore Rules. Rules di repo (`firestore.rules`) hanya file referensi —
**tidak otomatis berlaku**. Harus di-paste manual ke Firebase Console lalu di-Publish.

**Setiap kali ada perubahan `firestore.rules` di repo → wajib di-publish ulang ke Firebase Console:**
1. Buka https://console.firebase.google.com → project `belajar-mandiri-5aa3f`
2. Firestore Database → tab **Rules**
3. Hapus semua teks lama → paste isi `firestore.rules` terbaru
4. Klik **Publish**

**Jangan diagnosa ulang masalah "admin panel kosong" sebelum memastikan rules sudah di-publish.**

### Struktur Halaman (Sesi 05)
| File | Fungsi | Akses |
|---|---|---|
| `index.html` | Landing page + form login/daftar | Publik |
| `home.html` | Halaman utama kelas | Login + approved |
| `admin/index.html` | Panel admin | Login + role admin |

### Jangan Lakukan Ini
- ❌ Jangan tambahkan auto-redirect `onAuthChange` di `index.html`
  → Menyebabkan admin langsung diarahkan ke panel tanpa melihat landing page
- ❌ Jangan pakai `onclick="import(...)"` inline untuk memanggil fungsi ES Module
  → Tidak bisa mengakses variabel yang sudah diimport di scope module; pakai `addEventListener`
- ❌ Jangan hapus loading overlay di `admin/index.html`
  → Tanpa overlay, login form akan flash sebentar sebelum dashboard muncul
- ❌ Jangan auto-logout di catch block `onAuthChange` admin
  → Jika `getProfilUser` gagal karena rules belum publish, admin akan ter-logout terus-menerus

### Informasi Penting
- `index.html` menampilkan banner "Halo, X!" jika sudah login — tidak auto-redirect
- Tombol "Keluar dari akun ini" di banner harus pakai `addEventListener`, bukan `onclick` inline
- `admin/index.html` punya loading overlay hijau saat pertama dibuka — normal
- Admin dibuat via `admin/setup-admin.html` (jalankan via Live Server, hapus setelahnya)
- `admin/setup-admin.html` ada di `.gitignore` — tidak ikut push ke GitHub

### ❗ BUG BERULANG: Halaman Admin Blank Setelah Loading

**Penyebab:** `app.style.display = ''` hanya menghapus inline style — tidak menjamin
elemen tampil jika tidak ada CSS rule eksplisit untuk `#app`.

**Solusi wajib:** Selalu pakai `app.style.display = 'block'` (eksplisit), bukan `''`.

**Penyebab kedua:** Overlay disembunyikan di baris pertama `onAuthChange`, sebelum
layar yang benar (`loginScreen`/`app`) sempat di-set. Akibatnya ada flash blank.

**Solusi wajib:** Sembunyikan overlay (`overlay.style.display = 'none'`) SETELAH
`loginScreen` dan `app` sudah di-set dengan benar — di setiap branch if/catch/else.

### Alur Login Admin (Sesi 05 — Final)
- Admin login dari `index.html` (sama seperti user biasa)
- Setelah login berhasil, `index.html` cek role → kalau admin → redirect ke `admin/`
- `admin/index.html` TIDAK punya form login sendiri — semua dari `index.html`
- Kalau buka `admin/` tanpa login → otomatis redirect ke `index.html`
- Kalau buka `admin/` tapi bukan admin → logout + redirect ke `index.html`
- Tombol Keluar di admin → logout + redirect ke `index.html`
