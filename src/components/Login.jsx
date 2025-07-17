import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const { signup, login, resetPassword } = useAuth();

  const handleAuth = async (e) => {
    e.preventDefault();
    if (isSigningUp && password !== confirmPassword) {
      return toast.error("Passwords do not match!");
    }
    try {
      if (isSigningUp) {
        await signup(email, password);
        toast.success('Account created! Please log in.');
        setIsSigningUp(false);
      } else {
        await login(email, password);
        toast.success('Logged in successfully!');
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      return toast.error("Please enter your email address.");
    }
    try {
      await resetPassword(email);
      toast.success("If an account exists, a password reset link has been sent.");
    } catch (error) {
      toast.error(error.message);
    }
  };
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center text-teal-600 dark:text-teal-400">Aasan POS</h1>
        <h2 className="text-xl font-bold text-center text-gray-700 dark:text-gray-200">{isSigningUp ? 'Create a New Account' : 'Welcome Back!'}</h2>
        <form onSubmit={handleAuth} className="space-y-6">
          <div>
            <label htmlFor="email" className="text-sm font-bold text-gray-600 dark:text-gray-300 block">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2 mt-1 text-gray-800 bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500" required />
          </div>
          <div>
            <label htmlFor="password"className="text-sm font-bold text-gray-600 dark:text-gray-300 block">Password</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-2 mt-1 text-gray-800 bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500" required />
          </div>
          {isSigningUp && (
            <div>
              <label htmlFor="confirmPassword"className="text-sm font-bold text-gray-600 dark:text-gray-300 block">Confirm Password</label>
              <input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full p-2 mt-1 text-gray-800 bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500" required />
            </div>
          )}
          <div><button type="submit" className="w-full py-2 px-4 text-white bg-teal-600 rounded-md hover:bg-teal-700 font-semibold">{isSigningUp ? 'Sign Up' : 'Log In'}</button></div>
        </form>
        <div className="flex justify-between items-center text-sm">
          {!isSigningUp && (<button onClick={handleForgotPassword} className="text-blue-600 dark:text-blue-400 hover:underline">Forgot Password?</button>)}
          <button onClick={() => setIsSigningUp(!isSigningUp)} className={`text-blue-600 dark:text-blue-400 hover:underline ${isSigningUp ? 'w-full text-center' : ''}`}>{isSigningUp ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}</button>
        </div>
      </div>
    </div>
  );
}
export default Login;