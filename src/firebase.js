// src/firebase.js

// 1. Firebase SDK se zaroori functions import karein
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
// getAnalytics optional hai, agar aap use nahi kar rahe to hata sakte hain
import { getAnalytics } from "firebase/analytics"; 

// 2. Apne project ki Firebase configuration
// (Best practice yeh hai ke in keys ko .env file mein rakhein)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// 3. Firebase app ko initialize karein
const app = initializeApp(firebaseConfig);

// 4. Firebase services ko initialize karein aur export karein
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app); // Is line ko hata dein agar analytics use nahi kar rahe

// 5. Firestore ke liye Offline Persistence enable karein
enableIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn("⚠️ Firestore persistence failed: Multiple tabs open. Data will not be saved offline in this tab.");
    } else if (err.code === 'unimplemented') {
      console.warn("⚠️ Firestore persistence is not available in this browser.");
    }
  });

// 6. Doosri files mein istemal ke liye services ko export karein
export { app, auth, db, analytics };