// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Aapki web app ki Firebase configuration
const firebaseConfig = {
  // Yahan apni NAYI keys quotes ke andar daalein
  apiKey: "NAYI_API_KEY_YAHAN_DAALEIN",             
  authDomain: "aasan-pos.firebaseapp.com",     
  projectId: "aasan-pos",                      
  storageBucket: "aasan-pos.appspot.com",      
  messagingSenderId: "872296255660",           
  appId: "NAYA_APP_ID_YAHAN_DAALEIN",              
  measurementId: "G-9W8CSEKJC8"                
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Authentication aur Database ko export karein
export const auth = getAuth(app);
export const db = getFirestore(app);