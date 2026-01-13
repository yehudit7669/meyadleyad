/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    'bg-[#F6F1EC]',
    'bg-[#1F3F3A]',
    'bg-[#C9A24D]',
    'bg-[#B08C3C]',
    'bg-[#8B5A3C]',
    'text-[#E6D3A3]',
    'text-[#C9A24D]',
    'text-[#1F3F3A]',
    'text-[#3A3A3A]',
    'text-[#8B5A3C]',
    'border-[#8B5A3C]',
    'border-[#C9A24D]',
    'border-t-[#8B5A3C]',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        cream: '#F6F1EC',
        darkGreen: '#1F3F3A',
        gold: '#C9A24D',
        goldHover: '#B08C3C',
        brownBorder: '#8B5A3C',
        lightGold: '#E6D3A3',
        darkText: '#3A3A3A',
      },
    },
  },
  plugins: [],
}

