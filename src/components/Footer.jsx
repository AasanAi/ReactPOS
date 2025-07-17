import React from 'react';

function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-4 mt-8">
      <div className="container mx-auto px-6 text-center text-gray-400">
        <p>© {new Date().getFullYear()} Aasan POS System. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;