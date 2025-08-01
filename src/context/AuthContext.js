import React, { useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    sendPasswordResetEmail,
    getAuth
} from 'firebase/auth';
import { initializeApp } from "firebase/app";
import toast from 'react-hot-toast'; // --- YEH MISSING IMPORT ADD KAR DIYA GAYA HAI ---

const AuthContext = React.createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [shopOwnerId, setShopOwnerId] = useState(null);
    const [loading, setLoading] = useState(true);

    async function signup(email, password) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", userCredential.user.uid), {
            role: "admin",
            email: email,
            status: "active"
        });
        return userCredential;
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
    function logout() { setUserRole(null); setShopOwnerId(null); return signOut(auth); }
    function resetPassword(email) { return sendPasswordResetEmail(auth, email); }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userDocRef = doc(db, "users", user.uid);
                const userDoc = await getDoc(userDocRef);
                
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    
                    if (userData.status === 'disabled') {
                        toast.error("Your account is disabled. Please contact the administrator.");
                        await signOut(auth);
                        setCurrentUser(null);
                        setUserRole(null);
                        setShopOwnerId(null);
                    } else {
                        setCurrentUser(user);
                        setUserRole(userData.role);
                        if (userData.role === 'admin') {
                            setShopOwnerId(user.uid);
                        } else if (userData.role === 'cashier') {
                            setShopOwnerId(userData.adminId);
                        }
                    }
                } else {
                    setCurrentUser(null);
                    setUserRole(null);
                    setShopOwnerId(null);
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

    const value = { 
        currentUser, userRole, loading, shopOwnerId, 
        signup,
        login, logout, resetPassword, createCashierAccount 
    };
    
    return (
        <AuthContext.Provider value={value}>
            {!loading && children} 
        </AuthContext.Provider>
    );
}