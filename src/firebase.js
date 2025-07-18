// Firebase SDKs – jo aap use karna chahte hain
import { initializeApp }  from 'firebase/app';
import { getAuth }        from 'firebase/auth';
import { getFirestore }   from 'firebase/firestore';
import { getAnalytics }   from 'firebase/analytics';
import { getStorage }     from 'firebase/storage';

// --- Aapki Firebase configuration (sabhi keys) ---
const firebaseConfig = {
  apiKey:            "AIzaSyB2PyIPcxBLd0TvFN1hAkIHqSN1SrvUBc0",
  authDomain:        "aasan-pos.firebaseapp.com",
  projectId:         "aasan-pos",
  storageBucket:     "aasan-pos.firebasestorage.app",
  messagingSenderId: "872296255660",
  appId:             "1:872296255660:web:e734f07a02057f3adacf09",
  measurementId:     "G-B9QG72HW2X"
};

// --- Firebase app initialize ---
const app = initializeApp(firebaseConfig);

// --- Services export karein taake har jagah use kar saken ---
export const auth     = getAuth(app);
export const db       = getFirestore(app);
export const storage  = getStorage(app);
export const analytics = getAnalytics(app);