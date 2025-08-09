// src/components/Header.jsx

import React from 'react';
import { FiGrid, FiShoppingCart, FiPackage, FiUsers, FiBarChart2, FiSettings, FiLogOut, FiMoon, FiSun } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

function DarkModeToggle() { /* Aapka DarkModeToggle ka logic yahan aayega */ }

function Header({ activeTab, setActiveTab, shopName, shopLogo }) {
  const { logout, userRole } = useAuth();
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
    <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-40">
      <div className="container mx-auto px-6 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          {shopLogo && <img src={shopLogo} alt="Shop Logo" className="h-10 w-10 object-contain rounded-full" />}
          <h1 className="text-2xl font-bold text-teal-600 dark:text-teal-400">{shopName}</h1>
        </div>
        
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

        <div className="flex items-center space-x-4">
          <DarkModeToggle />
          <button onClick={logout} className="text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">
            <FiLogOut size={22} />
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;