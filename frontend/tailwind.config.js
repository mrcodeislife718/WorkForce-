/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        orca: {
          black: '#05070B',
          white: '#FFFFFF',
          'deep-blue': '#0E4DFF',
          'aqua': '#22C9FF',
          'slate': '#1A2230',
          'steel': '#6E7B8F',
          'mist': '#D9E2EE',
        }
      }
    },
  },
  plugins: [],
}
