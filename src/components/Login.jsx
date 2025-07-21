import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiMoon, FiSun } from 'react-icons/fi'; // Dark mode ke liye icons
import { useEffect } from 'react';

// Yeh DarkModeToggle component sirf is file ke andar rakha gaya hai
function DarkModeToggle() {
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  return (
    <button onClick={() => setIsDarkMode(prev => !prev)} className="text-gray-600 dark:text-gray-300 hover:text-teal-500 dark:hover:text-teal-400 transition-colors">
      {isDarkMode ? <FiSun size={22} /> : <FiMoon size={22} />}
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
        toast.success('Account created successfully!');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to process request.');
    } finally {
      setLoading(false);
    }
  };

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="absolute top-4 right-4">
        <DarkModeToggle />
      </div>
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white">
          {isLoginView ? 'Welcome to Aasan POS' : 'Create an Account'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-bold text-gray-600 dark:text-gray-300">Email</label>
            <input type="email" ref={emailRef} required className="w-full p-2 mt-1 bg-gray-100 dark:bg-gray-700 dark:text-white rounded border border-gray-300 dark:border-gray-600 focus:border-teal-500 focus:ring-teal-500" />
          </div>
          <div>
            {/* --- YAHAN GALTI THEEK KAR DI GAYI HAI --- */}
            <label className="text-sm font-bold text-gray-600 dark:text-gray-300">Password</label>
            <input type="password" ref={passwordRef} required className="w-full p-2 mt-1 bg-gray-100 dark:bg-gray-700 dark:text-white rounded border border-gray-300 dark:border-gray-600 focus:border-teal-500 focus:ring-teal-500" />
          </div>
          {!isLoginView && (
            <div>
              {/* --- YAHAN BHI GALTI THEEK KAR DI GAYI HAI --- */}
              <label className="text-sm font-bold text-gray-600 dark:text-gray-300">Confirm Password</label>
              <input type="password" ref={passwordConfirmRef} required className="w-full p-2 mt-1 bg-gray-100 dark:bg-gray-700 dark:text-white rounded border border-gray-300 dark:border-gray-600 focus:border-teal-500 focus:ring-teal-500" />
            </div>
          )}
          <button type="submit" disabled={loading} className="w-full py-2 px-4 bg-teal-600 hover:bg-teal-700 rounded-md text-white text-lg font-semibold transition-colors disabled:bg-teal-400">
            {loading ? 'Processing...' : (isLoginView ? 'Log In' : 'Sign Up')}
          </button>
        </form>
        <div className="text-center">
          <button onClick={handlePasswordReset} className="text-sm text-teal-600 hover:underline dark:text-teal-400">
            Forgot Password?
          </button>
        </div>
        <p className="text-center text-sm text-gray-600 dark:text-gray-300">
          {isLoginView ? "Don't have an account?" : 'Already have an account?'}
          <button onClick={() => setIsLoginView(!isLoginView)} className="ml-1 text-teal-600 hover:underline dark:text-teal-400 font-semibold">
            {isLoginView ? 'Sign Up' : 'Log In'}
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;