// src/components/VerifyEmail.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { sendEmailVerification } from 'firebase/auth';
import toast from 'react-hot-toast';

function VerifyEmail() {
  const { currentUser, logout } = useAuth();
  const [isSending, setIsSending] = useState(false);

  // === YEH NAYA AUR ZAROORI CODE HAI ===
  useEffect(() => {
    // Agar user hai, to aek interval shuru karo
    if (currentUser) {
      const interval = setInterval(async () => {
        // Har 5 second ke baad user ki state ko Firebase se reload karo
        await currentUser.reload();
        // Agar reload karne ke baad user ka email verified ho gaya hai...
        if (currentUser.emailVerified) {
          // ...to is interval ko band kar do
          clearInterval(interval);
          // Aur app ko force karo ke woh page refresh kare taake user andar ja sake
          window.location.reload(); 
        }
      }, 5000); // Har 5 second mein check karega

      // Jab component screen se hate, to interval ko saaf kar do
      return () => {
        clearInterval(interval);
      };
    }
  }, [currentUser]);
  // ===================================

  const handleResendEmail = async () => {
    if (!currentUser) return;
    setIsSending(true);
    try {
      await sendEmailVerification(currentUser);
      toast.success('Verification email sent again. Please check your inbox (and spam folder).');
    } catch (error) {
      toast.error('Failed to send email. Please try again later.');
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg text-center">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Verify Your Email</h2>
        <p className="text-gray-600 dark:text-gray-300">
          A verification link has been sent to your email address:
        </p>
        <p className="font-semibold text-teal-600 dark:text-teal-400 break-all">{currentUser?.email}</p>
        <p className="text-gray-600 dark:text-gray-300">
          Please click the link in that email to continue. The page will automatically refresh once you're verified.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <button
            onClick={handleResendEmail}
            disabled={isSending}
            className="w-full bg-teal-600 text-white py-2 rounded-lg font-semibold hover:bg-teal-700 disabled:bg-teal-400"
          >
            {isSending ? 'Sending...' : 'Resend Verification Email'}
          </button>
          <button
            onClick={logout}
            className="w-full bg-gray-500 text-white py-2 rounded-lg font-semibold hover:bg-gray-600"
          >
            Go Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default VerifyEmail;