/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF6B35',
          50:  '#FFF3EE',
          100: '#FFE0D0',
          200: '#FFC0A1',
          300: '#FF9B71',
          400: '#FF7D4B',
          500: '#FF6B35',
          600: '#E85520',
          700: '#C44318',
          800: '#9E3412',
          900: '#7A280D',
        },
        dark: {
          DEFAULT: '#0A0A0A',
          100: '#111111',
          200: '#1A1A1A',
          300: '#222222',
          400: '#2A2A2A',
          500: '#333333',
        },
        accent: '#00D4FF',
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'float':       'float 6s ease-in-out infinite',
        'pulse-slow':  'pulse 3s ease-in-out infinite',
        'shimmer':     'shimmer 1.5s infinite',
        'slide-up':    'slideUp 0.5s ease-out',
        'fade-in':     'fadeIn 0.4s ease-out',
      },
      keyframes: {
        float:   { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-16px)' } },
        slideUp: { '0%': { transform: 'translateY(20px)', opacity: 0 }, '100%': { transform: 'translateY(0)', opacity: 1 } },
        fadeIn:  { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
      },
      boxShadow: {
        glow:    '0 0 20px rgba(255,107,53,0.3)',
        'glow-lg': '0 0 40px rgba(255,107,53,0.4)',
        card:    '0 4px 24px rgba(0,0,0,0.4)',
      },
    },
  },
  plugins: [],
}
