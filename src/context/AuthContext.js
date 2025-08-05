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
    const [userRole, setUserRole] = useState(null);
    const [shopOwnerId, setShopOwnerId] = useState(null);
    const [loading, setLoading] = useState(true);

    // Public signup se user hamesha admin banega (yeh theek hai)
    async function signup(email, password) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", userCredential.user.uid), {
            role: "admin",
            email: email,
            status: "active"
        });
        return userCredential;
    }

    // STEP 1: Google Sign-In function ko simple kar diya.
    // Iska kaam ab sirf Firebase se login karwana hai.
    function signInWithGoogle() {
        const provider = new GoogleAuthProvider();
        return signInWithPopup(auth, provider);
    }
    
    // Cashier account function (yeh theek hai)
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

    // STEP 2: Asal logic onAuthStateChanged mein move kar diya
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userDocRef = doc(db, "users", user.uid);
                const userDoc = await getDoc(userDocRef);
                
                let userData;

                if (userDoc.exists()) {
                    // Agar user pehle se hai, to uski details le lo
                    userData = userDoc.data();
                } else {
                    // YEH HAI SAB SE ZARURI HISSA
                    // Agar user naya hai, check karo ke woh Google se aya hai ya nahi
                    const isGoogleUser = user.providerData.some(
                        (provider) => provider.providerId === 'google.com'
                    );

                    if (isGoogleUser) {
                        // Agar naya user Google se hai, to uske liye pehle document create karo
                        console.log("New Google user detected. Creating Firestore document...");
                        const newUserPayload = {
                            role: "admin",
                            email: user.email,
                            status: "active"
                        };
                        await setDoc(userDocRef, newUserPayload);
                        userData = newUserPayload; // Ab is data ko use karo
                    } else {
                        // Agar user kisi aur tareeqe se aya hai aur uska document nahi hai, to log out kardo
                        // Yeh case normal email signup mein nahi aayega kyunke wahan hum pehle hi document banate hain
                        await signOut(auth);
                        return;
                    }
                }

                // Ab user ki status check karo
                if (userData.status === 'disabled') {
                    toast.error("Your account is disabled. Contact Admin.");
                    await signOut(auth);
                    setCurrentUser(null); setUserRole(null); setShopOwnerId(null);
                } else {
                    // Ab state set karo
                    setCurrentUser(user);
                    setUserRole(userData.role);
                    setShopOwnerId(userData.role === 'admin' ? user.uid : userData.adminId);
                }

            } else {
                setCurrentUser(null); setUserRole(null); setShopOwnerId(null);
            }
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const value = { currentUser, userRole, loading, shopOwnerId, signup, login, logout, resetPassword, createCashierAccount, signInWithGoogle };
    
    return (
        <AuthContext.Provider value={value}>
            {!loading && children} 
        </AuthContext.Provider>
    );
}