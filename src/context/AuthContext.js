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
    const [loading, setLoading] = useState(true);

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

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, user => {
            // Yahan hum sirf Firebase se mila hua 'user' ya 'null' set kar rahe hain.
            setCurrentUser(user); 
            setLoading(false);
        }, error => {
            // Agar auth state check karne mein hi error aa jaye
            console.error("Auth State Change Error:", error);
            setCurrentUser(null); // Error ki soorat mein user ko null set karo
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        signup,
        login,
logout,
        resetPassword,
        loading
    };

    // --- YEH SABSE ZAROORI HISSA HAI ---
    // Hum sirf tab children ko render karenge jab loading poori ho chuki ho.
    // Isse "White Screen" ka masla hal ho jayega.
    return (
        <AuthContext.Provider value={value}>
            {!loading && children} 
        </AuthContext.Provider>
    );
}