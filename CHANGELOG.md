# Changelog — Belajar Mandiri

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