/**
 * quiz-engine.js — Engine Soal Slideshow
 * Cerdas Cermat SD Muhammadiyah 01 Kukusan
 * https://github.com/sdm01-elearning/cerdas-cermat
 *
 * Setup di halaman paket soal:
 *   <div id="quiz-root"></div>
 *   <script>
 *     window.QUIZ_CONFIG = {
 *       dataUrl:       'data/pool.json',  // path ke JSON (pool atau paket)
 *       questionCount: 30,               // soal per sesi (default 30, 0 = semua)
 *       shuffle:       true,             // acak urutan (default true)
 *       stratifyBy:    'bahasa',         // opsional: 'bahasa' (default, ~10% EN)
 *                                        // atau 'mapel' (bagi rata per mapel,
 *                                        // dipakai Latihan Tahap 3 karena semua
 *                                        // mapel—termasuk Bahasa Inggris—sejajar)
 *       mapelFilter:   'Matematika',     // opsional: string atau array nama mapel.
 *                                        // Jika diisi, pool difilter ke mapel
 *                                        // tsb SEBELUM sampling. Dipakai untuk
 *                                        // latihan per-babak (mis. Round 1
 *                                        // "Kumpul Poin" — pilih 1 dari 6 mapel).
 *       fixedWaktu:    5,                // opsional: paksa timer tiap soal ke
 *                                        // angka detik ini, mengabaikan field
 *                                        // `waktu` per-soal di pool. Dipakai
 *                                        // untuk babak dengan waktu jawab tetap
 *                                        // sesuai kisi-kisi (mis. Round 1 & 2:
 *                                        // 5 detik).
 *     };
 *   </script>
 *   <script src="../../assets/js/quiz-engine.js"></script>
 *
 * Shortcut keyboard:
 *   Spasi  → tampilkan jawaban / lanjut ke soal berikutnya
 *   →      → soal berikutnya (setelah jawaban ditampilkan)
 *   F      → toggle layar penuh
 */

