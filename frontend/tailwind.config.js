// tailwind.config.js

/** @type {import('tailwindcss').Config} */
module.exports = {
  
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}", 
  ],
  theme: {
    extend: {
      colors: {
        
        'ins-primary': '#004D99', 
        'ins-accent': '#FFA500',  
      },
    },
  },
  plugins: [],
}