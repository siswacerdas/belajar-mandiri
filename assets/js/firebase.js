// assets/js/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore, doc, setDoc, getDoc, getDocs,
  collection, query, where, updateDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ── CONFIG ────────────────────────────────────
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

// ── LOGIN (dengan cek approval) ───────────────
export async function login(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const profil = await getProfilUser(cred.user.uid);

  if (!profil) {
    // Akun Firebase Ada tapi dokumen Firestore belum — kemungkinan akun lama
    await signOut(auth);
    const err = new Error('Profil tidak ditemukan. Hubungi admin.');
    err.code = 'auth/profil-tidak-ada';
    throw err;
  }

  if (profil.role === 'admin') {
    // Admin login dari halaman utama — perbolehkan
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

  return cred; // status: 'approved'
}

// ── LOGIN ADMIN (untuk halaman admin) ─────────
// Sama seperti login biasa tapi wajib role admin
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

// ── DAFTAR (registrasi orang tua — status: pending) ──
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
  // Langsung sign out — harus tunggu approval dulu
  await signOut(auth);
  return cred;
}

// ── LOGOUT ────────────────────────────────────
export function logout() {
  return signOut(auth);
}

// ── AUTH STATE LISTENER ───────────────────────
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

// ── FIRESTORE: Ambil profil user ──────────────
export async function getProfilUser(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

// ── FIRESTORE: Daftar pending registrasi (admin) ──
export async function getPendingUsers() {
  const q    = query(collection(db, 'users'), where('status', '==', 'pending'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ── FIRESTORE: Semua user non-admin (admin) ───
export async function getAllUsers() {
  const q    = query(collection(db, 'users'), where('role', '==', 'user'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ── FIRESTORE: Approve / Reject user (admin) ─
export async function approveUser(uid) {
  await updateDoc(doc(db, 'users', uid), { status: 'approved' });
}
export async function rejectUser(uid) {
  await updateDoc(doc(db, 'users', uid), { status: 'rejected' });
}

// ── FIRESTORE: Simpan hasil kuis ──────────────
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

export { auth, db };