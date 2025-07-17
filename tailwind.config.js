/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // <--- YEH NAYI LINE ADD KAREIN
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      // ... aapki purani keyframes aur animation ki settings wesi hi rahengi ...
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.5s ease-out'
      }
    },
  },
  plugins: [],
}