(function () {
  'use strict';

  const CIRC = 282.743; // keliling timer ring (r = 45)

  /**
   * Guard terhadap bfcache (back/forward cache) browser.
   * Tanpa ini, menekan tombol Back/Forward browser bisa menampilkan
   * kembali state halaman yang sudah "dibekukan" — termasuk soal hasil
   * acak sebelumnya — TANPA menjalankan ulang skrip ini, sehingga soal
   * terasa "selalu sama" padahal sebenarnya cuma snapshot lama yang
   * ditampilkan ulang. `pageshow` dengan `event.persisted === true`
   * menandakan halaman dipulihkan dari bfcache; kita paksa reload penuh
   * agar soal benar-benar diacak ulang dari pool.
   */
  window.addEventListener('pageshow', function (event) {
    if (event.persisted) {
      window.location.reload();
    }
  });

  /* ── Utility ───────────────────────────────────────────── */
  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }

  /** Fisher-Yates shuffle — kembalikan salinan teracak */
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /**
   * Stratified sampling: jamin ~10% soal EN.
   * Jika pool <= count, kembalikan semua (teracak).
   */
  function stratifiedSample(pool, count) {
    if (pool.length <= count) return shuffle(pool);

    const en = pool.filter(s => s.bahasa === 'en');
    const id = pool.filter(s => s.bahasa !== 'en');

    // Target: ceil(10%) soal EN, sisanya ID
    const enTarget = Math.max(1, Math.ceil(count * 0.1));
    const enPick   = Math.min(enTarget, en.length);
    const idPick   = Math.min(count - enPick, id.length);

    let selected = [
      ...shuffle(en).slice(0, enPick),
      ...shuffle(id).slice(0, idPick),
    ];

    // Jika masih kurang (pool EN atau ID terbatas), tambah dari sisa
    if (selected.length < count) {
      const usedIds = new Set(selected.map(s => s.id));
      const sisa    = shuffle(pool.filter(s => !usedIds.has(s.id)));
      selected = [...selected, ...sisa.slice(0, count - selected.length)];
    }

    return shuffle(selected); // acak campuran akhir
  }

  /**
   * Stratified sampling per mapel: bagi rata jumlah soal ke tiap nilai
   * `mapel` yang ada di pool (mis. 30 soal / 6 mapel = 5 soal/mapel).
   * Sisa pembagian (jika count tidak habis dibagi jumlah mapel) diacak
   * urutan mapelnya tiap sesi supaya tidak selalu mapel yang sama yang
   * "beruntung" dapat +1 soal.
   * Dipakai saat QUIZ_CONFIG.stratifyBy === 'mapel' (lihat dokumentasi di
   * atas) — dibuat terpisah dari stratifiedSample() (default, berbasis
   * bahasa) agar Latihan Tahap 1/2 dan Soal Campuran tidak terpengaruh.
   */
  function stratifiedSampleByMapel(pool, count) {
    if (pool.length <= count) return shuffle(pool);

    const groups = {};
    pool.forEach(s => {
      const key = s.mapel || '_lainnya';
      (groups[key] = groups[key] || []).push(s);
    });

    const mapelKeys = shuffle(Object.keys(groups));
    const n    = mapelKeys.length;
    const base = Math.floor(count / n);
    let remainder = count - base * n;

    let selected = [];
    mapelKeys.forEach(key => {
      let target = base + (remainder > 0 ? 1 : 0);
      if (remainder > 0) remainder--;
      selected = selected.concat(shuffle(groups[key]).slice(0, Math.min(target, groups[key].length)));
    });

    // Jika ada mapel dengan pool lebih sedikit dari target-nya, isi kekurangan
    // dari sisa soal (mapel manapun) agar total tetap `count`.
    if (selected.length < count) {
      const usedIds = new Set(selected.map(s => s.id));
      const sisa    = shuffle(pool.filter(s => !usedIds.has(s.id)));
      selected = selected.concat(sisa.slice(0, count - selected.length));
    }

    return shuffle(selected);
  }

  /* ── Main ──────────────────────────────────────────────── */
  async function init() {
    const cfg  = window.QUIZ_CONFIG || {};
    const root = document.getElementById('quiz-root');
    if (!root) { console.error('[QuizEngine] #quiz-root tidak ditemukan.'); return; }

    /* Loading */
    root.innerHTML = `
      <div class="qe-loading">
        <div class="qe-spinner"></div>
        <p>Memuat soal…</p>
      </div>`;

    /* Fetch — no-store agar tidak ada kemungkinan browser/CDN menyajikan
       respons pool.json yang basi (defensif, di luar bug bfcache/sessionStorage). */
    let data;
    try {
      const r = await fetch(cfg.dataUrl || 'data/pool.json', { cache: 'no-store' });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      data = await r.json();
    } catch (e) {
      root.innerHTML = `
        <div class="qe-error">
          <div class="qe-error-icon">⚠️</div>
          <h2>Gagal Memuat Soal</h2>
          <p>${e.message}</p>
          <p class="qe-error-hint">
            Pastikan halaman diakses melalui server HTTP
            (GitHub Pages atau <code>python3 -m http.server</code>),
            bukan langsung dari file lokal (<code>file://</code>).
          </p>
          <a href="index.html" class="qe-btn qe-btn-back">← Kembali</a>
        </div>`;
      return;
    }

    const pool  = data.soal || [];
    if (!pool.length) {
      root.innerHTML = `<div class="qe-error"><p>Tidak ada soal dalam file ini.</p>
        <a href="index.html" class="qe-btn qe-btn-back">← Kembali</a></div>`;
      return;
    }

    /* Filter opsional per mapel (dipakai latihan per-babak) */
    let basePool = pool;
    if (cfg.mapelFilter) {
      const filters = Array.isArray(cfg.mapelFilter) ? cfg.mapelFilter : [cfg.mapelFilter];
      basePool = pool.filter(s => filters.includes(s.mapel));
      if (!basePool.length) {
        root.innerHTML = `<div class="qe-error">
          <div class="qe-error-icon">⚠️</div>
          <h2>Soal Tidak Ditemukan</h2>
          <p>Tidak ada soal untuk mapel "${filters.join(', ')}" dalam pool ini.</p>
          <a href="index.html" class="qe-btn qe-btn-back">← Kembali</a>
        </div>`;
        return;
      }
    }

    /* Sampling */
    const doShuffle    = cfg.shuffle !== false;
    // Tentukan jumlah soal yang diminta (requestedCount) SEBELUM di-clamp,
    // agar kondisi sampling bisa dibandingkan dengan ukuran pool yang sebenarnya.
    const requestedCount = (cfg.questionCount > 0) ? cfg.questionCount : basePool.length;
    const questionCount  = Math.min(requestedCount, basePool.length);

    const list = (doShuffle && questionCount < basePool.length)
      ? (cfg.stratifyBy === 'mapel'
          ? stratifiedSampleByMapel(basePool, questionCount)
          : stratifiedSample(basePool, questionCount))
      : (doShuffle ? shuffle(basePool) : basePool.slice(0, questionCount));

    /* State */
    let idx      = 0;
    let timerIv  = null;
    let timeLeft = 0;
    let totTime  = 0;
    let revealed = false;

    /* ── Shell HTML ──────────────────────────────────────── */
    const meta     = data.meta || {};
    const poolInfo = (basePool.length > list.length)
      ? `${list.length} soal acak dari ${basePool.length}`
      : `${list.length} soal`;

    root.innerHTML = `
<div class="qe-wrap" id="qe-wrap">

  <header class="qe-header">
    <div class="qe-hd-left">
      <a href="index.html" class="qe-back-btn" title="Kembali">←</a>
      <div class="qe-hd-info">
        <span class="qe-hd-kategori">${meta.kategori_label || 'Cerdas Cermat'}</span>
        <span class="qe-hd-paket">${meta.paket ? 'Paket ' + meta.paket + ' · ' : ''}${poolInfo}</span>
      </div>
    </div>
    <div class="qe-hd-center">
      <span id="qe-prog-txt" class="qe-prog-txt">Soal 1 dari ${list.length}</span>
      <div class="qe-prog-bg"><div id="qe-prog-bar" class="qe-prog-bar"></div></div>
    </div>
    <div class="qe-hd-right">
      <button id="qe-fs-btn" class="qe-fs-btn" title="Layar penuh (F)">⛶</button>
    </div>
  </header>

  <main class="qe-main">
    <div class="qe-soal-top">
      <span class="qe-soal-num" id="qe-num">1</span>
      <span class="qe-badge-en" id="qe-en-badge" style="display:none">🇬🇧 English</span>
      <span class="qe-badge-topik" id="qe-topik-badge" style="display:none"></span>
    </div>

    <div class="qe-teks" id="qe-teks"></div>

    <div class="qe-timer-wrap" id="qe-timer-wrap">
      <svg viewBox="0 0 100 100" class="qe-timer-svg">
        <circle class="qe-t-track" cx="50" cy="50" r="45"/>
        <circle class="qe-t-ring" id="qe-t-ring" cx="50" cy="50" r="45"
          stroke-dasharray="282.743"
          stroke-dashoffset="0"/>
      </svg>
      <span class="qe-timer-num" id="qe-t-num">—</span>
    </div>

    <div class="qe-ans-area" id="qe-ans-area">
      <div class="qe-jawaban">
        <div class="qe-ans-lbl">✅ Jawaban</div>
        <div class="qe-ans-val" id="qe-jawaban"></div>
      </div>
      <div class="qe-pembahasan">
        <div class="qe-pem-lbl">📖 Pembahasan</div>
        <div class="qe-pem-val" id="qe-pembahasan"></div>
      </div>
    </div>
  </main>

  <footer class="qe-footer">
    <div class="qe-hint">
      <kbd>Spasi</kbd> tampilkan/lanjut &nbsp;·&nbsp;
      <kbd>→</kbd> soal berikutnya &nbsp;·&nbsp;
      <kbd>F</kbd> layar penuh
    </div>
    <div class="qe-btn-row">
      <button id="qe-reveal-btn" class="qe-btn qe-btn-reveal">Tampilkan Jawaban</button>
      <button id="qe-next-btn"   class="qe-btn qe-btn-next"   style="display:none">Soal Berikutnya →</button>
      <button id="qe-done-btn"   class="qe-btn qe-btn-done"   style="display:none">✓ Selesai</button>
    </div>
  </footer>

</div>`;

    /* ── Functions ───────────────────────────────────────── */

    function showSoal(i) {
      revealed  = false;
      const s   = list[i];
      const last = (i === list.length - 1);

      /* Progress */
      qs('#qe-prog-txt').textContent = `Soal ${i + 1} dari ${list.length}`;
      qs('#qe-prog-bar').style.width = ((i + 1) / list.length * 100).toFixed(1) + '%';

      /* Badges */
      qs('#qe-num').textContent = i + 1;
      const enBadge  = qs('#qe-en-badge');
      const topBadge = qs('#qe-topik-badge');
      enBadge.style.display  = s.bahasa === 'en' ? 'inline-flex' : 'none';
      topBadge.textContent   = s.topik  || '';
      topBadge.style.display = s.topik  ? 'inline-flex' : 'none';

      /* Teks soal */
      const tEl   = qs('#qe-teks');
      tEl.textContent = s.teks;
      tEl.lang        = s.bahasa === 'en' ? 'en' : 'id';

      /* Reset state */
      qs('#qe-ans-area').classList.remove('qe-ans-visible');
      qs('#qe-timer-wrap').style.display = 'flex';
      qs('#qe-t-num').classList.remove('qe-urgent');
      qs('#qe-reveal-btn').style.display = 'inline-flex';
      qs('#qe-next-btn').style.display   = 'none';
      qs('#qe-done-btn').style.display   = 'none';
      qs('#qe-wrap').classList.remove('qe-revealed');

      /* Animasi masuk */
      tEl.classList.remove('qe-slide-in');
      void tEl.offsetWidth;
      tEl.classList.add('qe-slide-in');

      startTimer(cfg.fixedWaktu || s.waktu || 10);
    }

    function startTimer(sec) {
      clearInterval(timerIv);
      timeLeft = totTime = sec;
      const ring = qs('#qe-t-ring');
      const num  = qs('#qe-t-num');

      function tick() {
        num.textContent = timeLeft;
        const frac = timeLeft / totTime;
        ring.style.strokeDashoffset = (CIRC * (1 - frac)).toFixed(3);

        if      (frac > 0.6) ring.style.stroke = 'var(--timer-green)';
        else if (frac > 0.3) ring.style.stroke = 'var(--timer-orange)';
        else                 ring.style.stroke = 'var(--timer-red)';

        if (timeLeft <= 3) num.classList.add('qe-urgent');
        if (timeLeft <= 0) { clearInterval(timerIv); reveal(); return; }
        timeLeft--;
      }

      tick();
      timerIv = setInterval(tick, 1000);
    }

    function reveal() {
      if (revealed) return;
      revealed = true;
      clearInterval(timerIv);

      const s    = list[idx];
      const last = (idx === list.length - 1);

      qs('#qe-jawaban').textContent    = s.jawaban;
      qs('#qe-pembahasan').textContent = s.pembahasan;
      qs('#qe-ans-area').classList.add('qe-ans-visible');
      qs('#qe-timer-wrap').style.display = 'none';
      qs('#qe-t-num').classList.remove('qe-urgent');

      qs('#qe-reveal-btn').style.display = 'none';
      qs('#qe-next-btn').style.display   = last ? 'none'        : 'inline-flex';
      qs('#qe-done-btn').style.display   = last ? 'inline-flex' : 'none';
      qs('#qe-wrap').classList.add('qe-revealed');
    }

    function next() {
      if (idx < list.length - 1) { idx++; showSoal(idx); }
    }

    /* ── Events ──────────────────────────────────────────── */
    qs('#qe-reveal-btn').addEventListener('click', reveal);
    qs('#qe-next-btn').addEventListener('click', next);
    qs('#qe-done-btn').addEventListener('click', () => { window.location.href = 'index.html'; });
    qs('#qe-fs-btn').addEventListener('click', toggleFS);

    document.addEventListener('keydown', e => {
      if (['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) return;
      if (e.code === 'Space') {
        e.preventDefault();
        if (!revealed) reveal();
        else if (qs('#qe-next-btn').style.display !== 'none') next();
        else if (qs('#qe-done-btn').style.display !== 'none') window.location.href = 'index.html';
      }
      if (e.code === 'ArrowRight' && revealed) {
        if (qs('#qe-next-btn').style.display !== 'none') next();
      }
      if (e.code === 'KeyF') toggleFS();
    });

    function toggleFS() {
      if (!document.fullscreenElement)
        document.documentElement.requestFullscreen().catch(() => {});
      else
        document.exitFullscreen();
    }

    /* ── Start ───────────────────────────────────────────── */
    showSoal(0);
  }

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', init);
  else
    init();

})();
