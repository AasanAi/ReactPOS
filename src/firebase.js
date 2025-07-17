// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Aapki web app ki Firebase configuration
// Maine aapki NAYI keys istemal ki hain.
const firebaseConfig = {
  apiKey: "// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const analytics = getAnalytics(app);",             // <-- Aakhir mein comma
  authDomain: "aasan-pos.firebaseapp.com",     // <-- Aakhir mein comma
  projectId: "aasan-pos",                      // <-- Aakhir mein comma
  storageBucket: "aasan-pos.appspot.com",      // <-- Aakhir mein comma
  messagingSenderId: "872296255660",           // <-- Aakhir mein comma
  appId: "NAYA_APP_ID_YAHAN_DAALEIN",              // <-- Aakhir mein comma
  measurementId: "G-9W8CSEKJC8"                // <-- Aakhri line par comma nahi
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Authentication aur Database ko export karein taaki poore app mein use ho sake
export const auth = getAuth(app);
export const db = getFirestore(app);