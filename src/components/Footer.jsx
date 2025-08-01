import React from 'react';
import { FaWhatsapp, FaLinkedin, FaEnvelope } from 'react-icons/fa'; // Icons ko import karein

function Footer() {
  const whatsappNumber = "923337304781"; // Pakistan ke code (+92) ke saath, lekin plus sign ke bina
  const emailAddress = "aasanai2025@gmail.com";
  const linkedinUrl = "https://www.linkedin.com/in/mr-saleem-ullah/";

  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
      <div className="container mx-auto px-6 py-4 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-600 dark:text-gray-400">
        
        {/* Left Side: Copyright and Creator Name */}
        <div className="text-center sm:text-left mb-2 sm:mb-0">
          <p>© {new Date().getFullYear()} Aasan POS. All Rights Reserved.</p>
          <p>Created by <span className="font-semibold text-teal-600 dark:text-teal-400">Saleem Ullah</span></p>
        </div>

        {/* Right Side: Social Icons */}
        <div className="flex items-center space-x-5">
          <a 
            href={`https://wa.me/${whatsappNumber}?text=Hello%20from%20Aasan%20POS!`}
            target="_blank" 
            rel="noopener noreferrer"
            aria-label="Chat on WhatsApp"
            className="hover:text-green-500 transition-colors"
          >
            <FaWhatsapp size={22} />
          </a>
          <a 
            href={`mailto:${emailAddress}`}
            aria-label="Send an Email"
            className="hover:text-red-500 transition-colors"
          >
            <FaEnvelope size={22} />
          </a>
          <a 
            href={linkedinUrl}
            target="_blank" 
            rel="noopener noreferrer"
            aria-label="View LinkedIn Profile"
            className="hover:text-blue-500 transition-colors"
          >
            <FaLinkedin size={22} />
          </a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;