// src/context/AuthContext.js

import React, { useContext, useState, useEffect } from 'react';
import { auth } from '../firebase'; // Apne firebase.js se auth ko import karein
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    sendPasswordResetEmail
} from 'firebase/auth';

const AuthContext = React.createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true); // Shuru mein loading true rahegi

    function signup(email, password) {
        return createUserWithEmailAndPassword(auth, email, password);
    }

    function login(email, password) {
        return signInWithEmailAndPassword(auth, email, password);
    }

    function logout() {
        return signOut(auth);
    }

    function resetPassword(email) {
        return sendPasswordResetEmail(auth, email);
    }

    // Yeh sabse zaroori hissa hai
    useEffect(() => {
        // Yeh function tab chalta hai jab user login ya logout hota hai
        const unsubscribe = onAuthStateChanged(auth, user => {
            // Firebase hamein 'user' object deta hai agar login hai,
            // ya 'null' deta hai agar logout hai.
            setCurrentUser(user); 
            setLoading(false); // Ab hamein pata chal gaya hai, to loading band kar do
        });

        // Cleanup function
        return unsubscribe;
    }, []); // Yeh effect sirf ek baar chalega jab component mount hoga

    const value = {
        currentUser,
        signup,
        login,
        logout,
        resetPassword,
        loading // loading state ko bhi export karein
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}