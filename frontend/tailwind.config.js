/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        metro: {
          red: '#E21B28',
          blue: '#0066B3',
          yellow: '#F7B500',
          green: '#00A550',
          violet: '#8B008B',
          pink: '#E91E8C',
          magenta: '#D81F98',
          grey: '#808080',
          rapid: '#F04E98',
        }
      }
    },
  },
  plugins: [],
}
