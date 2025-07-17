// src/components/Header.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle'; // Naya component import karein

function Header({ activeTab, setActiveTab }) {
  const tabs = ['dashboard', 'pos', 'inventory', 'sales report', 'settings'];
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      alert("Failed to log out");
    }
  };

  return (
    <header className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg dark:bg-gray-800 dark:from-gray-700 dark:to-gray-800">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-wider">Aasan POS</h1>
        <nav className="hidden md:flex items-center space-x-6">
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`capitalize pb-1 transition-all duration-300 ${activeTab === tab ? "font-bold border-b-2 border-white" : "text-gray-300 hover:text-white"}`}>
              {tab}
            </button>
          ))}
        </nav>
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
export default Header;