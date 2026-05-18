// assets/js/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ── CONFIG ────────────────────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyCln8Ysb4ULDP44QURJ7xHGDBTC0IX_sfM",
  authDomain:        "belajar-mandiri-5aa3f.firebaseapp.com",
  projectId:         "belajar-mandiri-5aa3f",
  storageBucket:     "belajar-mandiri-5aa3f.firebasestorage.app",
  messagingSenderId: "1038034318413",
  appId:             "1:1038034318413:web:2a6222854ab9023a6e9804"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// ── AUTH FUNCTIONS ────────────────────────────
export function login(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function logout() {
  return signOut(auth);
}

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

// ── FIRESTORE: Buat profil user jika baru pertama login ──
async function _createUserIfNew(user, namaAnak) {
  const ref  = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      nama:      namaAnak || user.email,
      email:     user.email,
      bergabung: serverTimestamp()
    });
  }
}

// ── FIRESTORE: Simpan hasil kuis ──────────────
export async function simpanHasilKuis(user, kuisId, skor, total) {
  const ref  = doc(db, "users", user.uid, "progress", kuisId);
  const snap = await getDoc(ref);
  const attempts    = snap.exists() ? (snap.data().attempts  || 0) + 1 : 1;
  const skorTerbaik = snap.exists() ? Math.max(snap.data().skorTerbaik || 0, skor) : skor;

  await setDoc(ref, {
    kuisId,
    skor,
    total,
    skorTerbaik,
    attempts,
    terakhirDikerjakan: serverTimestamp()
  });
}

// ── FIRESTORE: Ambil profil user ──────────────
export async function getProfilUser(uid) {
  const ref  = doc(db, "users", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

export { auth, db };