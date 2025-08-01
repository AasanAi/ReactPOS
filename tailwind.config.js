/** @type {import('tailwindcss').Config} */
module.exports = {
  // Yeh darkMode class par based hoga, jo hum toggle se laga rahe hain
  darkMode: 'class', 

  // --- YEH SABSE ZAROORI HISSA HAI ---
  // Yeh Tailwind ko batata hai ki use kon kon si files dekhni hain
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // src folder ke andar saari JS/JSX files
    "./public/index.html"
  ],

  theme: {
    extend: {},
  },
  plugins: [],
}