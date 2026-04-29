/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#1e2d4d',
          600: '#162238',
          700: '#0f1a2e',
          800: '#0a1220',
          900: '#060c16',
          950: '#030609',
        },
        gold: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#c9a84c',
          600: '#b8952e',
          700: '#9a7a20',
          800: '#7c5f18',
          900: '#5c4510',
        },
        surface: {
          DEFAULT: '#0f1a2e',
          card:    '#162238',
          elevated:'#1e2d4d',
          border:  '#243351',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'card':     '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
        'card-lg':  '0 4px 24px rgba(0,0,0,0.5)',
        'gold':     '0 0 20px rgba(201,168,76,0.15)',
        'glow':     '0 0 40px rgba(201,168,76,0.08)',
      },
      backgroundImage: {
        'gradient-navy':  'linear-gradient(135deg, #0a1220 0%, #162238 50%, #0f1a2e 100%)',
        'gradient-gold':  'linear-gradient(135deg, #c9a84c 0%, #fbbf24 50%, #c9a84c 100%)',
        'gradient-card':  'linear-gradient(135deg, #162238 0%, #1e2d4d 100%)',
        'gradient-hero':  'linear-gradient(135deg, #060c16 0%, #0f1a2e 40%, #162238 100%)',
      },
      animation: {
        'shimmer': 'shimmer 2s infinite linear',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in': 'slideIn 0.25s ease-out',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateX(-12px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}
