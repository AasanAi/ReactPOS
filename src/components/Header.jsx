// src/components/Header.jsx

import React, { useState, useEffect } from 'react';
import { FiGrid, FiShoppingCart, FiPackage, FiUsers, FiBarChart2, FiSettings, FiLogOut, FiMoon, FiSun, FiMenu, FiX } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

function DarkModeToggle() {
    const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
    useEffect(() => {
        document.documentElement.classList.toggle('dark', isDarkMode);
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    }, [isDarkMode]);
    return (<button onClick={() => setIsDarkMode(!isDarkMode)} className="text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm p-2.5"><FiSun className="hidden dark:block" size={20} /><FiMoon className="dark:hidden" size={20} /></button>);
}

function Header({ activeTab, setActiveTab, shopName, shopLogo }) {
  const { logout, userRole } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FiGrid, role: 'admin' },
    { id: 'pos', label: 'POS', icon: FiShoppingCart, role: 'any' },
    { id: 'inventory', label: 'Inventory', icon: FiPackage, role: 'any' },
    { id: 'customers', label: 'Customers', icon: FiUsers, role: 'admin' },
    { id: 'sales report', label: 'Sales Report', icon: FiBarChart2, role: 'admin' },
    { id: 'settings', label: 'Settings', icon: FiSettings, role: 'admin' }
  ];

  const filteredNavItems = navItems.filter(item => item.role === 'any' || item.role === userRole);

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-40 relative">
      <div className="container mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
        
        {/* === YEH HAI ASAL FIX WALA SECTION === */}
        {/* Left Side: Burger Menu (Mobile) + Logo + Shop Name */}
        <div className="flex items-center space-x-3">
          {/* Burger Menu Button (Sirf mobile par nazar aayega) */}
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden text-gray-600 dark:text-gray-300">
            {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
          
          {/* Logo aur Shop Name */}
          {shopLogo && <img src={shopLogo} alt="Shop Logo" className="h-10 w-10 object-contain rounded-full" />}
          <h1 className="text-xl md:text-2xl font-bold text-teal-600 dark:text-teal-400">{shopName}</h1>
        </div>
        
        {/* Center: Desktop Menu */}
        <nav className="hidden md:flex space-x-1">
          {filteredNavItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === item.id 
                ? 'bg-teal-600 text-white shadow-sm' 
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Right Side: Actions */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          <DarkModeToggle />
          <button onClick={logout} className="hidden md:block text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">
            <FiLogOut size={22} />
          </button>
          {/* Burger menu button yahan se hata diya gaya hai */}
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white dark:bg-gray-800 shadow-lg p-4">
          <nav className="flex flex-col space-y-2">
            {filteredNavItems.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMenuOpen(false);
                }}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium transition-colors w-full text-left ${
                  activeTab === item.id 
                  ? 'bg-teal-600 text-white' 
                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            ))}
            <button
                onClick={logout}
                className="flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium transition-colors w-full text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
              >
                <FiLogOut className="h-5 w-5" />
                <span>Logout</span>
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}

export default Header;