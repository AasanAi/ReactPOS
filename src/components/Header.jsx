import React, { useState, useEffect } from 'react'; // useEffect ko import karein
import { useAuth } from '../context/AuthContext';
import { FiLogOut, FiMoon, FiSun } from 'react-icons/fi';

// --- YEH NAYA, MUKAMMAL DARK MODE COMPONENT HAI ---
// Isko alag file ki zaroorat nahi
function DarkModeToggle() {
  // Check localStorage for the saved theme
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

  const toggleDarkMode = () => {
    setIsDarkMode(prevMode => !prevMode);
  };

  return (
    <button onClick={toggleDarkMode} className="text-gray-600 dark:text-gray-300 hover:text-teal-500 dark:hover:text-teal-400 transition-colors">
      {isDarkMode ? <FiSun size={22} /> : <FiMoon size={22} />}
    </button>
  );
}


function Header({ activeTab, setActiveTab }) {
  const { logout } = useAuth();
  
  const tabs = ['dashboard', 'pos', 'inventory', 'customers', 'sales report', 'settings'];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-10">
      <div className="container mx-auto px-6 py-3 flex justify-between items-center">
        <h1 className="text-xl font-bold text-teal-600 dark:text-teal-400">Aasan POS</h1>
        <div className="hidden md:flex space-x-4">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`capitalize px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab 
                ? 'bg-teal-600 text-white shadow-sm' 
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex items-center space-x-4">
          {/* Ab yeh component bilkul theek kaam karega */}
          <DarkModeToggle /> 
          <button onClick={handleLogout} className="text-gray-600 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 transition-colors">
            <FiLogOut size={22} />
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;