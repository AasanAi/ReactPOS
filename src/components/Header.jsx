import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FiLogOut, FiMoon, FiSun, FiMenu, FiX } from 'react-icons/fi';

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
    <button
      onClick={() => setIsDarkMode(prev => !prev)}
      className="text-gray-600 dark:text-gray-300 hover:text-teal-500 dark:hover:text-teal-400 transition-colors"
    >
      {isDarkMode ? <FiSun size={22} /> : <FiMoon size={22} />}
    </button>
  );
}

function Header({ activeTab, setActiveTab }) {
  const { logout, userRole } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  let tabs = [];
  if (userRole === 'admin') {
    tabs = ['dashboard', 'pos', 'inventory', 'customers', 'sales report', 'settings'];
  } else if (userRole === 'cashier') {
    tabs = ['pos', 'sales report'];
  }

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    setIsMenuOpen(false);
  };

  return (
    <>
      <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-20">
        <div className="container mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsMenuOpen(true)}
              className="md:hidden text-gray-600 dark:text-gray-300"
            >
              <FiMenu size={24} />
            </button>
            <h1 className="text-xl font-bold text-teal-600 dark:text-teal-400">Aasan POS</h1>
          </div>

          <div className="hidden md:flex flex-grow justify-center space-x-2">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => handleTabClick(tab)}
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
            <DarkModeToggle />
            <button
              onClick={handleLogout}
              className="text-gray-600 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            >
              <FiLogOut size={22} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Overlay & Sidebar */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity duration-300 ${
          isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMenuOpen(false)}
      ></div>

      <div
        className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 shadow-xl z-40 transform transition-transform duration-300 ease-in-out ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-teal-600 dark:text-teal-400">Menu</h2>
          <button onClick={() => setIsMenuOpen(false)} className="text-gray-600 dark:text-gray-300">
            <FiX size={24} />
          </button>
        </div>
        <nav className="p-4 flex flex-col space-y-2">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => handleTabClick(tab)}
              className={`w-full text-left capitalize px-3 py-2 font-medium rounded-md transition-colors ${
                activeTab === tab
                  ? 'bg-teal-600 text-white'
                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}

export default Header;
