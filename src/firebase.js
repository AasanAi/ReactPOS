// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB2PyIPcxBLd0TvFN1hAkIHqSN1SrvUBc0",
  authDomain: "aasan-pos.firebaseapp.com",
  projectId: "aasan-pos",
  storageBucket: "aasan-pos.firebasestorage.app",
  messagingSenderId: "872296255660",
  appId: "1:872296255660:web:e734f07a02057f3adacf09",
  measurementId: "G-B9QG72HW2X"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics
const analytics = getAnalytics(app);

// Initialize Authentication
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

// Enable offline persistence for Firestore
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn("⚠️ Firestore persistence failed: Multiple tabs open.");
  } else if (err.code === 'unimplemented') {
    console.warn("⚠️ Firestore persistence is not available in this browser.");
  }
});
