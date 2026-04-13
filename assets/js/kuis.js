/**
 * BELAJAR MANDIRI — kuis.js
 * Mesin kuis reusable untuk semua halaman kuis.
 *
 * CARA PAKAI:
 * 1. Definisikan array `soalKuis` di halaman HTML:
 *    const soalKuis = [
 *      {
 *        soal: "Teks pertanyaan?",
 *        pilihan: ["A", "B", "C", "D"],
 *        jawaban: 0,          // index jawaban benar (0 = pilihan pertama)
 *        penjelasan: "Penjelasan singkat."
 *      },
 *    ];
 * 2. Buat <div id="kuis-area"></div> di HTML.
 * 3. Panggil: KuisEngine.mulai('kuis-area');
 */
const KuisEngine = (() => {
  let _soal=[], _jwb=[], _done=false, _el=null;

  function mulai(id) {
    if (typeof soalKuis==='undefined'||!soalKuis.length){console.error('KuisEngine: soalKuis tidak ditemukan.');return;}
    _soal=soalKuis; _jwb=Array(_soal.length).fill(null); _done=false;
    _el=document.getElementById(id);
    if(!_el){console.error('KuisEngine: #'+id+' tidak ditemukan.');return;}
    _render();
  }

  function _render(){
    _el.innerHTML='';
    _el.appendChild(_progBar());
    _soal.forEach((s,i)=>_el.appendChild(_kartu(s,i)));
    if(!_done) _el.appendChild(_submitArea());
    else _el.insertBefore(_hasil(), _el.querySelector('.soal-card'));
    _el.querySelectorAll('.pilihan-btn').forEach(b=>b.addEventListener('click',_pilih));
    _el.querySelector('#btn-submit')?.addEventListener('click',_submit);
  }

  function _progBar(){
    const done=_jwb.filter(j=>j!==null).length, pct=Math.round(done/_soal.length*100);
    const el=document.createElement('div'); el.className='kuis-progress';
    el.innerHTML=`<div class="kuis-progress-top"><span class="prog-title">Kuis Latihan</span><span class="prog-count">${done} / ${_soal.length} dijawab</span></div><div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>`;
    return el;
  }

  function _kartu(s,i){
    const benar=_done&&_jwb[i]===s.jawaban;
    const statusHTML=_done?`<span class="soal-status ${benar?'benar':'salah'}">${benar?'✓ Benar':'✗ Salah'}</span>`:'';
    const pilihanHTML=s.pilihan.map((p,pi)=>{
      let cls='pilihan-btn';
      if(_done){if(pi===s.jawaban)cls+=' jawaban-benar';else if(pi===_jwb[i])cls+=' jawaban-salah';else cls+=' nonaktif';}
      else if(_jwb[i]===pi)cls+=' dipilih';
      const h=_done?(pi===s.jawaban?'✓':(pi===_jwb[i]?'✗':String.fromCharCode(65+pi))):String.fromCharCode(65+pi);
      return `<button class="${cls}" data-soal="${i}" data-pilihan="${pi}" ${_done?'disabled':''}><span class="pil-label">${h}</span><span class="pil-teks">${p}</span></button>`;
    }).join('');
    const penHTML=_done&&s.penjelasan?`<div class="penjelasan ${benar?'benar':'salah'}"><strong>${benar?'✓ Tepat!':'✗ Belum tepat.'}</strong>${s.penjelasan}</div>`:'';
    const card=document.createElement('div'); card.className='soal-card'; card.id=`soal-${i}`;
    card.innerHTML=`<div class="soal-header"><span class="soal-nomor">Soal ${i+1} / ${_soal.length}</span>${statusHTML}</div><p class="soal-teks">${s.soal}</p><div class="pilihan-list">${pilihanHTML}</div>${penHTML}`;
    return card;
  }

  function _submitArea(){
    const semua=_jwb.every(j=>j!==null), sisa=_jwb.filter(j=>j===null).length;
    const el=document.createElement('div'); el.className='submit-area';
    el.innerHTML=`<button id="btn-submit" class="btn-submit" ${!semua?'disabled':''}> Lihat Hasil Kuis</button><p class="submit-hint">${semua?'Semua soal sudah dijawab — siap melihat hasilmu?':`Masih ada <strong>${sisa} soal</strong> yang belum dijawab.`}</p>`;
    return el;
  }

  function _hasil(){
    const benar=_jwb.filter((j,i)=>j===_soal[i].jawaban).length;
    const persen=Math.round(benar/_soal.length*100);
    const {emoji,pesan,warna}=_predikat(persen);
    const el=document.createElement('div'); el.className='hasil-box';
    el.style.setProperty('--hasil-warna',warna);
    el.innerHTML=`<span class="hasil-emoji">${emoji}</span><div class="hasil-skor">${benar} / ${_soal.length}</div><div class="hasil-persen">${persen}%</div><p class="hasil-pesan">${pesan}</p><div class="hasil-bar-track"><div class="hasil-bar-fill" style="width:${persen}%;background:${warna}"></div></div><div class="hasil-actions"><button class="btn-ulangi" onclick="location.reload()">↺ Ulangi Kuis</button></div>`;
    return el;
  }

  function _pilih(e){
    if(_done)return;
    const si=+e.currentTarget.dataset.soal, pi=+e.currentTarget.dataset.pilihan;
    _jwb[si]=pi; _render();
    const next=_jwb.findIndex((j,idx)=>j===null&&idx>si);
    if(next!==-1) setTimeout(()=>document.getElementById(`soal-${next}`)?.scrollIntoView({behavior:'smooth',block:'center'}),160);
  }

  function _submit(){_done=true;_render();_el.scrollIntoView({behavior:'smooth'});}

  function _predikat(p){
    if(p>=90)return{emoji:'🏆',pesan:'Luar biasa! Kamu benar-benar menguasai materi ini.',warna:'#166534'};
    if(p>=75)return{emoji:'⭐',pesan:'Bagus sekali! Hampir sempurna. Sedikit lagi pasti 100!',warna:'#1a6b72'};
    if(p>=60)return{emoji:'👍',pesan:'Cukup baik! Coba baca materinya lagi, lalu ulangi kuis ini.',warna:'#92400e'};
    return      {emoji:'💪',pesan:'Jangan menyerah! Baca dulu materinya, kamu pasti bisa lebih baik!',warna:'#991b1b'};
  }

  return{mulai};
})();
