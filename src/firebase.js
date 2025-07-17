// src/firebase.js

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics"; // Analytics ki abhi zaroorat nahi
import { getAuth } from "firebase/auth"; // <--- YEH LINE ADD KAREIN

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB2PyIPcxBLd0TvFN1hAkIHqSN1SrvUBc0",
  authDomain: "aasan-pos.firebaseapp.com",
  projectId: "aasan-pos",
  storageBucket: "aasan-pos.appspot.com", // ".firebasestorage" ko hata kar ".appspot" kar dein, yeh aam taur par sahi hota hai
  messagingSenderId: "872296255660",
  appId: "1:872296255660:web:c390e23ecd621cb5dacf09",
  measurementId: "G-9W8CSEKJC8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app); // Analytics ki abhi zaroorat nahi

// Authentication service ko initialize aur export karein
export const auth = getAuth(app); // <--- YEH LINE ADD KAREIN