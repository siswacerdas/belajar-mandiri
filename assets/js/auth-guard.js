/**
 * auth-guard.js
 * Guard universal untuk semua halaman konten (kelas-4/, dst.)
 *
 * CARA PAKAI: tambahkan satu baris ini setelah tag <body> di setiap halaman konten:
 *   <script src="/belajar-mandiri/assets/js/auth-guard.js"></script>
 *
 * Guard ini akan:
 * 1. Sembunyikan konten halaman sampai auth selesai di-cek (mencegah flash konten)
 * 2. Redirect ke /belajar-mandiri/ jika belum login atau akun belum approved
 * 3. Tampilkan konten jika sudah login + approved
 *
 * CATATAN: Pakai absolute path dari root GitHub Pages (/belajar-mandiri/assets/js/...)
 * agar bekerja di semua kedalaman folder tanpa perlu ../../../
 */

(function () {
  // 1. Sembunyikan body segera — cegah flash konten sebelum auth selesai
  document.documentElement.style.visibility = 'hidden';

  // 2. Tentukan base URL secara dinamis
  //    Cari bagian URL sampai /belajar-mandiri/ lalu bangun path dari sana
  const pathParts  = window.location.pathname.split('/');
  const repoIndex  = pathParts.indexOf('belajar-mandiri');
  const basePath   = repoIndex >= 0
    ? pathParts.slice(0, repoIndex + 1).join('/') + '/'
    : '/belajar-mandiri/';

  const INDEX_URL   = basePath + 'index.html';
  const FIREBASE_JS = basePath + 'assets/js/firebase.js';

  // 3. Load firebase.js sebagai ES Module lalu jalankan guard
  const script = document.createElement('script');
  script.type  = 'module';
  script.textContent = `
    import { onAuthChange, getProfilUser, logout } from '${FIREBASE_JS}';

    onAuthChange(async (user) => {
      if (!user) {
        // Belum login → ke halaman utama
        window.location.replace('${INDEX_URL}');
        return;
      }

      try {
        const profil = await getProfilUser(user.uid);

        if (!profil || profil.status !== 'approved') {
          // Akun pending/rejected/tidak ada → logout + ke halaman utama
          await logout();
          const status = profil?.status || 'unknown';
          window.location.replace('${INDEX_URL}?status=' + status);
          return;
        }

        // ✅ Login + approved → tampilkan halaman
        document.documentElement.style.visibility = '';

      } catch (err) {
        // Gagal ambil profil → ke halaman utama
        window.location.replace('${INDEX_URL}');
      }
    });
  `;

  document.head.appendChild(script);
})();
