/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f4ff',
          100: '#ebe8ff',
          200: '#d3ccff',
          300: '#b3a0ff',
          400: '#8f65ff',
          500: '#7133ff',
          600: '#5c1bdb',
          700: '#4a16b0',
          800: '#3e158b',
          900: '#351371'
        }
      }
    }
  },
  plugins: []
};
