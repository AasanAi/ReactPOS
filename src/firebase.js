import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

// --- YEH NAYA, HARDCODED CONFIGURATION HAI ---
// Ismein process.env istemal nahi ho raha.
const firebaseConfig = {
  apiKey: "YAHAN_APNI_NAYI_API_KEY_DAALEIN",             // <-- quotes ke andar
  authDomain: "aasan-pos.firebaseapp.com",     
  projectId: "aasan-pos",                      
  storageBucket: "aasan-pos.appspot.com",      
  messagingSenderId: "872296255660",           
  appId: "YAHAN_APNA_NAYA_APP_ID_DAALEIN",               // <-- quotes ke andar
  measurementId: "YAHAN_APNA_MEASUREMENT_ID_DAALEIN"   // <-- quotes ke andar
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Offline data ke liye
enableIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn("Firestore persistence failed: Multiple tabs open.");
    } else if (err.code === 'unimplemented') {
      console.warn("Firestore persistence not available in this browser.");
    }
  });