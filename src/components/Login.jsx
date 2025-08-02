// src/components/Login.jsx

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiLock, FiMoon, FiSun } from 'react-icons/fi';

// --- NAYE IMPORTS ---
import { FcGoogle } from 'react-icons/fc';
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from '../firebase'; // Apne firebase config file se import karein

// Dark Mode Toggle, is code ko change nahi kiya gaya
function DarkModeToggle() {
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  useEffect(() => {
    const root = window.document.documentElement;
    const oldTheme = isDarkMode ? 'light' : 'dark';
    root.classList.remove(oldTheme);
    root.classList.add(isDarkMode ? 'dark' : 'light');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  return (
    <button onClick={() => setIsDarkMode(!isDarkMode)} className="text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm p-2.5">
      {isDarkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
    </button>
  );
}

function Login() {
  const [isLoginView, setIsLoginView] = useState(true);
  const [loading, setLoading] = useState(false);
  const emailRef = useRef();
  const passwordRef = useRef();
  const passwordConfirmRef = useRef();
  const { signup, login, resetPassword } = useAuth();

  // --- NAYA FUNCTION: Google Sign-in ke liye ---
  const handleGoogleSignIn = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    const toastId = toast.loading("Connecting with Google...");
    
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // Agar user naya hai, to uske liye 'Admin' account banayein
        await setDoc(userDocRef, {
          uid: user.uid,
          name: user.displayName || 'New User',
          email: user.email,
          role: 'Admin',
          status: 'active',
          createdAt: new Date(),
          businessName: `${user.displayName}'s Store`
        });
        toast.success(`Welcome ${user.displayName}! Your account is ready.`, { id: toastId });
      } else {
        // Purana user hai, bas welcome back bolein
        toast.success(`Welcome back, ${user.displayName}!`, { id: toastId });
      }
      // Context baqi kaam khud karlega
    } catch (error) {
      console.error("Google sign-in error:", error);
      if (error.code !== 'auth/popup-closed-by-user') {
        toast.error(error.message || "Google sign-in failed.", { id: toastId });
      } else {
        toast.dismiss(toastId);
      }
    } finally {
      setLoading(false);
    }
  };

  // Aapka original handleSubmit, isko change nahi kiya gaya
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const email = emailRef.current.value;
    const password = passwordRef.current.value;

    try {
      if (isLoginView) {
        await login(email, password);
        toast.success('Logged in successfully!');
      } else {
        const passwordConfirm = passwordConfirmRef.current.value;
        if (password !== passwordConfirm) {
          throw new Error("Passwords do not match");
        }
        await signup(email, password);
        toast.success('Account created successfully! Please log in.');
        setIsLoginView(true);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to process request.');
    } finally {
      setLoading(false);
    }
  };

  // Aapka original handlePasswordReset, isko change nahi kiya gaya
  const handlePasswordReset = async () => {
    const email = emailRef.current.value;
    if (!email) {
      return toast.error("Please enter your email to reset password.");
    }
    try {
      await resetPassword(email);
      toast.success("Password reset link sent! Check your inbox.");
    } catch (error) {
      toast.error(error.message || "Failed to send reset link.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="absolute top-4 right-4">
        <DarkModeToggle />
      </div>
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg animate-fade-in-up">
        <div className="flex flex-col items-center space-y-4">
          <div className="p-3 bg-teal-100 dark:bg-teal-900 rounded-full">
            <FiLock className="h-8 w-8 text-teal-600 dark:text-teal-400" />
          </div>
          <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white">
            {isLoginView ? 'Welcome to Aasan POS' : 'Create an Account'}
          </h2>
        </div>

        {/* --- NAYA GOOGLE BUTTON AUR "OR" DIVIDER --- */}
        <div className="space-y-4">
            <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
                <FcGoogle size={24} />
                <span>Continue with Google</span>
            </button>
        </div>

        <div className="flex items-center">
            <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
            <span className="mx-4 text-xs font-semibold text-gray-400 dark:text-gray-500">OR</span>
            <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
        </div>
        {/* --- YAHAN TAK NAYA CODE HAI --- */}


        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-bold text-gray-600 dark:text-gray-300">Email Address</label>
            <input type="email" ref={emailRef} required className="w-full p-3 mt-1 bg-gray-100 dark:bg-gray-700 dark:text-white rounded-lg border border-gray-300 dark:border-gray-600 focus:border-teal-500 focus:ring-2 focus:ring-teal-500 transition-all" />
          </div>
          <div>
            <label className="text-sm font-bold text-gray-600 dark:text-gray-300">Password</label>
            <input type="password" ref={passwordRef} required className="w-full p-3 mt-1 bg-gray-100 dark:bg-gray-700 dark:text-white rounded-lg border border-gray-300 dark:border-gray-600 focus:border-teal-500 focus:ring-2 focus:ring-teal-500 transition-all" />
          </div>
          {!isLoginView && (
            <div>
              <label className="text-sm font-bold text-gray-600 dark:text-gray-300">Confirm Password</label>
              <input type="password" ref={passwordConfirmRef} required className="w-full p-3 mt-1 bg-gray-100 dark:bg-gray-700 dark:text-white rounded-lg border border-gray-300 dark:border-gray-600 focus:border-teal-500 focus:ring-2 focus:ring-teal-500 transition-all" />
            </div>
          )}
          {isLoginView && (
            <div className="text-right">
                <button type="button" onClick={handlePasswordReset} className="text-sm text-teal-600 hover:underline dark:text-teal-400 font-semibold">
                    Forgot Password?
                </button>
            </div>
          )}
          <button type="submit" disabled={loading} className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 rounded-lg text-white text-lg font-semibold transition-colors disabled:bg-teal-400 disabled:cursor-not-allowed">
            {loading ? 'Processing...' : (isLoginView ? 'Log In' : 'Sign Up')}
          </button>
        </form>
        
        <p className="text-center text-sm text-gray-600 dark:text-gray-300">
          {isLoginView ? "Don't have an account?" : 'Already have an account?'}
          <button type="button" onClick={() => setIsLoginView(!isLoginView)} className="ml-1 text-teal-600 hover:underline dark:text-teal-400 font-semibold">
            {isLoginView ? 'Sign Up' : 'Log In'}
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;