/* ═══════════════════════════════════════════════════════════
   LATIHAN MANDIRI — Logika Interaktif
   Mendukung: PG, PG Kompleks, Menjodohkan, Kategori
   ═══════════════════════════════════════════════════════════ */

/* ─── PILIHAN GANDA (PG) ─── */
function cekPG(btn) {
  const card = btn.closest('.latihan-card');
  const opts = card.querySelector('.latihan-opts');
  const correct = parseInt(opts.dataset.correct);
  const optEls = opts.querySelectorAll('.opt');
  const inputs = opts.querySelectorAll('input');

  let selected = -1;
  inputs.forEach((input, i) => { if (input.checked) selected = i; });

  if (selected === -1) {
    alert('Silakan pilih salah satu jawaban terlebih dahulu!');
    return;
  }

  optEls.forEach((opt, i) => {
    opt.classList.add('locked');
    if (i === correct) opt.classList.add('correct');
    if (i === selected && selected !== correct) opt.classList.add('wrong');
  });

  inputs.forEach(input => input.disabled = true);

  const feedback = card.querySelector('.latihan-feedback');
  const result = feedback.querySelector('.fb-result');
  if (selected === correct) {
    result.textContent = '✅ Benar!';
    result.className = 'fb-result fb-correct';
  } else {
    result.textContent = '❌ Kurang tepat.';
    result.className = 'fb-result fb-wrong';
  }
  feedback.classList.add('show');

  btn.style.display = 'none';
  card.querySelector('.btn-reset').style.display = 'inline-flex';
}

/* ─── PILIHAN GANDA KOMPLEKS (PGK) ─── */
function cekPGK(btn) {
  const card = btn.closest('.latihan-card');
  const opts = card.querySelector('.latihan-opts');
  const correct = opts.dataset.correct.split(',').map(n => parseInt(n));
  const optEls = opts.querySelectorAll('.opt');
  const inputs = opts.querySelectorAll('input');

  let selected = [];
  inputs.forEach((input, i) => { if (input.checked) selected.push(i); });

  if (selected.length === 0) {
    alert('Silakan pilih minimal satu jawaban terlebih dahulu!');
    return;
  }

  const correctSorted = [...correct].sort((a, b) => a - b);
  const selectedSorted = [...selected].sort((a, b) => a - b);
  const isCorrect = correctSorted.length === selectedSorted.length &&
                    correctSorted.every((v, i) => v === selectedSorted[i]);

  optEls.forEach((opt, i) => {
    opt.classList.add('locked');
    if (correct.includes(i)) opt.classList.add('correct');
    if (selected.includes(i) && !correct.includes(i)) opt.classList.add('wrong');
  });

  inputs.forEach(input => input.disabled = true);

  const feedback = card.querySelector('.latihan-feedback');
  const result = feedback.querySelector('.fb-result');
  if (isCorrect) {
    result.textContent = '✅ Benar semua!';
    result.className = 'fb-result fb-correct';
  } else {
    result.textContent = '❌ Ada yang kurang tepat.';
    result.className = 'fb-result fb-wrong';
  }
  feedback.classList.add('show');

  btn.style.display = 'none';
  card.querySelector('.btn-reset').style.display = 'inline-flex';
}

/* ─── MENJODOHKAN ─── */
function cekMenjodohkan(btn) {
  const card = btn.closest('.latihan-card');
  const container = card.querySelector('.latihan-menjodohkan');
  const correct = container.dataset.correct.split(',');
  const rows = container.querySelectorAll('.menjodohkan-rows .row');
  const selects = container.querySelectorAll('.q-select');

  let allAnswered = true;
  selects.forEach(sel => { if (!sel.value) allAnswered = false; });

  if (!allAnswered) {
    alert('Silakan lengkapi semua pasangan terlebih dahulu!');
    return;
  }

  let correctCount = 0;
  rows.forEach((row, i) => {
    const sel = row.querySelector('.q-select');
    row.classList.add('locked');
    if (sel.value === correct[i]) {
      row.classList.add('correct');
      correctCount++;
    } else {
      row.classList.add('wrong');
    }
    sel.disabled = true;
  });

  const feedback = card.querySelector('.latihan-feedback');
  const result = feedback.querySelector('.fb-result');
  if (correctCount === rows.length) {
    result.textContent = '✅ Sempurna! Semua pasangan benar.';
    result.className = 'fb-result fb-correct';
  } else {
    result.textContent = `⚠️ ${correctCount} dari ${rows.length} pasangan benar.`;
    result.className = 'fb-result fb-wrong';
  }
  feedback.classList.add('show');

  btn.style.display = 'none';
  card.querySelector('.btn-reset').style.display = 'inline-flex';
}

/* ─── KATEGORI (Sesuai / Tidak Sesuai, Benar / Salah, dll) ─── */
function pilihKategori(btn) {
  const row = btn.closest('.kat-row');
  if (row.classList.contains('locked')) return;

  row.querySelectorAll('.kat-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  row.dataset.selected = btn.dataset.val;
}

function cekKategori(btn) {
  const card = btn.closest('.latihan-card');
  const container = card.querySelector('.latihan-kategori');
  const correct = container.dataset.correct.split(',');
  const rows = container.querySelectorAll('.kat-row');

  let allAnswered = true;
  rows.forEach(row => { if (!row.dataset.selected) allAnswered = false; });

  if (!allAnswered) {
    alert('Silakan pilih jawaban untuk setiap pernyataan!');
    return;
  }

  let correctCount = 0;
  rows.forEach((row, i) => {
    row.classList.add('locked');
    if (row.dataset.selected === correct[i]) {
      row.classList.add('correct');
      correctCount++;
    } else {
      row.classList.add('wrong');
    }
  });

  const feedback = card.querySelector('.latihan-feedback');
  const result = feedback.querySelector('.fb-result');
  if (correctCount === rows.length) {
    result.textContent = '✅ Sempurna! Semua benar.';
    result.className = 'fb-result fb-correct';
  } else {
    result.textContent = `⚠️ ${correctCount} dari ${rows.length} pernyataan benar.`;
    result.className = 'fb-result fb-wrong';
  }
  feedback.classList.add('show');

  btn.style.display = 'none';
  card.querySelector('.btn-reset').style.display = 'inline-flex';
}

/* ─── RESET (universal untuk semua tipe) ─── */
function resetLatihan(btn) {
  const card = btn.closest('.latihan-card');

  // Reset radio/checkbox
  card.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach(input => {
    input.checked = false;
    input.disabled = false;
  });
  card.querySelectorAll('.opt').forEach(opt => {
    opt.classList.remove('locked', 'correct', 'wrong');
  });

  // Reset menjodohkan
  card.querySelectorAll('.q-select').forEach(sel => {
    sel.value = '';
    sel.disabled = false;
  });
  card.querySelectorAll('.menjodohkan-rows .row').forEach(row => {
    row.classList.remove('locked', 'correct', 'wrong');
  });

  // Reset kategori
  card.querySelectorAll('.kat-row').forEach(row => {
    row.classList.remove('locked', 'correct', 'wrong');
    delete row.dataset.selected;
  });
  card.querySelectorAll('.kat-btn').forEach(b => {
    b.classList.remove('selected');
  });

  // Hide feedback
  card.querySelector('.latihan-feedback').classList.remove('show');

  // Toggle buttons
  btn.style.display = 'none';
  card.querySelector('.btn-cek').style.display = 'inline-flex';
}
