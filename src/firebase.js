// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // <-- Login ke liye
import { getFirestore } from "firebase/firestore"; // <-- Database ke liye

// Aapki NAYI web app ki Firebase configuration yahan daalein
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
const analytics = getAnalytics(app);", // <-- NAYI KEY
  authDomain: "aasan-pos.firebaseapp.com",
  projectId: "aasan-pos",
  storageBucket: "aasan-pos.appspot.com", // Aksar yeh .appspot.com hota hai, check kar lein
  messagingSenderId: "872296255660",
  appId: "NAYA_APP_ID_YAHAN_DAALEIN", // <-- NAYA ID
  measurementId: "G-9W8CSEKJC8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Authentication aur Database ko export karein taaki poore app mein use ho sake
export const auth = getAuth(app);
export const db = getFirestore(app);