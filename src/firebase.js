import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// ✅ Your direct Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB2PyIPcxBLd0TvFN1hAkIHqSN1SrvUBc0",
  authDomain: "aasan-pos.firebaseapp.com",
  projectId: "aasan-pos",
  storageBucket: "aasan-pos.appspot.com", // ❗ Fixed typo: was "firebasestorage.app"
  messagingSenderId: "872296255660",
  appId: "1:872296255660:web:e734f07a02057f3adacf09",
  measurementId: "G-B9QG72HW2X"
};

// 🔹 Initialize Firebase
const app = initializeApp(firebaseConfig);

// 🔹 Optional: Enable analytics (only works in production with HTTPS)
const analytics = getAnalytics(app);

// 🔹 Initialize services
const auth = getAuth(app);
const db = getFirestore(app);

// 🔹 Enable offline persistence
enableIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn("⚠️ Firestore persistence failed: Multiple tabs open.");
    } else if (err.code === 'unimplemented') {
      console.warn("⚠️ Firestore persistence not supported in this browser.");
    }
  });

// 🔹 Export for use in other parts of the app
export { app, auth, db, analytics };
