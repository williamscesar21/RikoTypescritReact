// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Configuración del proyecto rikoweb-ff259
// ⚠️ Esta info es pública (segura para frontend). No pongas el private_key del JSON aquí.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCv1uxTpLa6jk1DLJcbFJCEuwoseO8JJMc",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "rikoweb-ff259.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "rikoweb-ff259",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "rikoweb-ff259.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "15088740264",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:15088740264:web:3383a1309798bbf2d35f9d",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-BFRJ1NBC54",
};

// Inicializar Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log("✅ Firebase initialized:", app.name);
} catch (error) {
  console.error("❌ Error initializing Firebase:", error);
  throw error;
}

// Inicializar servicios
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;

console.log("🔐 Firebase Auth initialized:", !!auth);
