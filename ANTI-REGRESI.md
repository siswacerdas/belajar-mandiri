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
