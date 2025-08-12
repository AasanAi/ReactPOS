// src/firebase.js

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";

// Aapki Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB2PyIPcxBLd0TvFN1hAkIHqSN1SrvUBc0",
  authDomain: "aasan-pos.firebaseapp.com",
  projectId: "aasan-pos",
  storageBucket: "aasan-pos.appspot.com",
  messagingSenderId: "872296255660",
  appId: "1:872296255660:web:e734f07a02057f3adacf09",
  measurementId: "G-B9QG72HW2X"
};

// Firebase ko initialize karein
const app = initializeApp(firebaseConfig);

// Saari services ko initialize karein
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const analytics = getAnalytics(app);

// Offline persistence (data ko offline save karne ki koshish)
enableIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn("Firestore persistence failed: Multiple tabs open.");
    } else if (err.code === 'unimplemented') {
      console.warn("Firestore persistence not supported in this browser.");
    }
  });

// Saari services ko export karein taake doosri files unhe istemal kar sakein
export { app, auth, db, storage, analytics };