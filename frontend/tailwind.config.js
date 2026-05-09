/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#e6f0ff',
          100: '#cce0ff',
          400: '#3385ff',
          500: '#0066ff',
          600: '#0052cc',
          700: '#003d99',
        },
        galaxy: {
          50:  '#f0ecf8',
          100: '#e2d9f3',
          200: '#c5b3e7',
          300: '#a490c2',
          400: '#7b6699',
          500: '#4a4e8f',
          600: '#2b1e3e',
          700: '#1e1535',
          800: '#130d22',
          900: '#0a0616',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'glow-sm': '0 0 12px rgba(0, 102, 255, 0.25)',
        'glow':    '0 0 24px rgba(0, 102, 255, 0.35)',
        'glow-lg': '0 0 40px rgba(0, 102, 255, 0.45)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn:  { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(8px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
      },
    },
  },
  plugins: [],
}
