/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#FF385C',
        'primary-dark': '#E3243E',
        secondary: '#0070F3',
        'secondary-dark': '#0052CC',
        accent: '#00D1B2',
        'accent-dark': '#00A08C',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        gray: {
        }
      },
      spacing: {
        '72': '18rem',
        '84': '21rem',
        '96': '24rem',
      },
      fontSize: {
        'xxs': '0.625rem',
      },
      boxShadow: {
        'glow': '0 0 10px rgba(255, 56, 92, 0.5)',
      },
    },
  },
  plugins: [],
};