// assets/js/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore, doc, setDoc, getDoc, getDocs, addDoc,
  collection, query, where, orderBy, limit, updateDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ── CONFIG ────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyCln8Ysb4ULDP44QURJ7xHGDBTC0IX_sfM",
  authDomain:        "belajar-mandiri-5aa3f.firebaseapp.com",
  projectId:         "belajar-mandiri-5aa3f",
  storageBucket:     "belajar-mandiri-5aa3f.firebasestorage.app",
  messagingSenderId: "1038034318413",
  appId:             "1:1038034318413:web:2a6222854ab9023a6e9804"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// ── LOGIN (dengan cek approval) ───────────────────────────────────────
export async function login(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const profil = await getProfilUser(cred.user.uid);

  if (!profil) {
    await signOut(auth);
    const err = new Error('Profil tidak ditemukan. Hubungi admin.');
    err.code = 'auth/profil-tidak-ada';
    throw err;
  }

  if (profil.role === 'admin') {
    return cred;
  }

  if (profil.status === 'pending') {
    await signOut(auth);
    const err = new Error('Akun belum disetujui admin.');
    err.code = 'auth/pending-approval';
    throw err;
  }

  if (profil.status === 'rejected') {
    await signOut(auth);
    const err = new Error('Pendaftaran ditolak. Hubungi admin.');
    err.code = 'auth/rejected';
    throw err;
  }

  return cred;
}

// ── LOGIN ADMIN ───────────────────────────────────────────────────────
export async function loginAdmin(email, password) {
  const cred   = await signInWithEmailAndPassword(auth, email, password);
  const profil = await getProfilUser(cred.user.uid);

  if (!profil || profil.role !== 'admin') {
    await signOut(auth);
    const err = new Error('Akun ini bukan akun admin.');
    err.code = 'auth/bukan-admin';
    throw err;
  }
  return cred;
}

// ── DAFTAR ───────────────────────────────────────────────────────────
export async function daftar(email, password, namaAnak, namaOrtu) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await setDoc(doc(db, 'users', cred.user.uid), {
    uid:        cred.user.uid,
    nama:       namaAnak,
    namaOrtu:   namaOrtu,
    email:      email,
    role:       'user',
    status:     'pending',
    bergabung:  serverTimestamp()
  });
  await signOut(auth);
  return cred;
}

// ── LOGOUT ────────────────────────────────────────────────────────────
export function logout() {
  return signOut(auth);
}

// ── AUTH STATE LISTENER ───────────────────────────────────────────────
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

// ── GET CURRENT USER (sinkron) ────────────────────────────────────────
export function getCurrentUser() {
  return auth.currentUser;
}

// ── FIRESTORE: Ambil profil user ──────────────────────────────────────
export async function getProfilUser(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

// ── FIRESTORE: Daftar pending (admin) ─────────────────────────────────
export async function getPendingUsers() {
  const q    = query(collection(db, 'users'), where('status', '==', 'pending'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ── FIRESTORE: Semua user non-admin (admin) ───────────────────────────
export async function getAllUsers() {
  const q    = query(collection(db, 'users'), where('role', '==', 'user'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ── FIRESTORE: Approve / Reject user (admin) ──────────────────────────
export async function approveUser(uid) {
  await updateDoc(doc(db, 'users', uid), { status: 'approved' });
}
export async function rejectUser(uid) {
  await updateDoc(doc(db, 'users', uid), { status: 'rejected' });
}

// ── FIRESTORE: Simpan hasil kuis (legacy — tetap dipertahankan) ───────
export async function simpanHasilKuis(user, kuisId, skor, total) {
  const ref  = doc(db, 'users', user.uid, 'progress', kuisId);
  const snap = await getDoc(ref);
  const attempts    = snap.exists() ? (snap.data().attempts  || 0) + 1 : 1;
  const skorTerbaik = snap.exists() ? Math.max(snap.data().skorTerbaik || 0, skor) : skor;

  await setDoc(ref, {
    kuisId, skor, total, skorTerbaik, attempts,
    terakhirDikerjakan: serverTimestamp()
  });
}

// ── FIRESTORE: Simpan log kuis lengkap + update progress ─────────────
// Dipanggil dari kuis-logger.js setelah kuis selesai.
// uid       : Firebase Auth UID pengguna
// nama      : nama anak (dari profil Firestore)
// kuisId    : ID kuis, mis. "kuis_bi_bab8"
// mapel     : mis. "B. Indonesia"
// bab       : mis. "Bab 8 — Aku Anak Sehat"
// kelas     : mis. "Kelas 4"
// nilai     : 0–100
// waktuDetik: durasi pengerjaan dalam detik
export async function simpanLogKuis(uid, nama, kuisId, mapel, bab, kelas, nilai, waktuDetik) {
  // 1. Simpan ke koleksi top-level hasilKuis (untuk query ranking)
  await addDoc(collection(db, 'hasilKuis'), {
    uid, nama, kuisId, mapel, bab, kelas, nilai, waktuDetik,
    timestamp: serverTimestamp()
  });

  // 2. Update progress user — simpan skor terbaik
  const progressRef = doc(db, 'users', uid, 'progress', kuisId);
  const snap        = await getDoc(progressRef);
  const existing    = snap.exists() ? snap.data() : null;

  await setDoc(progressRef, {
    kuisId, mapel, bab,
    nilaiTerakhir: nilai,
    nilaiTerbaik:  existing ? Math.max(existing.nilaiTerbaik || 0, nilai) : nilai,
    attempts:      existing ? (existing.attempts || 0) + 1 : 1,
    terakhirDikerjakan: serverTimestamp()
  });
}

// ── FIRESTORE: Ranking per kuis ───────────────────────────────────────
// Mengembalikan top N hasil kuis tertentu, urut nilai desc, waktu asc.
// CATATAN: butuh composite index di Firestore Console:
//   Collection: hasilKuis | Fields: kuisId ASC, nilai DESC, waktuDetik ASC
export async function getRankingKuis(kuisId, limitN = 20) {
  const q = query(
    collection(db, 'hasilKuis'),
    where('kuisId', '==', kuisId),
    orderBy('nilai', 'desc'),
    orderBy('waktuDetik', 'asc'),
    limit(limitN)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ── FIRESTORE: Semua hasil kuis terbaru (admin / ranking global) ──────
export async function getSemuaHasilKuis(limitN = 200) {
  const q = query(
    collection(db, 'hasilKuis'),
    orderBy('timestamp', 'desc'),
    limit(limitN)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ── FIRESTORE: Progress semua kuis milik satu user ────────────────────
export async function getProgressUser(uid) {
  const snap = await getDocs(collection(db, 'users', uid, 'progress'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export { auth, db };
