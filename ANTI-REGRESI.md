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