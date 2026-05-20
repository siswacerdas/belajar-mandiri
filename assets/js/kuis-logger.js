/**
 * kuis-logger.js
 * Jembatan antara mesin kuis (plain JS) dan Firebase (ES Module).
 *
 * CARA PAKAI — tambahkan 1 baris ini di setiap kuis.html,
 * tepat SETELAH baris auth-guard.js:
 *
 *   <script src="/belajar-mandiri/assets/js/auth-guard.js"></script>
 *   <script src="/belajar-mandiri/assets/js/kuis-logger.js"></script>
 *
 * Setelah dimuat, tersedia global:
 *   window.kuisLogger.simpan(kuisId, mapel, bab, kelas, nilai, waktuDetik)
 *
 * Fungsi ini aman dipanggil kapan saja — jika user belum siap,
 * data di-buffer dan otomatis dikirim begitu user terdeteksi.
 *
 * ANTI-REGRESI:
 * - Gunakan absolute path (/belajar-mandiri/...) agar bekerja
 *   di semua kedalaman folder.
 * - Jangan ubah nama window.__kuisLoggerReady / window.__kuisLoggerSimpan
 *   — keduanya digunakan oleh ES Module di bawah.
 */
(function () {
  // Tentukan base URL secara dinamis (sama dengan auth-guard.js)
  const pathParts = window.location.pathname.split('/');
  const repoIndex = pathParts.indexOf('belajar-mandiri');
  const basePath  = repoIndex >= 0
    ? pathParts.slice(0, repoIndex + 1).join('/') + '/'
    : '/belajar-mandiri/';

  const FIREBASE_JS = basePath + 'assets/js/firebase.js';

  let _currentUser   = null;
  let _currentProfil = null;
  let _pending       = null;   // buffer satu panggilan simpan() sebelum user siap

  // ── Muat firebase.js sebagai ES Module ────────────────────────────
  const s = document.createElement('script');
  s.type  = 'module';
  s.textContent = `
    import { onAuthChange, getProfilUser, simpanLogKuis } from '${FIREBASE_JS}';

    onAuthChange(async (user) => {
      if (!user) return;
      try {
        const profil = await getProfilUser(user.uid);
        if (profil && profil.status === 'approved') {
          window.__kuisLoggerReady(user, profil);
        }
      } catch (e) { console.warn('kuis-logger: gagal ambil profil', e); }
    });

    // Ekspos fungsi simpan ke scope luar (plain JS)
    window.__kuisLoggerSimpan = simpanLogKuis;
  `;
  document.head.appendChild(s);

  // ── Callback dari ES Module saat user siap ────────────────────────
  window.__kuisLoggerReady = function (user, profil) {
    _currentUser   = user;
    _currentProfil = profil;

    // Kirim buffer jika ada panggilan simpan() sebelum user siap
    if (_pending) {
      const p = _pending;
      _pending = null;
      _doSimpan(p);
    }
  };

  // ── Fungsi internal ───────────────────────────────────────────────
  function _doSimpan(p) {
    if (!_currentUser || !window.__kuisLoggerSimpan) {
      console.warn('kuis-logger: user atau simpanLogKuis belum siap');
      return;
    }
    const nama = _currentProfil?.nama || 'Siswa';
    window.__kuisLoggerSimpan(
      _currentUser.uid,
      nama,
      p.kuisId,
      p.mapel,
      p.bab,
      p.kelas,
      p.nilai,
      p.waktuDetik
    ).then(() => {
      console.log('kuis-logger: hasil tersimpan ke Firebase ✓', p.kuisId, p.nilai);
    }).catch(err => {
      console.warn('kuis-logger: gagal simpan ke Firebase', err);
    });
  }

  // ── API publik ────────────────────────────────────────────────────
  window.kuisLogger = {
    /**
     * simpan(kuisId, mapel, bab, kelas, nilai, waktuDetik)
     *
     * Contoh pemanggilan dari dalam submitExam():
     *   window.kuisLogger?.simpan(
     *     CONFIG.STORAGE_KEY.replace('_sesi',''),
     *     CONFIG.MAPEL,
     *     CONFIG.BAB,
     *     this.session.kelas || 'Kelas 4',
     *     nilaiAkhir,
     *     Math.floor((Date.now() - this.session.startTime) / 1000)
     *   );
     */
    simpan: function (kuisId, mapel, bab, kelas, nilai, waktuDetik) {
      const data = { kuisId, mapel, bab, kelas, nilai, waktuDetik };
      if (_currentUser) {
        _doSimpan(data);
      } else {
        // Buffer — kirim begitu user siap
        _pending = data;
      }
    }
  };
})();
