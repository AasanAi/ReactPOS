// src/components/Login.jsx

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiLock, FiMoon, FiSun } from 'react-icons/fi';
import { FaGoogle } from 'react-icons/fa'; 

function DarkModeToggle() {
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);
  return (<button onClick={() => setIsDarkMode(!isDarkMode)} className="text-gray-200 dark:text-gray-300 hover:bg-white/10 rounded-lg text-sm p-2.5"><FiSun className="hidden dark:block" size={20} /><FiMoon className="dark:hidden" size={20} /></button>);
}

function Login() {
  const [isLoginView, setIsLoginView] = useState(true);
  const [loading, setLoading] = useState(false);
  const emailRef = useRef();
  const passwordRef = useRef();
  const passwordConfirmRef = useRef();
  const { signup, login, resetPassword, signInWithGoogle } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const email = emailRef.current.value;
    const password = passwordRef.current.value;
    try {
      if (isLoginView) {
        await login(email, password);
      } else {
        const passwordConfirm = passwordConfirmRef.current.value;
        if (password !== passwordConfirm) throw new Error("Passwords do not match");
        await signup(email, password);
        toast.success('Success! A verification link has been sent to your email.');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to process request.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      toast.error(error.message || "Failed to sign in with Google.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    const email = emailRef.current.value;
    if (!email) { return toast.error("Please enter your email to reset password."); }
    try {
      await resetPassword(email);
      toast.success("Password reset link sent! Check your inbox.");
    } catch (error) { toast.error(error.message || "Failed to send reset link."); }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 animated-gradient-bg">
      <div className="absolute top-4 right-4"><DarkModeToggle /></div>
      
      {/* Bahar wala frame jo border dikhayega */}
      <div className="relative rounded-2xl p-1 bg-gradient-to-r from-teal-400 via-purple-500 to-orange-500 animated-border">
        {/* Andar wala card */}
        <div className="relative w-full max-w-md p-8 space-y-6 rounded-[14px] bg-gray-100 dark:bg-gray-900 glass-card-subtle">
          
          <div className="flex flex-col items-center space-y-4">
            <div className="p-3 bg-gray-500/20 rounded-full">
              <FiLock className="h-8 w-8 text-gray-800 dark:text-white" />
            </div>
            <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white">
              {isLoginView ? 'Welcome to Aasan POS' : 'Create an Account'}
            </h2>
          </div>
          
          <button onClick={handleGoogleSignIn} disabled={loading} className="w-full flex justify-center items-center gap-3 py-3 px-4 bg-gray-200 dark:bg-white/20 border border-gray-300 dark:border-white/30 rounded-lg text-gray-800 dark:text-white font-semibold hover:bg-gray-300 dark:hover:bg-white/30 transition-colors disabled:opacity-50">
            <FaGoogle /> Continue with Google
          </button>
          
          <div className="flex items-center">
            <hr className="flex-grow border-gray-300 dark:border-white/30" />
            <span className="px-4 text-gray-500 dark:text-white/80">OR</span>
            <hr className="flex-grow border-gray-300 dark:border-white/30" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-bold text-gray-600 dark:text-gray-300">Email Address</label>
              <input type="email" ref={emailRef} required className="w-full p-3 mt-1 bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-400 rounded-lg border border-gray-300 dark:border-gray-600 focus:border-teal-500 focus:ring-2 focus:ring-teal-500 transition-all" />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-600 dark:text-gray-300">Password</label>
              <input type="password" ref={passwordRef} required className="w-full p-3 mt-1 bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-400 rounded-lg border border-gray-300 dark:border-gray-600 focus:border-teal-500 focus:ring-2 focus:ring-teal-500 transition-all" />
            </div>
            {!isLoginView && (<div><label className="text-sm font-bold text-gray-600 dark:text-gray-300">Confirm Password</label><input type="password" ref={passwordConfirmRef} required className="w-full p-3 mt-1 bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-400 rounded-lg border border-gray-300 dark:border-gray-600 focus:border-teal-500 focus:ring-2 focus:ring-teal-500 transition-all" /></div>)}
            
            {isLoginView && (<div className="text-right"><button type="button" onClick={handlePasswordReset} className="text-sm text-teal-600 dark:text-teal-400 hover:underline font-semibold">Forgot Password?</button></div>)}
            
            <button type="submit" disabled={loading} className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 rounded-lg text-white text-lg font-semibold transition-colors disabled:bg-teal-400 disabled:cursor-not-allowed shadow-lg">
              {loading ? 'Processing...' : (isLoginView ? 'Log In' : 'Sign Up')}
            </button>
          </form>
          
          <p className="text-center text-sm text-gray-600 dark:text-gray-300">
            {isLoginView ? "Don't have an account?" : 'Already have an account?'}
            <button type="button" onClick={() => setIsLoginView(!isLoginView)} className="ml-1 text-teal-600 hover:underline dark:text-teal-400 font-semibold">{isLoginView ? 'Sign Up' : 'Log In'}</button>
          </p>

        </div>
      </div>
    </div>
  );
}

export default Login;