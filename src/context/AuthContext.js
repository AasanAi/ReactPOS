// src/context/AuthContext.js

import React, { useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { 
    GoogleAuthProvider,
    signInWithPopup,
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    sendPasswordResetEmail,
    sendEmailVerification,
    getAuth
} from 'firebase/auth';
import { initializeApp } from "firebase/app";
import toast from 'react-hot-toast';

const AuthContext = React.createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userRole, setUserRole] = useState(null); // Shuru mein null
    const [shopOwnerId, setShopOwnerId] = useState(null);
    const [loading, setLoading] = useState(true);

    async function signup(email, password) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", userCredential.user.uid), {
            role: "admin",
            email: email,
            status: "active"
        });
        await sendEmailVerification(userCredential.user);
        return userCredential;
    }

    async function signInWithGoogle() {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
            await setDoc(userDocRef, { role: "admin", email: user.email, status: "active" });
        }
        return result;
    }
    
    async function createCashierAccount(email, password) {
        const config = auth.app.options;
        const secondaryApp = initializeApp(config, "SecondaryApp" + Date.now());
        const secondaryAuth = getAuth(secondaryApp);
        try {
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
            const adminId = auth.currentUser.uid;
            await setDoc(doc(db, "users", userCredential.user.uid), { 
                role: "cashier", 
                email: email,
                adminId: adminId,
                status: "active"
            });
            await signOut(secondaryAuth);
            return userCredential;
        } catch (error) {
            await signOut(secondaryAuth).catch(() => {});
            throw error;
        }
    }

    function login(email, password) { return signInWithEmailAndPassword(auth, email, password); }
    function logout() { return signOut(auth); } // Simple logout
    function resetPassword(email) { return sendPasswordResetEmail(auth, email); }
    
    // === YEH HAI ASAL FINAL FIX WALA SECTION ===
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userDocRef = doc(db, "users", user.uid);
                const userDoc = await getDoc(userDocRef);
                
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setCurrentUser(user);
                    setUserRole(userData.role); // Sirf role set karo
                    setShopOwnerId(userData.role === 'admin' ? user.uid : userData.adminId);
                } else {
                    // Agar document nahi hai, to zaroor koi masla hai. Logout kar do.
                    // Yeh case ab nahi aana chahiye.
                    await signOut(auth);
                }
            } else {
                setCurrentUser(null); 
                setUserRole(null); 
                setShopOwnerId(null);
            }
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const value = { currentUser, userRole, loading, shopOwnerId, signup, login, logout, resetPassword, createCashierAccount, signInWithGoogle };
    
    return (
        <AuthContext.Provider value={value}>
            {children} 
        </AuthContext.Provider>
    );
}