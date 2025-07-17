import React from 'react';

function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-teal-600 dark:border-teal-400"></div>
      <p className="mt-4 text-lg text-gray-700 dark:text-gray-200">Loading Aasan POS...</p>
    </div>
  );
}
export default LoadingSpinner;