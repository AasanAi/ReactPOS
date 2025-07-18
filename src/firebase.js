// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";        // <-- Login ke liye zaroori
import { getFirestore } from "firebase/firestore";  // <-- Database ke liye zaroori

// Aapki web app ki Firebase configuration
// YAHAN APNI SABSE NAYI, UN-SHARED KEYS DAALEIN
const firebaseConfig = {
  apiKey: const firebaseConfig = {
  apiKey: "AIzaSyB2PyIPcxBLd0TvFN1hAkIHqSN1SrvUBc0",
  authDomain: "aasan-pos.firebaseapp.com",
  projectId: "aasan-pos",
  storageBucket: "aasan-pos.firebasestorage.app",
  messagingSenderId: "872296255660",
  appId: "1:872296255660:web:e734f07a02057f3adacf09",
  measurementId: "G-B9QG72HW2X"
};,
  authDomain: "aasan-pos.firebaseapp.com",
  projectId: "aasan-pos",
  storageBucket: "aasan-pos.appspot.com", // Aksar .appspot.com hota hai
  messagingSenderId: "872296255660",
  appId: "YAHAN_APNA_NAYA_APP_ID_DAALEIN",
  measurementId: "G-B9QG72HW2X" // Yeh optional hai
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// --- YEH SABSE ZAROORI HISSA HAI ---
// Authentication aur Database ko export karein taaki poore app mein use ho sake
export const auth = getAuth(app);
export const db = getFirestore(app);
